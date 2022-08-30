import { createWriteStream } from "fs";
import { readFile as readFileAsync, mkdir as mkdirAsync } from "fs/promises";
import { join } from "path";

import Database from "better-sqlite3";
import * as csv from "fast-csv";
import _ from "lodash";
import * as turf from "@turf/turf";

import AbstractDataController from "../../core/AbstractDataController";
import GtfsBaseDataController from "../GtfsBaseDataController";
import RegionBoundariesDerivedDataController from "../../RegionBoundariesController/RegionBoundariesDerivedDataController";

import { getGeometriesHullAsync } from "../../utils/hulls";

import {
  GtfsAgencyName,
  GtfsRouteId,
  GtfsRouteShortName,
  GtfsRouteLongName,
  GtfsFeedMetadata,
} from "../index.d";

const DEFAULT_BUFFER_MI = 15;

export default class GtfsDerivedDataController extends AbstractDataController {
  constructor(dir?: string) {
    super(dir);
  }

  protected async initializeDatabaseTables() {
    const sql = await readFileAsync(
      join(__dirname, "./sql/create_control_metadata_tables.sql"),
      { encoding: "utf-8" }
    );

    const db = await this.getDB();

    db.exec(sql);
  }

  async addGtfsAgencyToProject(gtfsAgencyName: string) {
    const db = await this.getDB();

    const q = `
      INSERT INTO gtfs_agencies (
        gtfs_agency_name
      ) VALUES ( ? )
        ON CONFLICT(gtfs_agency_name)
          DO NOTHING
    `;

    db.prepare(q).run([gtfsAgencyName]);
  }

  async setGtfsAgencyFeedVersionForProject({
    gtfsAgencyName,
    gtfsFeedVersion,
  }: GtfsFeedMetadata) {
    const db = await this.getDB();

    const q = `
      INSERT INTO gtfs_agency_feed_versions (
        gtfs_agency_name,
        gtfs_feed_version
      ) VALUES ( ?, ? )
        ON CONFLICT(gtfs_agency_name)
          DO UPDATE SET gtfs_feed_version = excluded.gtfs_feed_version

    `;

    db.prepare(q).run([gtfsAgencyName, gtfsFeedVersion]);
  }

  get gtfsStopsDir() {
    return join(this.dir, "gtfs_stops");
  }

  async getProjectGtfsAgencyFeedVersions() {
    const db = await this.getDB();

    const q = `
      SELECT
          gtfs_agency_name,
          gtfs_feed_version
        FROM gtfs_agency_feed_versions
        ORDER BY 1
    `;

    return db.prepare(q).all();
  }

  async updateGtfsStopsSubsetsMetadata(
    gtfsStopsSubsetName: string,
    metadata: object
  ) {
    const db = await this.getDB();

    const insertMetaSql = `
      INSERT INTO gtfs_stops_subsets (
        gtfs_stops_subset_name,
        metadata
      ) VALUES ( ?, ? )
        ON CONFLICT (gtfs_stops_subset_name)
          DO UPDATE SET metadata = excluded.metadata
    `;

    db.prepare(insertMetaSql).run([
      gtfsStopsSubsetName,
      JSON.stringify(metadata),
    ]);
  }

  async getAllAgenciesFeedsMetadata() {
    const gtfsAgencyFeedVersions =
      await this.getProjectGtfsAgencyFeedVersions();

    const allAgenciesFeedsMetadata = await Promise.all(
      gtfsAgencyFeedVersions.map(
        async ({ gtfs_agency_name, gtfs_feed_version }) => {
          const gtfs_feed_version_zip_path =
            await GtfsBaseDataController.getGtfsFeedFilePath(
              gtfs_agency_name,
              gtfs_feed_version
            );

          const gtfs_feed_version_db_path =
            GtfsBaseDataController.getGtfsAgencyFeedVersionDbPath(
              gtfs_agency_name,
              gtfs_feed_version
            );

          if (!gtfs_feed_version_db_path) {
            throw new Error(
              `No GTFS DB found in the base data for agency ${gtfs_agency_name} feed version ${gtfs_feed_version}.`
            );
          }

          return {
            gtfs_agency_name,
            gtfs_feed_version,
            gtfs_feed_version_db_path,
            gtfs_feed_version_zip_path,
          };
        }
      )
    );

    return allAgenciesFeedsMetadata;
  }

