import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";

import Database from "better-sqlite3";

import * as turf from "@turf/turf";

import { getGeometriesHullAsync } from "../../utils/hulls";

export type AllAgenciesHullParams = {
  gtfsAgencySqlitePaths: string[];
  bufferMiles: number;
  concavity: number;
  hullsDir: string;
};

export type RouteHullForAgencyParam = {
  gtfsAgencySqlitePath: string;
  routeId: string;
  routeHullGeoJsonPath: string;
  bufferMiles: number;
  concavity: number;
};

export async function dumpRouteHullForAgency({
  gtfsAgencySqlitePath,
  routeId,
  routeHullGeoJsonPath,
  bufferMiles = 0.5,
  concavity = 10,
}: RouteHullForAgencyParam) {
  console.log("==> foo");
  function* makePolyGenerator() {
    const q = `
      SELECT
          a.feature
        FROM shape_linestrings AS a
          INNER JOIN trips AS b
            USING (shape_id)
        WHERE (b.route_id = ?)
    `;

    const db = new Database(gtfsAgencySqlitePath);
    const iter = db.prepare(q).pluck().iterate([routeId]);

    for (const featureStr of iter) {
      const feature = JSON.parse(featureStr);
      const poly = turf.buffer(feature, bufferMiles, { units: "miles" });
      yield poly;
    }
  }

  const polyGenerator = makePolyGenerator();

  // @ts-ignore
  const hull = await getGeometriesHullAsync(concavity, polyGenerator);

  const dir = dirname(routeHullGeoJsonPath);
  mkdirSync(dir, { recursive: true });

  writeFileSync(routeHullGeoJsonPath, JSON.stringify(hull));

  return { routeHullGeoJsonPath };
}

export async function dumpAllAgenciesHull({
  gtfsAgencySqlitePaths,
  bufferMiles = 15,
  concavity = 10,
  hullsDir,
}: AllAgenciesHullParams) {
  const q = `
    SELECT
        feature
      FROM shape_linestrings
  `;

  function* makePolyGenerator() {
    for (const dbPath of gtfsAgencySqlitePaths) {
      const db = new Database(dbPath);

      const iter = db.prepare(q).pluck().iterate();

      for (const featureStr of iter) {
        const feature = JSON.parse(featureStr);
        const poly = turf.buffer(feature, bufferMiles, { units: "miles" });
        yield poly;
      }
    }
  }

  const polyGenerator = makePolyGenerator();

  // @ts-ignore
  const hull = await getGeometriesHullAsync(concavity, polyGenerator);

  mkdirSync(hullsDir, { recursive: true });

  const allAgenciesGeoJsonPath = join(
    hullsDir,
    `all_agencies.${bufferMiles}mi-buffer_concavity-${concavity}.geojson`
  );

  writeFileSync(allAgenciesGeoJsonPath, JSON.stringify(hull));

  return { allAgenciesGeoJsonPath };
}
