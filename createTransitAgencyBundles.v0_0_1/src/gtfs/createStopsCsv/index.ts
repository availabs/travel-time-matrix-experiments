import { mkdirSync, createWriteStream } from "fs";
import { join, basename } from "path";

import Database from "better-sqlite3";
import * as csv from "fast-csv";

export type DumpStopsParams = {
  gtfsAgencySqlitePaths: string[];
  stopsCsvDir: string;
};

export default async function main({
  gtfsAgencySqlitePaths,
  stopsCsvDir,
}: DumpStopsParams) {
  mkdirSync(stopsCsvDir, { recursive: true });

  const allStopsCsvPath = join(stopsCsvDir, "all_stops.csv");
  const ws = createWriteStream(allStopsCsvPath);

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

  for (const dbPath of gtfsAgencySqlitePaths) {
    const agencyName = basename(dbPath, ".sqlite3");

    const db = new Database(dbPath);

    const iter = db.prepare(q).iterate();

    for (const { stop_id, stop_lat, stop_lon } of iter) {
      if (/::/.test(stop_id)) {
        throw new Error("We need another delimiter for agency_name/stop_id");
      }

      stream.write({
        stop_id: `${agencyName}::${stop_id}`,
        stop_lat,
        stop_lon,
      });
    }
  }

  stream.end();

  return { allStopsCsvPath };
}
