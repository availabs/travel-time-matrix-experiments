import { AddGtfsFeedParams } from "../GtfsBaseDataController";

import addGtfsFeed from "./add_gtfs_base_feed";
import listGtfsAgencies from "./list_gtfs_agencies";
import listGtfsFeedVersionsForAgency from "./list_gtfs_feed_versions_for_agency";

export const gtfsAgencyName = {
  desc: "GTFS Agency Name",
  demand: true,
  type: "string",
};

export const gtfsFeedZipPath = {
  desc: "Path to the GTFS Feed ZIP archive.",
  demand: true,
  type: "string",
};

export const gtfsFeedVersion = {
  desc: "GTFS Feed Version",
  demand: false,
  type: "string",
};

export const addGtfsBaseFeed = {
  desc: "Integrate an GTFS Feed into the base data.",
  command: "gtfs_add_feed_to_base_data",
  builder: {
    gtfsAgencyName,
    gtfsFeedZipPath,
  },
  async handler(argv: AddGtfsFeedParams) {
    return await addGtfsFeed(argv);
  },
};

export const listGtfsBaseAgencies = {
  desc: "List the GTFS agencies in the base data.",
  command: "gtfs_list_agencies",
  builder: {},
  async handler() {
    return await listGtfsAgencies();
  },
};

export const listGtfsFeedVersions = {
  desc: "List the GTFS agencies in the base data.",
  command: "gtfs_list_feed_versions",
  builder: { gtfsAgencyName },
  async handler(params: { gtfsAgencyName: string }) {
    return await listGtfsFeedVersionsForAgency(params);
  },
};
