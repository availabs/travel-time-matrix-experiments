// Note: Currently only supports positive polygons, or the convave hull of the polygon.
//       If negative regions (holes) eventually required, see
//         https://wiki.openstreetmap.org/wiki/Osmosis/Polygon_Filter_File_Format
//           > The polygon section name may optionally be prefixed with "!" to subtract the polygon.
//         https://geojson.org/geojson-spec.html#polygon
//           > For Polygons with multiple rings, the first must be the exterior ring
//           > and any others must be interior rings or holes.

import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";
import { execSync } from "child_process";

import * as turf from "@turf/turf";
import tmp from "tmp";

import { tmpDirPath, osmosisExecutablePath } from "../../constants";

import downloadOsmosisToLibrary from "./downloadOsmosisToLibrary";

export function getOsmosisExtractFilter(
  geojsonPoly: turf.Feature<turf.Polygon | turf.MultiPolygon>,
  extractName: string
) {
  if (geojsonPoly.geometry.type === "Polygon") {
    // @ts-ignore
    geojsonPoly.geometry.type = "MultiPolygon";
    // @ts-ignore
    geojsonPoly.geometry.coordinates = [geojsonPoly.geometry.coordinates];
  }

  const sections = (<turf.Feature<turf.MultiPolygon>>(
    geojsonPoly
  ))?.geometry.coordinates
    .map((ring, i) => {
      const polygon = turf.polygon([ring[0]]);
      const buffered = turf.buffer(polygon, 0.001, {
        units: "kilometers",
        steps: 1000,
      });

      const polycoordRows = buffered.geometry.coordinates[0]
        .map(
          ([lon, lat]) => `\t${lon.toExponential()}\t${lat.toExponential()}\n`
        )
        .join("");

      return `${extractName}_ring_${i + 1}\n${polycoordRows}\nEND`;
    })
    .join("\n");

  const polyfileName = `${extractName}.poly`;
  const polyfileData = `${polyfileName}\n${sections}\nEND`;

  return polyfileData;
}

export type CreateOsmExportParams = {
  sourceOsmFilePath: string;
  extractOsmFilePath: string;
  regionBoundary: turf.Feature<turf.MultiPolygon> | string;
  filterOsm: boolean;
};

export default async function createOsmExtract({
  sourceOsmFilePath,
  extractOsmFilePath,
  regionBoundary,
  filterOsm = true,
}: CreateOsmExportParams) {
  if (typeof regionBoundary === "string") {
    const str = await readFileAsync(regionBoundary, { encoding: "utf8" });
    regionBoundary = <turf.Feature<turf.MultiPolygon>>JSON.parse(str);
  }
  const extractName = basename(extractOsmFilePath, ".osm.pbf");

  const poly = getOsmosisExtractFilter(regionBoundary, extractName);

  const tmpFile = tmp.fileSync({
    tmpdir: tmpDirPath,
    postfix: ".poly",
  });

  // @ts-ignore
  await writeFileAsync(tmpFile.name, poly);

  if (!existsSync(osmosisExecutablePath)) {
    await downloadOsmosisToLibrary();
  }

  //  https://docs.conveyal.com/prepare-inputs#filtering
  //    OpenStreetMap contains a lot of data besides the streets, paths, and
  //    platforms we need for accessibility analysis. As of this writing more than
  //    half of the ways in OSM are buildings, and slightly less than a quarter
  //    are roads or paths. Filtering out unneeded data will reduce your file size
  //    and speed the upload and processing by Analysis. As in the previous
  //    section, sample commands are provided below that will remove any
  //    unnecessary tags and should dramatically reduce the output file size.
  const filteringFlags = filterOsm
    ? `--tf accept-ways \
          highway=* \
          public_transport=platform \
          railway=platform \
          park_ride=* \
      --tf accept-relations \
          type=restriction \
      --used-node`
    : "";

  const command = `${osmosisExecutablePath} \
      --read-pbf-fast file=${sourceOsmFilePath} \
      --sort type="TypeThenId" \
      ${filteringFlags} \
      --bounding-polygon \
          file=${tmpFile.name} \
          completeWays=yes \
      --write-pbf ${extractOsmFilePath} \
    `;

  // console.log(command);

  // Because we allow relative paths for the files, we MUST inherit CWD.
  execSync(command, { cwd: process.cwd() });

  tmpFile.removeCallback();

  return { extractOsmFilePath };
}
