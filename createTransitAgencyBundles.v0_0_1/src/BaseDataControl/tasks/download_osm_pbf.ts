import BaseDataControl, { DownloadOsmPbfParams } from "..";

export default async function downloadOsmPbfToBaseData(
  params: DownloadOsmPbfParams
) {
  return await BaseDataControl.downloadOsmPbfFile(params);
}
