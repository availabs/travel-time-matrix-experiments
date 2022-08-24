import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
  mkdir as mkdirAsync,
} from "fs/promises";
import { join } from "path";

import Database from "better-sqlite3";
import * as turf from "@turf/turf";

import AbstractDataController from "../../core/AbstractDataController";

export default class RegionBoundariesDerivedDataController extends AbstractDataController {
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

  get regionBoundariesDir() {
    return join(this.dir, "region_boundaries");
  }

  getRegionBoundaryFilePath(regionBoundaryName: string) {
    const fname = `${regionBoundaryName}.geojson`;
    const fpath = join(this.regionBoundariesDir, fname);

    return fpath;
  }

  async addRegionBoundary(
    regionBoundary: turf.Feature<turf.Polygon>,
    regionBoundaryName: string,
    metadata: object
  ) {
    await mkdirAsync(this.regionBoundariesDir, { recursive: true });

    const fpath = this.getRegionBoundaryFilePath(regionBoundaryName);

    await writeFileAsync(fpath, JSON.stringify(regionBoundary));

    const db = await this.getDB();

    const q = `
      INSERT INTO region_boundaries (
        region_boundary_name,
        metadata
      ) VALUES ( ?, json(?) )
        ON CONFLICT(region_boundary_name)
          DO UPDATE SET metadata = excluded.metadata
    `;

    db.prepare(q).run([regionBoundaryName, JSON.stringify(metadata)]);
  }
}
