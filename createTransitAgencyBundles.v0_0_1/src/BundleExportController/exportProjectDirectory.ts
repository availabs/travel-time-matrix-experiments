import { createWriteStream } from "fs";

import {
  rm as rmAsync,
  mkdir as mkdirAsync,
  cp as cpAsync,
  writeFile as writeFileAsync,
  readdir as readdirAsync,
} from "fs/promises";

import { join, basename } from "path";

import dedent from "dedent";

import GtfsDerivedDataController from "../GtfsController/GtfsDerivedDataController";
import RegionBoundariesDerivedDataController from "../RegionBoundariesController/RegionBoundariesDerivedDataController";

const gtfsStopsDirName = "gtfs_stops";
const osmRegionExtractsDirName = "osm_region_extracts";
const gtfsFeedsDirName = "gtfs_feeds";

export async function createAllShapesGeoJsonFile(
  gtfsDerivedDataController: GtfsDerivedDataController,
  exportDataDir: string
) {
  const allShapesFilePath = join(exportDataDir, "all_shapes.geojson");
  const ws = createWriteStream(allShapesFilePath);

  const shapesIter =
    gtfsDerivedDataController.makeAllAgenciesShapesAsyncGenerator();

  ws.write('{"type": "FeatureCollection","features": [');

  let firstLine = true;
  for await (const feature of shapesIter) {
    if (!firstLine) {
      ws.write(",");
    }

    const good = ws.write(JSON.stringify(feature));

    if (!good) {
      await new Promise((resolve) => ws.once("drain", resolve));
    }

    firstLine = false;
  }

  ws.write("]}");

  ws.close();
}

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

  const osmExports = await readdirAsync(destRegionExtractsDir);

  if (osmExports.length === 1) {
    const regionBoundaryName = basename(osmExports[0], ".osm.pbf");

    const ctrlr = new RegionBoundariesDerivedDataController(projectDataDir);

    const {
      min_lon: west,
      min_lat: south,
      max_lon: east,
      max_lat: north,
    } = await ctrlr.getRegionBoundingBox(regionBoundaryName);

    const d = dedent(`
      NORTH   ${north}
      EAST    ${east}
      SOUTH   ${south}
      WEST    ${west}
    `);

    await writeFileAsync(join(exportDataDir, "ANALYSIS_BOUNDS"), d);

    createAllShapesGeoJsonFile(controller, exportDataDir);
  }
}
