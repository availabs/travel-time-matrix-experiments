import { relative } from "path";

import {
  dumpAllStopsAllAgencies,
  DumpStopsParams,
  dumpRouteStopsForAgency,
  RouteStopsParams,
} from ".";

export const createAllStopsCsv = {
  desc: "Dump all stops in all specified gtfsAgencySqlitePaths to an all_stops.csv file in the specified stopsCsvDir.",
  command: "create_all_stops_csv",
  builder: {
    gtfsAgencySqlitePaths: {
      desc: "Paths to the GTFS SQLite Databases",
      demand: true,
      type: "array",
    },
    stopsCsvDir: {
      desc: "Stops CSV directory",
      demand: true,
      type: "string",
    },
  },
  async handler(argv: DumpStopsParams) {
    const { allStopsCsvPath } = await dumpAllStopsAllAgencies(argv);

    const relPath = relative(process.cwd(), allStopsCsvPath);

    console.log("SQLite DB written to", relPath);
  },
};

export const createRouteStopsCsv = {
  desc: "Dump all stops for the specified routeId in the specified gtfsAgencySqlitePath DB to routeStopsCsvPath.",
  command: "create_route_stops_csv",
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
    routeStopsCsvPath: {
      desc: "Stops CSV directory",
      demand: true,
      type: "string",
    },
  },
  async handler(argv: RouteStopsParams) {
    const result = await dumpRouteStopsForAgency(argv);

    console.log(JSON.stringify(result, null, 4));
  },
};
