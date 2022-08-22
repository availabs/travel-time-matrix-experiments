import {
  existsSync,
  createWriteStream,
  ReadStream,
  createReadStream,
} from "fs";
import {
  mkdir as mkdirAsync,
  readFile as readFileAsync,
  rm as rmAsync,
} from "fs/promises";
import { pipeline } from "stream";
import { promisify } from "util";
import { join, basename, relative } from "path";

import fetch from "node-fetch";

import Database, { Database as SqliteDB } from "better-sqlite3";

const pipelineAsync = promisify(pipeline);

export type OsmPbfMetadata = {
  osmExtractRegion: string;
  osmMapDate: string;
};

export type AddOsmPbfFileParams = OsmPbfMetadata & {
  osmPbfPath: string;
};

export type AddOsmPbfStreamParams = OsmPbfMetadata & {
  osmPbfReadStream: ReadStream;
};

export type DownloadOsmPbfParams = OsmPbfMetadata & {
  osmPbfUrl: string;
};

export type RemoveOsmPbfParams = OsmPbfMetadata;

const baseDataDefaultDir = join(__dirname, "../../base_data/");

const controlMetadataFileName = "_control_metadata_.sqlite3";

class BaseDataControl {
  protected _db: SqliteDB | null;

  constructor(readonly baseDataDir: string = baseDataDefaultDir) {
    this._db = null;
  }

  protected async getDB() {
    if (this._db) {
      return this._db;
    }

    await mkdirAsync(this.baseDataDir, { recursive: true });

    const controlMetdataDbPath = join(
      this.baseDataDir,
      controlMetadataFileName
    );

    const dbExists = existsSync(controlMetdataDbPath);

    this._db = new Database(controlMetdataDbPath);

    if (!dbExists) {
      const sql = await readFileAsync(
        join(__dirname, "./sql/create_control_metadata_tables.sql"),
        { encoding: "utf-8" }
      );

      this._db.exec(sql);
    }

    return this._db;
  }

  get osmPbfsDir() {
    return join(this.baseDataDir, "osm_pbfs");
  }

  protected getOsmPbfPath(osmPbfFileName: string) {
    const bname = basename(osmPbfFileName);
    return join(this.osmPbfsDir, bname);
  }

  protected getOsmPbfRelPath(osmPbfFileName: string) {
    return relative(this.osmPbfsDir, this.getOsmPbfPath(osmPbfFileName));
  }

  protected getOsmPbfFileName(osmExtractRegion: string, osmMapDate: string) {
    return `${osmExtractRegion}-${osmMapDate}.pbf`;
  }

  async addOsmPbfStream({
    osmPbfReadStream,
    osmExtractRegion,
    osmMapDate,
  }: AddOsmPbfStreamParams) {
    const db = await this.getDB();

    await mkdirAsync(this.osmPbfsDir, { recursive: true });

    const fname = this.getOsmPbfFileName(osmExtractRegion, osmMapDate);
    const fpath = this.getOsmPbfPath(fname);

    if (existsSync(fpath)) {
      throw new Error(`File ${relative(process.cwd(), fpath)} already exists.`);
    }

    try {
      const ws = createWriteStream(fpath);
      await pipelineAsync(osmPbfReadStream, ws);

      db.exec("BEGIN;");

      const insertStmt = db.prepare(`
        INSERT INTO osm_pbfs (
          osm_extract_region,
          osm_map_date
        ) VALUES ( ?, ? )
      `);

      insertStmt.run([osmExtractRegion, osmMapDate]);

      db.exec("COMMIT;");
    } catch (err) {
      await rmAsync(fpath, { force: true });
      throw err;
    }
  }

  async addOsmPbfFile({
    osmPbfPath,
    osmExtractRegion,
    osmMapDate,
  }: AddOsmPbfFileParams) {
    const osmPbfReadStream = createReadStream(osmPbfPath);

    return this.addOsmPbfStream({
      osmPbfReadStream,
      osmExtractRegion,
      osmMapDate,
    });
  }

  async downloadOsmPbfFile({
    osmPbfUrl,
    osmExtractRegion,
    osmMapDate,
  }: DownloadOsmPbfParams) {
    const res = await fetch(osmPbfUrl);

    if (!res.ok) {
      throw new Error(`unexpected response ${res.statusText}`);
    }

    return this.addOsmPbfStream({
      // @ts-ignore
      osmPbfReadStream: res.body,
      osmExtractRegion,
      osmMapDate,
    });
  }

  async removeOsmPbf({ osmExtractRegion, osmMapDate }: RemoveOsmPbfParams) {
    const db = await this.getDB();

    const fname = this.getOsmPbfFileName(osmExtractRegion, osmMapDate);
    const fpath = this.getOsmPbfPath(fname);

    db.exec("BEGIN;");

    await rmAsync(fpath, { force: true });

    const insertStmt = db.prepare(`
      DELETE FROM osm_pbfs
        WHERE (
          ( osm_extract_region = ? )
          AND
          ( osm_map_date = ? )
        )
    `);

    insertStmt.run([osmExtractRegion, osmMapDate]);

    db.exec("COMMIT;");
  }
}

export default new BaseDataControl();
