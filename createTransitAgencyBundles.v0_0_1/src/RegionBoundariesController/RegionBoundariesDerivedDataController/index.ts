import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
  mkdir as mkdirAsync,
} from "fs/promises";
import { join, dirname } from "path";

import * as turf from "@turf/turf";
import _ from "lodash";

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

  get regionBoundingBoxesDir() {
    return join(this.dir, "region_bboxes");
  }

  getRegionBoundingBoxFilePath(regionBoundaryName: string) {
    const fname = `${regionBoundaryName}.json`;
    const fpath = join(this.regionBoundingBoxesDir, fname);

    return fpath;
  }

  async addRegionBoundary(
    regionBoundary: turf.Feature<turf.Polygon>,
    regionBoundaryName: string,
    metadata: object
  ) {
    const bndryFPath = this.getRegionBoundaryFilePath(regionBoundaryName);
    await mkdirAsync(dirname(bndryFPath), { recursive: true });

    await writeFileAsync(bndryFPath, JSON.stringify(regionBoundary));

    const db = await this.getDB();

    const insrtBndry = `
      INSERT INTO region_boundaries (
        region_boundary_name,
        metadata
      ) VALUES ( ?, json(?) )
        ON CONFLICT(region_boundary_name)
          DO UPDATE SET metadata = excluded.metadata
    `;

    db.prepare(insrtBndry).run([regionBoundaryName, JSON.stringify(metadata)]);

    const bbox = turf.bbox(regionBoundary);

    const bboxFPath = this.getRegionBoundingBoxFilePath(regionBoundaryName);
    await mkdirAsync(dirname(bboxFPath), { recursive: true });

    await writeFileAsync(bboxFPath, JSON.stringify(bbox));

    const insertBBox = `
      INSERT INTO region_bbox (
        region_boundary_name,
        min_lon,
        min_lat,
        max_lon,
        max_lat
      ) VALUES ( ?, ?, ?, ?, ? )
        ON CONFLICT(region_boundary_name)
          DO UPDATE
            SET
              min_lon = excluded.min_lon,
              min_lat = excluded.min_lat,
              max_lon = excluded.max_lon,
              max_lat = excluded.max_lat
    `;

    db.prepare(insertBBox).run([regionBoundaryName, ...bbox]);
  }

  async getAllRegionsBoundaryNames() {
    const db = await this.getDB();

    const q = `
      SELECT
          region_boundary_name
        FROM region_boundaries
        ORDER BY 1
    `;

    const rows = db.prepare(q).pluck().all();

    return rows;
  }

  async getAllRegionsMetadata() {
    const db = await this.getDB();

    const q = `
      SELECT
          region_boundary_name,
          metadata
        FROM region_boundaries
        ORDER BY 1
    `;

    const rows = db.prepare(q).all();
    const result = rows.map(({ region_boundary_name, metadata }) => ({
      region_boundary_name,
      metadata: JSON.parse(metadata),
    }));

    return result;
  }

  async getRegionBoundingBox(regionBoundaryName: string) {
    const db = await this.getDB();

    const q = `
      SELECT
          min_lon,
          min_lat,
          max_lon,
          max_lat
        FROM region_bbox
        WHERE ( region_boundary_name = ? )
    `;

    const result = db.prepare(q).get([regionBoundaryName]);

    return result;
  }
}
