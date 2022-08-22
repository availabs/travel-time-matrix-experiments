import BaseDataControl, { RemoveOsmPbfParams } from "..";

export default async function removeOsmPbfToBaseData(
  params: RemoveOsmPbfParams
) {
  return await BaseDataControl.removeOsmPbf(params);
}
