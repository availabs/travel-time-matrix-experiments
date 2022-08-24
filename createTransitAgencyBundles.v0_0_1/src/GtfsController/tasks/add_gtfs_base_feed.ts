import GtfsBaseDataController, {
  AddGtfsFeedParams,
} from "../GtfsBaseDataController";

export default async function addGtfsFeedToBaseData(params: AddGtfsFeedParams) {
  return await GtfsBaseDataController.addGtfsFeed(params);
}
