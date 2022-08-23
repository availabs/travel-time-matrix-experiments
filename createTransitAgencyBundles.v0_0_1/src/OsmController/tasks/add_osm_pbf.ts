import BaseDataControl, { AddOsmPbfFileParams } from "../OsmBaseDataController";

export default async function addOsmPbfToBaseData(params: AddOsmPbfFileParams) {
  console.log(JSON.stringify(params, null, 4));
  return await BaseDataControl.addOsmPbfFile(params);
}
