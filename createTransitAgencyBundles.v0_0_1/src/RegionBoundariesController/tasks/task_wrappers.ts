import RegionBoundariesDerivedDataController from "../RegionBoundariesDerivedDataController";

export const projectDataDir = {
  desc: "The directory containing the project's derived data.",
  demand: true,
  type: "string",
};

export const regionBoundaryName = {
  desc: "Region boundary name.",
  demand: true,
  type: "string",
};

export const showRegionBoundingBox = {
  desc: "Show a region bounding box coordinates.",
  command: "region_show_bounding_box",
  builder: {
    projectDataDir,
    regionBoundaryName,
  },
  async handler({
    projectDataDir,
    regionBoundaryName,
  }: {
    projectDataDir: string;
    regionBoundaryName: string;
  }) {
    const ctrlr = new RegionBoundariesDerivedDataController(projectDataDir);

    const bb = await ctrlr.getRegionBoundingBox(regionBoundaryName);

    console.log(JSON.stringify(bb, null, 4));
  },
};

export const listAllRegionsMetadata = {
  desc: "List all region boundaries names.",
  command: "region_show_all_region_boundaries_names",
  builder: {
    projectDataDir,
  },
  async handler({ projectDataDir }: { projectDataDir: string }) {
    const ctrlr = new RegionBoundariesDerivedDataController(projectDataDir);

    const d = await ctrlr.getAllRegionsBoundaryNames();

    console.table(d);
  },
};

export const showAllRegionsMetadata = {
  desc: "Show all regions metadata.",
  command: "region_show_all_regions_metdata",
  builder: {
    projectDataDir,
  },
  async handler({ projectDataDir }: { projectDataDir: string }) {
    const ctrlr = new RegionBoundariesDerivedDataController(projectDataDir);

    const d = await ctrlr.getAllRegionsMetadata();
    console.log(JSON.stringify(d, null, 4));
  },
};

export const showConveyalAnalysisBounds = {
  desc: "Show a the Conveyal Analysis-UI analysis bounds coordinates.",
  command: "region_show_analysis_bounds",
  builder: {
    projectDataDir,
    regionBoundaryName,
  },
  async handler({
    projectDataDir,
    regionBoundaryName,
  }: {
    projectDataDir: string;
    regionBoundaryName: string;
  }) {
    const ctrlr = new RegionBoundariesDerivedDataController(projectDataDir);

    const {
      min_lon: West,
      min_lat: South,
      max_lon: East,
      max_lat: North,
    } = await ctrlr.getRegionBoundingBox(regionBoundaryName);

    console.table({ North, South, East, West });
  },
};
