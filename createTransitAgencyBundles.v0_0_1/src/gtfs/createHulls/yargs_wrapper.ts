import { relative } from "path";

import {
  dumpAllAgenciesHull,
  AllAgenciesHullParams,
  dumpRouteHullForAgency,
  RouteHullForAgencyParam,
} from ".";

export const createAllAgenciesHull = {
  desc: "Output the convex hull of all specified transit agencies with the specified buffer in miles.",
  command: "create_all_agencies_hull",
  builder: {
    gtfsAgencySqlitePaths: {
      desc: "Paths to the GTFS SQLite Databases",
      demand: true,
      type: "array",
    },
    bufferMiles: {
      desc: "Buffer miles",
      type: "number",
      default: 15,
    },
    concavity: {
      desc: "Hull concavity. From https://github.com/mapbox/concaveman: concavity is a relative measure of concavity. 1 results in a relatively detailed shape, Infinity results in a convex hull. You can use values lower than 1, but they can produce pretty crazy shapes..",
      type: "number",
      default: 10,
    },
    hullsDir: {
      desc: "Hulls GeoJSON directory",
      demand: true,
      type: "string",
    },
  },
  async handler(argv: AllAgenciesHullParams) {
    const { allAgenciesGeoJsonPath } = await dumpAllAgenciesHull(argv);

    const relPath = relative(process.cwd(), allAgenciesGeoJsonPath);

    console.log("Hull GeoJSON written to", relPath);
  },
};

export const createRouteHullForAgency = {
  desc: "Output the convex hull of all specified transit agencies with the specified buffer in miles.",
  command: "create_route_hull_for_agency",
  builder: {
    gtfsAgencySqlitePath: {
      desc: "Path to the GTFS SQLite Database",
      demand: true,
      type: "string",
    },
    routeId: {
      desc: "The routeId identifyig the route whose stops to dump.to the GTFS SQLite Database",
      demand: true,
      type: "string",
    },
    bufferMiles: {
      desc: "Buffer miles",
      type: "number",
      default: 15,
    },
    routeHullGeoJsonPath: {
      desc: "Output file path",
      demand: true,
      type: "string",
    },
    concavity: {
      desc: "Hull concavity. From https://github.com/mapbox/concaveman: concavity is a relative measure of concavity. 1 results in a relatively detailed shape, Infinity results in a convex hull. You can use values lower than 1, but they can produce pretty crazy shapes..",
      type: "number",
      default: 10,
    },
  },
  async handler(argv: RouteHullForAgencyParam) {
    const { routeHullGeoJsonPath } = await dumpRouteHullForAgency(argv);

    const relPath = relative(process.cwd(), routeHullGeoJsonPath);

    console.log("Hull GeoJSON written to", relPath);
  },
};
