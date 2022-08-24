import { createWriteStream } from "fs";
import { readFile as readFileAsync, mkdir as mkdirAsync } from "fs/promises";
import { join } from "path";

import Database from "better-sqlite3";
import * as csv from "fast-csv";

import AbstractDataController from "../../core/AbstractDataController";
import GtfsBaseDataController from "../GtfsBaseDataController";

import { GtfsFeedMetadata } from "../index.d";

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
    `;

    return db.prepare(q).all();
  }

  async createAllStopsCsv() {
    const gtfsAgencyFeedVersions =
      await this.getProjectGtfsAgencyFeedVersions();

    const gtfsAgencyFeedDbsMeta = gtfsAgencyFeedVersions.map(
      ({ gtfs_agency_name, gtfs_feed_version }) => {
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
        };
      }
    );

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

    return { gtfsStopsSubsetName };
  }
}
