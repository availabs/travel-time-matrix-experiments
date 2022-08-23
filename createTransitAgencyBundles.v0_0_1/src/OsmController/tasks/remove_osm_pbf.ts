import BaseDataControl, { RemoveOsmPbfParams } from "../OsmBaseDataController";

export default async function removeOsmPbfToBaseData(
  params: RemoveOsmPbfParams
) {
  return await BaseDataControl.removeOsmPbf(params);
}
