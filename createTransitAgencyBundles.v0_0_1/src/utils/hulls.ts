/* eslint-disable no-restricted-syntax */

import concaveman from "concaveman";

import * as turf from "@turf/turf";
import _ from "lodash";

const BATCH_SIZE = 10000;

export function getCoordsHull(
  concavity: number,
  coordsIter: Generator<[number, number]>,
  batchSize = BATCH_SIZE
) {
  let points: turf.Position[] = [];
  let counter = 0;

  for (const coord of coordsIter) {
    points.push(coord);

    if (++counter === batchSize) {
      points = concaveman(points, concavity);
    }
  }

  const hullCoords = concaveman(points, concavity);

  return turf.polygon([hullCoords]);
}

function* makeCoordsIterFromGeometriesIter(
  geometries:
    | Generator<turf.Geometries | any[]>
    | Array<turf.Geometries | any[]>
) {
  for (const geom of geometries) {
    const coords = _(turf.getCoords(geom))
      .flattenDeep()
      .chunk(2)
      .uniqWith(_.isEqual)
      .value();

    for (const coord of coords) {
      yield <[number, number]>coord;
    }
  }
}

export function getGeometriesHull(
  concavity: number,
  geometries:
    | Generator<turf.Geometries | any[]>
    | Array<turf.Geometries | any[]>
) {
  const coordsIter = makeCoordsIterFromGeometriesIter(geometries);

  return getCoordsHull(concavity, coordsIter);
}

export async function getCoordsHullAsync(
  concavity: number,
  coordsIter: AsyncGenerator<[number, number]>,
  batchSize = BATCH_SIZE
) {
  let points: turf.Position[] = [];
  let counter = 0;

  for await (const coord of coordsIter) {
    points.push(coord);

    if (++counter === batchSize) {
      points = concaveman(points, concavity);
      await new Promise((resolve) => process.nextTick(resolve));
    }
  }

  const hullCoords = concaveman(points, concavity);

  return turf.polygon([hullCoords]);
}

async function* makeCoordsAsyncIterFromAsyncGeometriesIter(
  geometries: AsyncGenerator<turf.Geometries | any[]>
) {
  for await (const geom of geometries) {
    const coords = _(turf.getCoords(geom))
      .flattenDeep()
      .chunk(2)
      .uniqWith(_.isEqual)
      .value();

    for (const coord of coords) {
      yield <[number, number]>coord;
    }
  }
}

export async function getGeometriesHullAsync(
  concavity: number,
  geometries: AsyncGenerator<turf.Geometries | any[]>
) {
  const coordsIter = makeCoordsAsyncIterFromAsyncGeometriesIter(geometries);

  return getCoordsHullAsync(concavity, coordsIter);
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
