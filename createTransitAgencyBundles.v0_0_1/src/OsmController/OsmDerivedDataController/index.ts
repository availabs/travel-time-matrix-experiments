import { readFile as readFileAsync } from "fs/promises";
import { join, basename } from "path";

import * as turf from "@turf/turf";

import AbstractDataController from "../../core/AbstractDataController";

export type OsmExtractMetadata = {
  osmExtractRegion: string;
  osmMapDate: string;
};

export default class OsmDerivedDataController extends AbstractDataController {
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

  async setOsmBaseExtract({
    osmExtractRegion,
    osmMapDate,
  }: OsmExtractMetadata) {
    const db = await this.getDB();

    const rowsCountSql = `
      SELECT
          COUNT(1)
        FROM osm_base_extract
    `;

    const rowsCount = db.prepare(rowsCountSql).pluck().get();

    if (rowsCount > 1) {
      throw new Error(
        "The osm_base_extract table is in an inconsistent state. It must have at most 1 row."
      );
    }

    if (rowsCount === 1) {
      const alreadySetToSelfSql = `
        SELECT EXISTS (
          SELECT
              1
            FROM osm_base_extract
            WHERE (
              ( osm_extract_region = ? )
              AND
              ( osm_map_date = ? )
            )
        ) ;
      `;

      const alreadySetToSelf = db
        .prepare(alreadySetToSelfSql)
        .pluck()
        .get([osmExtractRegion, osmMapDate]);

      if (alreadySetToSelf) {
        return;
      }

      throw new Error("OSM Base Extract already set.");
    }

    const insertSql = `
      INSERT INTO osm_base_extract (
        osm_extract_region,
        osm_map_date
      ) VALUES ( ?, ? )
    `;

    db.prepare(insertSql).run([osmExtractRegion, osmMapDate]);
  }

  get osmExtractsDir() {
    return join(this.dir, "osm_extracts");
  }

  protected getOsmExtractPath(osmExtractName: string) {
    const bname = basename(osmExtractName);
    return join(this.osmExtractsDir, bname);
  }

  protected getOsmExtractName(osmExtractRegion: string, osmMapDate: string) {
    return `${osmExtractRegion}-${osmMapDate}`;
  }

  creatOsmRegionExtract(boundingPolygon: turf.Feature<turf.MultiPolygon>) {}
}
