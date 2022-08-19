import { relative } from "path";

import main, { DumpStopsParams } from ".";

const builder = {
  gtfsAgencySqlitePaths: {
    desc: "Path to the GTFS SQLite Databases",
    demand: true,
    type: "array",
  },
  stopsCsvDir: {
    desc: "Stops CSV directory",
    demand: true,
    type: "string",
  },
};

export const createStopsCsv = {
  desc: "Load the specified GTFS feed into SQLite.",
  command: "load_gtfs_feed_into_sqlite",
  builder,
  async handler(argv: DumpStopsParams) {
    const { allStopsCsvPath } = await main(argv);

    const relPath = relative(process.cwd(), allStopsCsvPath);

    console.log("SQLite DB written to", relPath);
  },
};
