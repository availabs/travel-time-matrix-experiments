import { GtfsAgencyName, GtfsFeedMetadata, GtfsFeedVersion } from "../index.d";
import { AddGtfsFeedParams } from "../GtfsBaseDataController";
import GtfsBaseDataController from "../GtfsBaseDataController";
import GtfsDerivedDataController from "../GtfsDerivedDataController";

import addGtfsFeed from "./add_gtfs_base_feed";
import listGtfsAgencies from "./list_gtfs_agencies";
import removeGtfsFeed from "./remove_gtfs_base_feed";
import addGtfsAgencyToProj from "./add_gtfs_agency_to_project";
import setGtfsAgencyFeedVersionForProj from "./gtfs_project_set_agency_feed_version";
import createAllStopsCsvForProj from "./create_all_stops_csv";

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

export const gtfsRouteId = {
  desc: "The routeId identifying the route whose stops to dump.to the GTFS SQLite Database",
  demand: true,
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

export const listGtfsAgencyFeedVersions = {
  desc: "List the GTFS feed versions for the specified GTFS agency in the base_data.",
  command: "gtfs_list_all_feed_versions_for_agency",
  builder: { gtfsAgencyName },
  async handler({ gtfsAgencyName }: { gtfsAgencyName: string }) {
    return await GtfsBaseDataController.listGtfsFeedVersionsForAgency(
      gtfsAgencyName
    );
  },
};

export const listGtfsAllFeedVersions = {
  desc: "List the ALL GTFS feed versions in the base_data.",
  command: "gtfs_list_all_feed_versions",
  async handler() {
    const d = await GtfsBaseDataController.listAllGtfsFeedVersions();
    console.table(d);
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

export const gtfsProjectCreateAllStopsCsv = {
  desc: "Create a CSV with all stops for all agencies in the project.",
  command: "gtfs_project_create_all_stops_csv",
  builder: {
    projectDataDir,
  },
  async handler(argv: { projectDataDir: string }) {
    const { gtfsStopsSubsetName } = await createAllStopsCsvForProj(argv);

    console.log("Created", gtfsStopsSubsetName);
  },
};

export const gtfsProjectListAgenciesMetatdata = {
  desc: "Show GTFS feed metadata for all feeds in the project.",
  command: "gtfs_project_show_gtfs_feeds_metadata",
  builder: {
    projectDataDir,
  },
  async handler({ projectDataDir }) {
    const controller = new GtfsDerivedDataController(projectDataDir);

    const list = await controller.getAllAgenciesFeedsMetadata();

    const meta = list.map(({ gtfs_agency_name, gtfs_feed_version }) => ({
      gtfs_agency_name,
      gtfs_feed_version,
    }));

    console.table(meta);

    return list;
  },
};

export const gtfsProjectListRoutesForAgency = {
  desc: "Show all routes in the agency's feed version in the project.",
  command: "gtfs_project_show_routes_for_agency",
  builder: {
    projectDataDir,
    gtfsAgencyName,
  },
  async handler({ projectDataDir, gtfsAgencyName }) {
    const controller = new GtfsDerivedDataController(projectDataDir);

    const list = await controller.listGtfsRoutesForAgency(gtfsAgencyName);

    console.table(list);

    return list;
  },
};

export const gtfsProjectCreateAgencyRouteStopsCsv = {
  desc: "Create a CSV with all route stops for an agency in the project.",
  command: "gtfs_project_create_agency_route_stops_csv",
  builder: {
    projectDataDir,
    gtfsAgencyName,
    gtfsRouteId,
  },
  async handler({ projectDataDir, gtfsAgencyName, gtfsRouteId }) {
    const controller = new GtfsDerivedDataController(projectDataDir);

    const { gtfsStopsSubsetName } = await controller.createAgencyRouteStopsCsv(
      gtfsAgencyName,
      gtfsRouteId
    );

    console.log(`Created ${gtfsStopsSubsetName}`);

    return { gtfsStopsSubsetName };
  },
};

export const createAllAgenciesHull = {
  desc: "Output the convex hull of all transit agencies in the project.",
  command: "create_all_agencies_hull",
  builder: {
    projectDataDir,
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
  },
  async handler({ projectDataDir, bufferMiles, concavity }) {
    const controller = new GtfsDerivedDataController(projectDataDir);

    const { regionBoundaryName } = await controller.createAllAgenciesHull({
      bufferMiles,
      concavity,
    });

    console.log(`Created ${regionBoundaryName}`);

    return { regionBoundaryName };
  },
};
