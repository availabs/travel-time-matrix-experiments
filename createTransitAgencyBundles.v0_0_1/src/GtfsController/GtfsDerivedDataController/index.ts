import { readFile as readFileAsync } from "fs/promises";
import { join } from "path";

import AbstractDataController from "../../core/AbstractDataController";

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
      INSERT INTO gtfs_feeds (
        gtfs_agency_name,
        gtfs_feed_version
      ) VALUES ( ?, ? )
        ON CONFLICT(gtfs_agency_name)
          DO UPDATE SET gtfs_feed_version = excluded.gtfs_feed_version

    `;

    db.prepare(q).run([gtfsAgencyName, gtfsFeedVersion]);
  }
}
