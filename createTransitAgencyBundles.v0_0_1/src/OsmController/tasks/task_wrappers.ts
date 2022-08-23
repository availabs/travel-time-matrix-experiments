import {
  AddOsmPbfFileParams,
  DownloadOsmPbfParams,
  RemoveOsmPbfParams,
} from "../OsmBaseDataController";

import addOsmPbf from "./add_osm_pbf";
import downloadOsmPbf from "./download_osm_pbf";
import removeOsmPbf from "./remove_osm_pbf";
import listOsmExtracts from "./list_osm_base_extracts";

import setProjectOsmBase, {
  SetProjectSetOsmBaseParams,
} from "./set_project_base_osm";

export const osmPbfPath = {
  desc: "Paths to the OSM PBF file.",
  demand: true,
  type: "string",
};

export const osmPbfUrl = {
  desc: "URL for the OSM PBF file.",
  demand: true,
  type: "string",
};

export const osmExtractRegion = {
  desc: "The OSM extract region. For example 'albany-county_new-york' or 'mta-15mi-buffer'",
  demand: true,
  type: "string",
};

export const osmMapDate = {
  desc: "The OSM map data. For example, 200101",
  demand: true,
  type: "string",
};

export const projectDataDir = {
  desc: "The directory containing the project's derived data.",
  demand: true,
  type: "string",
};

export const addOsmPbfToBaseData = {
  desc: "Integrate an OSM PBF to the base data.",
  command: "osm_add_pbf_to_base_data",
  builder: {
    osmPbfPath,
    osmExtractRegion,
    osmMapDate,
  },
  async handler(argv: AddOsmPbfFileParams) {
    console.log(JSON.stringify({ argv }, null, 4));
    return await addOsmPbf(argv);
  },
};

export const downloadOsmPbfToBaseData = {
  desc: "Download an OSM PBF and integrate it into the base data.",
  command: "osm_download_pbf_to_base_data",
  builder: {
    osmPbfUrl,
    osmExtractRegion,
    osmMapDate,
  },
  async handler(argv: DownloadOsmPbfParams) {
    console.log(JSON.stringify({ argv }, null, 4));
    return await downloadOsmPbf(argv);
  },
};

export const removeOsmPbfFromBaseData = {
  desc: "Remove an OSM PBF from the base data.",
  command: "osm_remove_pbf_to_base_data",
  builder: {
    osmPbfPath,
    osmExtractRegion,
    osmMapDate,
  },
  async handler(argv: RemoveOsmPbfParams) {
    return await removeOsmPbf(argv);
  },
};

export const listOsmPbfFromBaseData = {
  desc: "List the OSM base extracts.",
  command: "osm_list_base_extracts",
  builder: {},
  async handler() {
    return await listOsmExtracts();
  },
};

export const setProjectOsmBaseExtract = {
  desc: "Set the base OSM extract for a project.",
  command: "osm_set_project_osm_base",
  builder: {
    projectDataDir,
    osmExtractRegion,
    osmMapDate,
  },
  async handler(argv: SetProjectSetOsmBaseParams) {
    return await setProjectOsmBase(argv);
  },
};
