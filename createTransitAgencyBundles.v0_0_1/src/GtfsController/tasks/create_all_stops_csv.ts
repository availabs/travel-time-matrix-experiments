import GtfsDerivedDataController from "../GtfsDerivedDataController";

export default async function addGtfsFeedToBaseData({ projectDataDir }) {
  const controller = new GtfsDerivedDataController(projectDataDir);
  return await controller.createAllStopsCsv();
}
