import GtfsDerivedDataController from "../GtfsDerivedDataController";

export default async function addGtfsFeedToBaseData({
  projectDataDir,
  gtfsAgencyName,
  gtfsFeedVersion,
}) {
  const controller = new GtfsDerivedDataController(projectDataDir);
  return await controller.setGtfsAgencyFeedVersionForProject({
    gtfsAgencyName,
    gtfsFeedVersion,
  });
}
