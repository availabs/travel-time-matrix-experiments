import { mkdir as mkdirAsync } from "fs/promises";
import { join } from "path";

import Database, { Database as SqliteDB } from "better-sqlite3";

const baseDataDefaultDir = join(__dirname, "../../base_data/");

const controlMetadataFileName = "_control_metadata_.sqlite3";

export default abstract class AbstractDataController {
  protected _db: SqliteDB | null;

  constructor(readonly dir: string = baseDataDefaultDir) {
    this._db = null;
  }

  protected async getDB() {
    if (this._db) {
      return this._db;
    }

    await mkdirAsync(this.dir, { recursive: true });

    const controlMetdataDbPath = join(this.dir, controlMetadataFileName);

    this._db = new Database(controlMetdataDbPath);
    this._db.pragma("foreign_keys = ON");

    await this.initializeDatabaseTables();

    return this._db;
  }

  protected abstract initializeDatabaseTables(): Promise<void>;
}
