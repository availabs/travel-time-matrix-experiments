import OsmDerivedDataController, {
  OsmExtractMetadata,
} from "../OsmDerivedDataController";

export type SetProjectSetOsmBaseParams = OsmExtractMetadata & {
  projectDataDir: string;
};

export default async function addOsmPbfToBaseData({
  projectDataDir,
  osmExtractRegion,
  osmMapDate,
}: SetProjectSetOsmBaseParams) {
  const ctrlr = new OsmDerivedDataController(projectDataDir);

  return await ctrlr.setOsmBaseExtract({ osmExtractRegion, osmMapDate });
}
