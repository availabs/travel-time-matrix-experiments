import { mkdirSync, createWriteStream } from "fs";
import { join, dirname, basename } from "path";

import Database from "better-sqlite3";
import * as csv from "fast-csv";

export type DumpStopsParams = {
  gtfsAgencySqlitePaths: string[];
  stopsCsvDir: string;
};

export type RouteStopsParams = {
  gtfsAgencySqlitePath: string;
  routeId: string;
  routeStopsCsvPath: string;
};

export async function dumpRouteStopsForAgency(params: RouteStopsParams) {
  const { gtfsAgencySqlitePath, routeId, routeStopsCsvPath } = params;

  const outDirPath = dirname(routeStopsCsvPath);
  mkdirSync(outDirPath, { recursive: true });

  const ws = createWriteStream(routeStopsCsvPath);

  const stream = csv.format({ headers: ["stop_id", "stop_lat", "stop_lon"] });

  stream.pipe(ws);

  const q = `
    SELECT DISTINCT
        stop_id,
        stop_lat,
        stop_lon
      FROM stops
        INNER JOIN stop_times
          USING (stop_id)
        INNER JOIN trips
          USING (trip_id)
      WHERE ( route_id = ? )
      ORDER BY stop_id
  `;

  const agencyName = basename(gtfsAgencySqlitePath, ".sqlite3");

  const db = new Database(gtfsAgencySqlitePath);

  const iter = db.prepare(q).iterate([routeId]);

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

  stream.end();

  return params;
}

export async function dumpAllStopsAllAgencies({
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
