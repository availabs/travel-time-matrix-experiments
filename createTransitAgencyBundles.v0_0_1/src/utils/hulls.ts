/* eslint-disable no-restricted-syntax */

import concaveman from "concaveman";

import * as turf from "@turf/turf";
import _ from "lodash";

const BATCH_SIZE = 10000;

export function getGeometriesHull(
  concavity: number,
  geometries:
    | Generator<turf.Geometries | any[]>
    | Array<turf.Geometries | any[]>
) {
  let points: turf.Position[] = [];
  let counter = 0;
  for (const geom of geometries) {
    const geomPoints = _(turf.getCoords(geom))
      .flattenDeep()
      .chunk(2)
      .uniqWith(_.isEqual)
      .value();

    points.push(...geomPoints);

    if (++counter === BATCH_SIZE) {
      points = concaveman(points, concavity);
    }
  }

  const hullCoords = concaveman(points, concavity);

  return turf.polygon([hullCoords]);
}

export async function getGeometriesHullAsync(
  concavity: number,
  geometries: AsyncGenerator<turf.Geometries | any[]>
) {
  let points: turf.Position[] = [];
  let counter = 0;

  for await (const geom of geometries) {
    const geomPoints = _(turf.getCoords(geom))
      .flattenDeep()
      .chunk(2)
      .uniqWith(_.isEqual)
      .value();

    points.push(...geomPoints);

    if (++counter === BATCH_SIZE) {
      points = concaveman(points, concavity);
    }
  }

  const hullCoords = concaveman(points, concavity);

  return turf.polygon([hullCoords]);
}

export const getGeometriesConvexHull = getGeometriesHull.bind(null, Infinity);
export const getGeometriesConcaveHull = getGeometriesHull.bind(null, 1);

export const getGeometriesConvexHullAsync = getGeometriesHullAsync.bind(
  null,
  Infinity
);
export const getGeometriesConcaveHullAsync = getGeometriesHullAsync.bind(
  null,
  1
);
