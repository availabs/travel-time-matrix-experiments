import BaseDataControl, { AddOsmPbfFileParams } from "../OsmBaseDataController";

export default async function addOsmPbfToBaseData(params: AddOsmPbfFileParams) {
  return await BaseDataControl.addOsmPbfFile(params);
}
