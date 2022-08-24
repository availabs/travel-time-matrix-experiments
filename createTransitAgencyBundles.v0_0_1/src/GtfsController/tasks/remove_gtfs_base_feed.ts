import Controller, { GtfsFeedMetadata } from "../GtfsBaseDataController";

export default async function removeOsmPbfToBaseData({
  gtfsAgencyName,
  gtfsFeedVersion,
}: GtfsFeedMetadata) {
  return await Controller.removeGtfsFeed(gtfsAgencyName, gtfsFeedVersion);
}
