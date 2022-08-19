import { relative } from "path";

import { listAllRoutesForAgency, ListCmdParams } from ".";

export const listRoutes = {
  desc: "List all routes in the specified gtfsAgencySqlitePath DB.",
  command: "list_all_routes_for_agency",
  builder: {
    gtfsAgencySqlitePath: {
      desc: "Path to the GTFS SQLite Database",
      demand: true,
      type: "string",
    },
  },
  async handler(argv: ListCmdParams) {
    const result = await listAllRoutesForAgency(argv);

    console.log(JSON.stringify(result, null, 4));
  },
};
