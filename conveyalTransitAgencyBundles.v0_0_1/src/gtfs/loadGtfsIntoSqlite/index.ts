/* eslint-disable no-restricted-syntax */

import { readFileSync, mkdirSync, unlinkSync } from "fs";
import { join, basename } from "path";
import { pipeline } from "stream";

import Database, { Database as SqliteDatabase } from "better-sqlite3";
import unzipper from "unzipper";
import * as csv from "fast-csv";
import * as turf from "@turf/turf";

import _ from "lodash";

export type CsvRow = Record<string, number | string | null>;

export type AsyncCsvRowGenerator = AsyncGenerator<CsvRow>;

export type GtfsAgencyName = string;

export type LoadGtfsIntoSqliteParams = {
  gtfsZipPath: string;
  gtfsAgencyName: string;
  dbsDirPath: string;
};

export enum GtfsTable {
  agency = "agency",
  stops = "stops",
  routes = "routes",
  trips = "trips",
  stop_times = "stop_times",
  calendar = "calendar",
  calendar_dates = "calendar_dates",
  fare_attributes = "fare_attributes",
  fare_rules = "fare_rules",
  shapes = "shapes",
  frequencies = "frequencies",
  transfers = "transfers",
  feed_info = "feed_info",
}

const supportedGtfsTableNames = new Set(Object.keys(GtfsTable));

function getSql(fileBasename: string) {
  return readFileSync(join(__dirname, `./sql/${fileBasename}.sql`), {
    encoding: "utf8",
  });
}

const getTableNameForGtfsFileName = (fileName: string): GtfsTable | null => {
  if (!fileName) {
    console.warn("Skipping unrecognized file:", fileName);
    return null;
  }

  const name = basename(fileName, ".txt");

  return supportedGtfsTableNames.has(name) ? GtfsTable[name] : null;
};

export async function* makeGtfsFilesIterator(gtfs_zip: string): AsyncGenerator<{
  tableName: GtfsTable;
  ayncRowIterator: AsyncCsvRowGenerator;
}> {
  const { files: zipEntries } = await unzipper.Open.file(gtfs_zip);

  for (let i = 0; i < zipEntries.length; ++i) {
    const zipEntry = zipEntries[i];

    const { path: fileName } = zipEntry;

    const tableName = getTableNameForGtfsFileName(fileName);

    if (tableName !== null) {
      // Convert the CSV to an Object stream
      const csvParseStream = csv.parse({
        headers: true,
      });

      // @ts-ignore
      const ayncRowIterator: AsyncCsvRowGenerator = pipeline(
        zipEntry.stream(),
        csvParseStream,
        (err) => {
          if (err) {
            throw err;
          }
        }
      );

      yield { tableName, ayncRowIterator };
    }
  }
}

// Inserting integers into TEXT columns appends decimal portion.
//   This function prevents that.
//   See: https://github.com/JoshuaWise/better-sqlite3/issues/309#issuecomment-539694993
const formatRowForSqliteInsert = (
  columnsList: string[],
  row: Record<string, string | number | null>
): Array<string | null> =>
  columnsList.map((col) =>
    // Each column either stringified or null.
    _.isNil(row[col]) || row[col] === "" ? null : `${row[col]}`
  );

// General purpose GTFS Feed file loader. Handles all files in the feed.
async function loadAsync(
  dbWriteConnection: SqliteDatabase,
  tableName: string,
  rowAsyncIterator: AsyncCsvRowGenerator
) {
  // Inspect the database schema to get the column names for this file's respective table.
  const columnsList = _.flatten(
    dbWriteConnection
      .prepare(
        `
          SELECT
              name
            FROM pragma_table_info('${tableName}')
            ORDER BY cid ;
        `
      )
      .raw()
      .all()
  );

  // Prepare the INSERT statement using the table's column names
  const insertRowStmt = dbWriteConnection.prepare(`
    INSERT INTO ${tableName} (${columnsList})
      VALUES (${columnsList.map(() => "?")});
  `);

  let rowCt = 0;

  // Load the CSV rows into the file's respective DB table.
  for await (const row of rowAsyncIterator) {
    // TODO: Add QA to make sure the GTFS CSV columns have standard names.
    insertRowStmt.run(formatRowForSqliteInsert(columnsList, row));
    ++rowCt;
  }

  return rowCt;
}

