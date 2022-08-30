import Database from "better-sqlite3";
import { existsSync, mkdirSync, createReadStream } from "fs";
import { rename as renameAsync } from "fs/promises";

import {
  mkdir as mkdirAsync,
  readFile as readFileAsync,
  rm as rmAsync,
  copyFile as copyFileAsync,
} from "fs/promises";

import { join, basename } from "path";

import * as turf from "@turf/turf";
import tmp from "tmp";
import AbstractBaseDataController from "../../core/AbstractBaseDataController";

import loadGtfsIntoSqlite from "./subtasks/loadGtfsIntoSqlite";
import getHash from "../../utils/getHash";

import { GtfsAgencyName, GtfsFeedVersion } from "../index.d";
import { gtfsFeedZipPath } from "../tasks/task_wrappers";

export type AddGtfsFeedParams = {
  gtfsAgencyName: GtfsAgencyName;
  gtfsFeedVersion?: GtfsFeedVersion;
  gtfsFeedZipPath: string;
};

export class GtfsBaseDataController extends AbstractBaseDataController {
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

  get gtfsDir() {
    return join(this.dir, "gtfs");
  }

  get gtfsTmpDir() {
    return join(this.gtfsDir, "tmp");
  }

  getGtfsAgencyDir(gtfsAgencyName: string) {
    return join(this.gtfsDir, gtfsAgencyName);
  }

  getGtfsAgencyFeedVersionDir(gtfsAgencyName: string, gtfsFeedVersion: string) {
    return join(this.getGtfsAgencyDir(gtfsAgencyName), gtfsFeedVersion);
  }

  // Note: we preserve the original file name. (requiring the /gtfs/agency/version directory structure.)
  getGtfsAgencyFeedVersionZipPath(
    gtfsAgencyName: string,
    gtfsFeedVersion: string,
    gtfsFeedFileName: string
  ) {
    return join(
      this.getGtfsAgencyFeedVersionDir(gtfsAgencyName, gtfsFeedVersion),
      gtfsFeedFileName
    );
  }

  getGtfsAgencyFeedVersionDbPath(
    gtfsAgencyName: string,
    gtfsFeedVersion: string
  ) {
    const fname = `${gtfsAgencyName}_${gtfsFeedVersion}.sqlite3`;

    return join(
      this.getGtfsAgencyFeedVersionDir(gtfsAgencyName, gtfsFeedVersion),
      fname
    );
  }

  async getGtfsFeedFilePath(gtfsAgencyName: string, gtfsFeedVersion: string) {
    const db = await this.getDB();

    const q = `
      SELECT
          gtfs_feed_file_name
        FROM gtfs_feeds
        WHERE (
          ( gtfs_agency_name = ? )
          AND
          ( gtfs_feed_version = ? )
        )
    `;

    const gtfsFeedFileName = db
      .prepare(q)
      .pluck()
      .get([gtfsAgencyName, gtfsFeedVersion]);

    return this.getGtfsAgencyFeedVersionZipPath(
      gtfsAgencyName,
      gtfsFeedVersion,
      gtfsFeedFileName
    );
  }

