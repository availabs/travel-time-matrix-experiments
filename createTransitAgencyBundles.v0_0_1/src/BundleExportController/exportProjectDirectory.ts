import { rm as rmAsync, mkdir as mkdirAsync, cp as cpAsync } from "fs/promises";

import { join, basename } from "path";

import GtfsDerivedDataController from "../GtfsController/GtfsDerivedDataController";

const gtfsStopsDirName = "gtfs_stops";
const osmRegionExtractsDirName = "osm_region_extracts";
const gtfsFeedsDirName = "gtfs_feeds";

export default async function exportProjectDirectory(
  projectDataDir: string,
  exportDataDir: string
) {
  const controller = new GtfsDerivedDataController(projectDataDir);

  const [allAgenciesFeedsMetadata] = await Promise.all([
    controller.getAllAgenciesFeedsMetadata(),
    mkdirAsync(exportDataDir, { recursive: true }),
  ]);

  const destGtfsFeedsDir = join(exportDataDir, gtfsFeedsDirName);
  const destGtfsStopsDir = join(exportDataDir, gtfsStopsDirName);
  const destRegionExtractsDir = join(exportDataDir, osmRegionExtractsDirName);

  await Promise.all(
    [destGtfsFeedsDir, destGtfsStopsDir, destRegionExtractsDir].map((dir) =>
      rmAsync(dir, { recursive: true, force: true })
    )
  );

  mkdirAsync(destGtfsFeedsDir, { recursive: true });

  await Promise.all([
    cpAsync(join(projectDataDir, gtfsStopsDirName), destGtfsStopsDir, {
      recursive: true,
      force: true,
    }),

    cpAsync(
      join(projectDataDir, osmRegionExtractsDirName),
      destRegionExtractsDir,
      {
        recursive: true,
        force: true,
      }
    ),

    ...allAgenciesFeedsMetadata.map(({ gtfs_feed_version_zip_path: src }) => {
      const dest = join(destGtfsFeedsDir, basename(src));
      return cpAsync(src, dest, { recursive: true, force: true });
    }),
  ]);
}
