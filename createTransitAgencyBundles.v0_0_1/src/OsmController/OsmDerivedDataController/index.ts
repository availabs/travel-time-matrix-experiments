import { readFile as readFileAsync } from "fs/promises";
import { join } from "path";

import AbstractDataController from "../../core/AbstractDataController";
import OsmBaseDataController from "../OsmBaseDataController";
import RegionBoundariesController from "../../RegionBoundariesController/RegionBoundariesDerivedDataController";

import createOsmExtract from "./subtasks/osmosis/createOsmExtract";
import { mkdirSync } from "fs";

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

  async getOsmBaseExtract(): Promise<OsmExtractMetadata> {
    const db = await this.getDB();

    const q = `
      SELECT
          osm_extract_region AS osmExtractRegion,
          osm_map_date AS osmMapDate
        FROM osm_base_extract 
    `;

    return db.prepare(q).get();
  }

  async getOsmBaseExtractPbfPath() {
    const { osmExtractRegion, osmMapDate } = await this.getOsmBaseExtract();

    const osmBaseExtractPbfPath = OsmBaseDataController.getOsmExtractFilePath(
      osmExtractRegion,
      osmMapDate
    );

    return osmBaseExtractPbfPath;
  }

  get osmRegionExtractsDir() {
    const dir = join(this.dir, "osm_region_extracts");
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  protected getOsmRegionExtractPath(regionBoundaryName: string) {
    const fname = `${regionBoundaryName}.osm.pbf`;

    return join(this.osmRegionExtractsDir, fname);
  }

  async creatOsmRegionExtract(regionBoundaryName: string) {
    const sourceOsmFilePath = await this.getOsmBaseExtractPbfPath();
    const extractOsmFilePath = this.getOsmRegionExtractPath(regionBoundaryName);

    const regBdryCntlr = new RegionBoundariesController(this.dir);
    const regionBoundary =
      regBdryCntlr.getRegionBoundaryFilePath(regionBoundaryName);

    await createOsmExtract({
      sourceOsmFilePath,
      extractOsmFilePath,
      regionBoundary,
    });
  }
}
