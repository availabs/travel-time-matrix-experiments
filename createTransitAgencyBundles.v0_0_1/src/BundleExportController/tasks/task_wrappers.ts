import exportProjectDirectory from "../exportProjectDirectory";

export const projectDataDir = {
  desc: "The directory containing the project's derived data.",
  demand: true,
  type: "string",
};

export const exportDataDir = {
  desc: "The the export directory path.",
  demand: true,
  type: "string",
};

export const exportTransitDataBundle = {
  desc: "Export a Transit data bundle.",
  command: "export_transit_data_bundle",
  builder: {
    projectDataDir,
    exportDataDir,
  },
  async handler({
    projectDataDir,
    exportDataDir,
  }: {
    projectDataDir: string;
    exportDataDir: string;
  }) {
    await exportProjectDirectory(projectDataDir, exportDataDir);
  },
};
