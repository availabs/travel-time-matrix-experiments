import { createReadStream } from "fs";

import BaseDataControl, { AddOsmPbfFileParams } from "..";

export default async function addOsmPbfToBaseData(params: AddOsmPbfFileParams) {
  console.log(JSON.stringify(params, null, 4));
  return await BaseDataControl.addOsmPbfFile(params);
}