  async createAllStopsCsv() {
    const gtfsAgencyFeedVersions =
      await this.getProjectGtfsAgencyFeedVersions();

    const gtfsAgencyFeedDbsMeta = await this.getAllAgenciesFeedsMetadata();

    await mkdirAsync(this.gtfsStopsDir, { recursive: true });

    const gtfsStopsSubsetName = "all_stops";

    const csvPath = join(this.gtfsStopsDir, `${gtfsStopsSubsetName}.csv`);

    const ws = createWriteStream(csvPath);

    const stream = csv.format({ headers: ["stop_id", "stop_lat", "stop_lon"] });

    stream.pipe(ws);

    const q = `
      SELECT
          stop_id,
          stop_lat,
          stop_lon
        FROM stops
        ORDER BY stop_id
    `;

    for (const {
      gtfs_agency_name,
      gtfs_feed_version_db_path,
    } of gtfsAgencyFeedDbsMeta) {
      const gtfsDb = new Database(gtfs_feed_version_db_path);

      const iter = gtfsDb.prepare(q).iterate();

      for (const { stop_id, stop_lat, stop_lon } of iter) {
        if (/::/.test(stop_id)) {
          throw new Error("We need another delimiter for agency_name/stop_id");
        }

        stream.write({
          stop_id: `${gtfs_agency_name}::${stop_id}`,
          stop_lat,
          stop_lon,
        });
      }

      gtfsDb.close();
    }

    stream.end();

    const metadata = {
      type: "ALL_AGENCIES_ALL_STOPS",
      gtfsAgencyFeedVersions,
    };

    await this.updateGtfsStopsSubsetsMetadata(gtfsStopsSubsetName, metadata);

    return { gtfsStopsSubsetName };
  }

  async getAgencyFeedVersion(gtfsAgencyName: GtfsAgencyName) {
    const db = await this.getDB();

    const q = `
      SELECT
          gtfs_feed_version
        FROM gtfs_agency_feed_versions
        WHERE ( gtfs_agency_name = ? )
    `;

    const gtfsFeedVersion = db.prepare(q).pluck().get([gtfsAgencyName]);

    if (!gtfsFeedVersion) {
      throw new Error(`No gtfsFeedVersion found for agency ${gtfsAgencyName}.`);
    }

    return gtfsFeedVersion;
  }

  async listGtfsRoutesForAgency(gtfsAgencyName: GtfsAgencyName): Promise<
    {
      gtfsRouteId: GtfsRouteId;
      gtfsRouteShortName: GtfsRouteShortName;
      gtfsRouteLongName: GtfsRouteLongName;
    }[]
  > {
    const gtfsFeedVersion = await this.getAgencyFeedVersion(gtfsAgencyName);

    const gtfsDbPath = GtfsBaseDataController.getGtfsAgencyFeedVersionDbPath(
      gtfsAgencyName,
      gtfsFeedVersion
    );

    const gtfsDb = new Database(gtfsDbPath);

    const q = `
      SELECT DISTINCT
          route_id          AS gtfsRouteId,
          route_short_name  AS gtfsRouteShortName,
          route_long_name   AS gtfsRouteLongName
        FROM routes
        ORDER BY 1
    `;

    const rows = gtfsDb.prepare(q).all();

    return rows;
  }

  async *makeAgencyFeedShapesAsyncGenerator(
    gtfsAgencyName: string
  ): AsyncGenerator<turf.Feature<turf.LineString>> {
    const gtfsFeedVersion = await this.getAgencyFeedVersion(gtfsAgencyName);

    const iter = GtfsBaseDataController.makeGtfsFeedShapesIterator(
      gtfsAgencyName,
      gtfsFeedVersion
    );

    for await (const feature of iter) {
      yield feature;
    }
  }

