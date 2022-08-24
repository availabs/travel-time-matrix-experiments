import GtfsBaseDataController from "../GtfsBaseDataController";

export default async function listGtfsAgencies() {
  const list = await GtfsBaseDataController.listGtfsAgencies();

  console.log(list);
}
