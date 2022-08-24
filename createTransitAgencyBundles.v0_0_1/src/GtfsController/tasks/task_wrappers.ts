import { GtfsAgencyName, GtfsFeedMetadata, GtfsFeedVersion } from "../index.d";
import { AddGtfsFeedParams } from "../GtfsBaseDataController";

import addGtfsFeed from "./add_gtfs_base_feed";
import listGtfsAgencies from "./list_gtfs_agencies";
import listGtfsFeedVersionsForAgency from "./list_gtfs_feed_versions_for_agency";
import removeGtfsFeed from "./remove_gtfs_base_feed";
import addGtfsAgencyToProj from "./add_gtfs_agency_to_project";
import setGtfsAgencyFeedVersionForProj from "./gtfs_project_set_agency_feed_version";

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

export const projectDataDir = {
  desc: "The directory containing the project's derived data.",
  demand: true,
  type: "string",
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

export const removeGtfsBaseFeed = {
  desc: "Remove an GTFS Feed from the base data.",
  command: "gtfs_remove_feed_from_base_data",
  builder: {
    gtfsAgencyName,
    gtfsFeedVersion,
  },
  async handler(argv: GtfsFeedMetadata) {
    return await removeGtfsFeed(argv);
  },
};

export const addGtfsAgencyToProject = {
  desc: "Add a GTFS agency to the project.",
  command: "gtfs_project_add_agency",
  builder: {
    projectDataDir,
    gtfsAgencyName,
  },
  async handler(argv: {
    projectDataDir: string;
    gtfsAgencyName: GtfsAgencyName;
  }) {
    return await addGtfsAgencyToProj(argv);
  },
};

export const setGtfsAgencyFeedVersionForProject = {
  desc: "Set the GTFS agency feed version for the project.",
  command: "gtfs_project_set_agency_feed_version",
  builder: {
    projectDataDir,
    gtfsAgencyName,
    gtfsFeedVersion,
  },
  async handler(argv: {
    projectDataDir: string;
    gtfsAgencyName: GtfsAgencyName;
    gtfsFeedVersion: GtfsFeedVersion;
  }) {
    return await setGtfsAgencyFeedVersionForProj(argv);
  },
};