// Load all files in the  GTFS Feed into their respective DB tables.
async function loadGtfsZipArchive(
  dbWriteConnection: SqliteDatabase,
  gtfsFilesIterator: AsyncGenerator<{
    tableName: string;
    ayncRowIterator: AsyncCsvRowGenerator;
  }>
) {
  const sql = getSql("create_gtfs_tables");

  //  Clean and Initialize the database tables that correspond 1-to-1
  //    with the GTFS Feed files.
  dbWriteConnection.exec(sql);

  // Load each file in the feed.
  for await (const { tableName, ayncRowIterator } of gtfsFilesIterator) {
    await loadAsync(dbWriteConnection, tableName, ayncRowIterator);
  }
}

// NOTE: This function is used as a SQLite user-defined function.
export function createShapeLineString(shapeId: string, shapeDataStr: string) {
  const sortedShapeData: {
    coordinate: [number, number];
    shape_dist_traveled: number;
    shape_pt_sequence: number;
  }[] = _.sortBy(JSON.parse(shapeDataStr), "shape_pt_sequence");

  const filteredShapeData = sortedShapeData
    .map(({ shape_dist_traveled, coordinate: [lon, lat] }) => ({
      shape_dist_traveled,
      coordinate: [_.round(lon, 6), _.round(lat, 6)],
    }))
    .filter(
      ({ coordinate }, i, arr) => !_.isEqual(coordinate, arr[i - 1]?.coordinate)
    );

  const coordinates = filteredShapeData.map(({ coordinate }) => coordinate);

  // NOTE: properties overwritten below
  const shape = turf.lineString(coordinates, {}, { id: shapeId });

  let shapeDistancesTraveled: number[] | null = filteredShapeData.map(
    ({ shape_dist_traveled }) => _.round(shape_dist_traveled, 6)
  );

  if (!shapeDistancesTraveled.some(Boolean)) {
    shapeDistancesTraveled = null;
  } else {
    // In GTFS, 1st could be NULL
    shapeDistancesTraveled[0] = 0;
  }

  shape.properties = {
    shapeId,
  };

  return shape;
}

export async function loadGtfsSpatialTables(db: SqliteDatabase) {
  const sql = getSql("create_gtfs_spatial_tables");

  db.function(
    "create_shape_linestring",
    { deterministic: true },
    (shapeId: string, shapeDataStr: string) =>
      JSON.stringify(createShapeLineString(shapeId, shapeDataStr))
  );

  db.exec(sql);
}

export default async function main({
  gtfsZipPath,
  gtfsAgencyName,
  dbsDirPath,
}) {
  try {
    const timerId = `load ${gtfsAgencyName} GTFS Feed`;
    console.time(timerId);

    mkdirSync(dbsDirPath, { recursive: true });

    const gtfsAgencySqlitePath = join(dbsDirPath, `${gtfsAgencyName}.sqlite3`);

    const gtfsFilesIterator = makeGtfsFilesIterator(gtfsZipPath);

    try {
      unlinkSync(gtfsAgencySqlitePath);
    } catch (err) {
      //
    }

    const db = new Database(gtfsAgencySqlitePath);

    db.pragma("journal_mode = WAL");

    db.exec("BEGIN;");

    await loadGtfsZipArchive(db, gtfsFilesIterator);
    loadGtfsSpatialTables(db);

    db.exec("COMMIT;");

    db.pragma("journal_mode = DELETE");
    db.close();

    console.timeEnd(timerId);

    return {
      gtfsZipPath,
      gtfsAgencyName,
      gtfsAgencySqlitePath,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}
