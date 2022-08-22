import {
  AddOsmPbfFileParams,
  DownloadOsmPbfParams,
  RemoveOsmPbfParams,
} from "..";

import addOsmPbf from "./add_osm_pbf";
import downloadOsmPbf from "./download_osm_pbf";
import removeOsmPbf from "./remove_osm_pbf";

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

export const addOsmPbfToBaseData = {
  desc: "Integrate an OSM PBF to the base data.",
  command: "add_osm_pbf_to_base_data",
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
  command: "download_osm_pbf_to_base_data",
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

export const removeOsmPbfToBaseData = {
  desc: "Integrate an OSM PBF to the base data.",
  command: "remove_osm_pbf_to_base_data",
  builder: {
    osmPbfPath,
    osmExtractRegion,
    osmMapDate,
  },
  async handler(argv: RemoveOsmPbfParams) {
    return await removeOsmPbf(argv);
  },
};
