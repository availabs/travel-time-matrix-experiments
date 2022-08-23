import BaseDataControl from "../OsmBaseDataController";

export default async function listOsmExtracts() {
  const list = await BaseDataControl.listOsmExtracts();

  console.table(list);
}