  async addGtfsFeed({ gtfsAgencyName, gtfsFeedZipPath }: AddGtfsFeedParams) {
    const gtfsFeedFileName = basename(gtfsFeedZipPath);

    try {
      await mkdirAsync(this.gtfsTmpDir, { recursive: true });

      const tmpGtfsFeedDbPath = tmp.tmpNameSync({
        tmpdir: this.gtfsTmpDir,
        postfix: ".sqlite3",
      });

      await loadGtfsIntoSqlite({
        gtfsFeedZipPath,
        gtfsFeedDbPath: tmpGtfsFeedDbPath,
      });

      const gtfsDb = new Database(tmpGtfsFeedDbPath);

      const { feed_start_date, feed_end_date } = gtfsDb
        .prepare(
          `
            SELECT
                feed_start_date,
                feed_end_date
              FROM feed_date_extent
          `
        )
        .get();

      gtfsDb.close();

      const gtfsFeedVersion = `${feed_start_date}-${feed_end_date}`;
      const gtfsFeedVersionDir = this.getGtfsAgencyFeedVersionDir(
        gtfsAgencyName,
        gtfsFeedVersion
      );

      mkdirSync(gtfsFeedVersionDir, { recursive: true });

      const gtfsFeedVersionZipPath = this.getGtfsAgencyFeedVersionZipPath(
        gtfsAgencyName,
        gtfsFeedVersion,
        gtfsFeedFileName
      );

      if (existsSync(gtfsFeedVersionZipPath)) {
        const newHash = await getHash(createReadStream(gtfsFeedZipPath));
        const oldHash = await getHash(createReadStream(gtfsFeedVersionZipPath));

        if (newHash === oldHash) {
          await rmAsync(tmpGtfsFeedDbPath, { force: true });
          return;
        }

        throw new Error(
          `A GTFS Feed named ${gtfsFeedFileName} already exists for GTFS Agency ${gtfsAgencyName} version ${gtfsFeedVersion}.`
        );
      }

      const gtfsFeedDbPath = this.getGtfsAgencyFeedVersionDbPath(
        gtfsAgencyName,
        gtfsFeedVersion
      );

      await renameAsync(tmpGtfsFeedDbPath, gtfsFeedDbPath);

      await copyFileAsync(gtfsFeedZipPath, gtfsFeedVersionZipPath);

      const db = await this.getDB();

      db.prepare(
        `
          INSERT INTO gtfs_feeds (
            gtfs_agency_name,
            gtfs_feed_version,
            gtfs_feed_start_date,
            gtfs_feed_end_date,
            gtfs_feed_file_name
          ) VALUES ( ?, ?, ?, ?, ? ) ;
        `
      ).run([
        gtfsAgencyName,
        gtfsFeedVersion,
        feed_start_date,
        feed_end_date,
        gtfsFeedFileName,
      ]);
    } catch (err) {
      throw err;
    }
  }

  async removeGtfsFeed(gtfsAgencyName: string, gtfsFeedVersion: string) {
    const db = await this.getDB();

    const q = `
      DELETE FROM gtfs_feeds
        WHERE (
          ( gtfs_agency_name = ? )
          AND
          ( gtfs_feed_version = ? )
        )
    `;

    db.prepare(q).run([gtfsAgencyName, gtfsFeedVersion]);

    const gtfsFeedVersionDir = this.getGtfsAgencyFeedVersionDir(
      gtfsAgencyName,
      gtfsFeedVersion
    );

    await rmAsync(gtfsFeedVersionDir, { recursive: true, force: true });
  }

  async listGtfsAgencies() {
    const db = await this.getDB();

    const q = `
      SELECT DISTINCT
          gtfs_agency_name
        FROM gtfs_feeds
        ORDER BY 1
    `;

    const list = db.prepare(q).pluck().all();

    return list;
  }

  async listGtfsFeedVersionsForAgency(gtfsAgencyName: string) {
    const db = await this.getDB();

    const q = `
      SELECT
          gtfs_feed_version
        FROM gtfs_feeds
        WHERE ( gtfs_agency_name = ? )
        ORDER BY 1
    `;

    const list = db.prepare(q).pluck().all([gtfsAgencyName]);

    return list;
  }

  async listAllGtfsFeedVersions() {
    const gtfsAgencyNames = await this.listGtfsAgencies();
    const feedVersions = await Promise.all(
      gtfsAgencyNames.map(async (gtfsAgencyName) =>
        this.listGtfsFeedVersionsForAgency(gtfsAgencyName)
      )
    );

    const d = gtfsAgencyNames.map((gtfsAgencyName, i) => ({
      gtfsAgencyName,
      gtfsFeedVersions: feedVersions[i],
    }));

    return d;
  }

  async *makeGtfsFeedShapesIterator(
    gtfsAgencyName: string,
    gtfsFeedVersion: string
  ): AsyncGenerator<turf.Feature<turf.LineString>> {
    const feedDbPath = this.getGtfsAgencyFeedVersionDbPath(
      gtfsAgencyName,
      gtfsFeedVersion
    );

    const gtfsDb = new Database(feedDbPath);

    const q = `
      SELECT
          feature
        FROM shape_linestrings
    `;

    const iter = gtfsDb.prepare(q).pluck().iterate();

    for (const featureStr of iter) {
      await new Promise((resolve) => process.nextTick(resolve));

      const feature = JSON.parse(featureStr);
      yield feature;
    }
  }
}

export default new GtfsBaseDataController();
