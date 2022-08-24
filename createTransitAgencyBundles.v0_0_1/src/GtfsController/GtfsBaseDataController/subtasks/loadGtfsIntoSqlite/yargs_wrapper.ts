import { relative } from "path";

import loadGtfsIntoSqlite, { LoadGtfsIntoSqliteParams } from ".";

const builder = {
  gtfsFeedZipPath: {
    desc: "Path to the GTFS Feed ZIP archive",
    demand: true,
    type: "string",
  },
  gtfsAgencyName: {
    desc: "The GTFS Agency name",
    demand: true,
    type: "string",
    default: "Intermodal_Facility",
  },
  dbsDirPath: {
    desc: "Path to the GTFS SQLite databases directory",
    demand: true,
    type: "string",
  },
};

export const loadGtfsFeedIntoSqlite = {
  desc: "Load the specified GTFS feed into SQLite.",
  command: "load_gtfs_feed_into_sqlite",
  builder,
  async handler(argv: LoadGtfsIntoSqliteParams) {
    const { gtfsFeedDbPath } = await loadGtfsIntoSqlite(argv);

    const relPath = relative(process.cwd(), gtfsFeedDbPath);

    console.log("SQLite DB written to", relPath);
  },
};