  async *makeAllAgenciesShapesAsyncGenerator(): AsyncGenerator<
    turf.Feature<turf.LineString>
  > {
    const gtfsAgencyFeedDbsMeta = await this.getAllAgenciesFeedsMetadata();

    for (const {
      gtfs_agency_name,
      gtfs_feed_version,
    } of gtfsAgencyFeedDbsMeta) {
      const iter = this.makeAgencyFeedShapesAsyncGenerator(gtfs_agency_name);

      for await (const feature of iter) {
        await new Promise((resolve) => process.nextTick(resolve));

        // @ts-ignore
        feature.properties.gtfsAgencyName = gtfs_agency_name;
        // @ts-ignore
        feature.properties.gtfsFeedVersion = gtfs_feed_version;

        yield feature;
      }
    }
  }

  async *makePolyGenerator(bufferMiles: number = DEFAULT_BUFFER_MI) {
    const iter = this.makeAllAgenciesShapesAsyncGenerator();
    for await (const feature of iter) {
      await new Promise((resolve) => process.nextTick(resolve));

      const poly = turf.buffer(feature, bufferMiles, { units: "miles" });
      yield poly;
    }
  }

  async createAgencyRouteStopsCsv(
    gtfsAgencyName: GtfsAgencyName,
    gtfsRouteId: GtfsRouteId
  ) {
    const gtfsFeedVersion = await this.getAgencyFeedVersion(gtfsAgencyName);

    const gtfsDbPath = GtfsBaseDataController.getGtfsAgencyFeedVersionDbPath(
      gtfsAgencyName,
      gtfsFeedVersion
    );

    await mkdirAsync(this.gtfsStopsDir, { recursive: true });

    const normalizedRouteName = _.snakeCase(gtfsRouteId);
    const gtfsStopsSubsetName = `${gtfsAgencyName}-route${normalizedRouteName}-stops`;

    const csvPath = join(this.gtfsStopsDir, `${gtfsStopsSubsetName}.csv`);

    const ws = createWriteStream(csvPath);

    const stream = csv.format({ headers: ["stop_id", "stop_lat", "stop_lon"] });

    stream.pipe(ws);

    const q = `
      SELECT DISTINCT
          stop_id,
          stop_lat,
          stop_lon
        FROM stops
          INNER JOIN stop_times
            USING (stop_id)
          INNER JOIN trips
            USING (trip_id)
        WHERE ( route_id = ? )
        ORDER BY stop_id
    `;

    const gtfsDb = new Database(gtfsDbPath);

    const iter = gtfsDb.prepare(q).iterate([gtfsRouteId]);

    for (const { stop_id, stop_lat, stop_lon } of iter) {
      if (/::/.test(stop_id)) {
        throw new Error("We need another delimiter for agency_name/stop_id");
      }

      stream.write({
        stop_id: `${gtfsAgencyName}::${stop_id}`,
        stop_lat,
        stop_lon,
      });
    }

    stream.end();
    gtfsDb.close();

    const metadata = {
      type: "AGENCY_ROUTE_STOPS",
      gtfsAgencyName,
      gtfsFeedVersion,
      gtfsRouteId,
      gtfsStopsSubsetName,
    };

    await this.updateGtfsStopsSubsetsMetadata(gtfsStopsSubsetName, metadata);

    return { gtfsStopsSubsetName };
  }

  async createAllAgenciesHull({
    bufferMiles = DEFAULT_BUFFER_MI,
    concavity = 10,
  }) {
    const gtfsAgencyFeedVersions =
      await this.getProjectGtfsAgencyFeedVersions();

    const polyGenerator = this.makePolyGenerator(bufferMiles);

    const regionBoundary = await getGeometriesHullAsync(
      concavity,
      // @ts-ignore
      polyGenerator
    );

    const regionBoundaryName = `all_agencies.buffer-${bufferMiles}mi_concavity-${concavity}`;

    const metadata = {
      type: "ALL_AGENCIES_BUFFER_HULL",
      regionBoundaryName,
      gtfsAgencyFeedVersions,
      bufferMiles,
      concavity,
    };

    const regionsBoundaryController = new RegionBoundariesDerivedDataController(
      this.dir
    );

    await regionsBoundaryController.addRegionBoundary(
      regionBoundary,
      regionBoundaryName,
      metadata
    );

    return { regionBoundaryName };
  }
}
