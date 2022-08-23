import BaseDataControl, {
  DownloadOsmPbfParams,
} from "../OsmBaseDataController";

export default async function downloadOsmPbfToBaseData(
  params: DownloadOsmPbfParams
) {
  return await BaseDataControl.downloadOsmPbfFile(params);
}
