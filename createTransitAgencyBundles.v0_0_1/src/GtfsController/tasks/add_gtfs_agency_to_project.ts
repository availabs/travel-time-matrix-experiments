import GtfsDerivedDataController from "../GtfsDerivedDataController";

export default async function addGtfsFeedToBaseData({
  projectDataDir,
  gtfsAgencyName,
}) {
  const controller = new GtfsDerivedDataController(projectDataDir);
  return await controller.addGtfsAgencyToProject(gtfsAgencyName);
}
