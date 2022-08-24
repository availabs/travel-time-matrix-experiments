import GtfsBaseDataController from "../GtfsBaseDataController";

export default async function listGtfsFeedVersionsForAgency({
  gtfsAgencyName,
}) {
  const list = await GtfsBaseDataController.listGtfsFeedVersionsForAgency(
    gtfsAgencyName
  );

  console.log(list);
}
