/* eslint-disable no-restricted-syntax */

import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { pipeline } from "stream";
import { promisify } from "util";

import fetch from "node-fetch";
import tar from "tar";

import {
  osmosisVersion,
  osmosisLibDir,
  osmosisExecutablePath,
} from "../../constants";

const pipelineAsync = promisify(pipeline);

export default async function main() {
  if (existsSync(osmosisExecutablePath)) {
    return { osmosisExecutablePath };
  }

  const dir = join(osmosisLibDir, `osmosis-${osmosisVersion}`);
  mkdirSync(dir, { recursive: true });

  const releaseUrl = `https://github.com/openstreetmap/osmosis/releases/download/${osmosisVersion}/osmosis-${osmosisVersion}.tgz`;

  console.log("Downloading Osmosis from:", releaseUrl);

  const res = await fetch(releaseUrl);

  if (!res.ok) {
    throw new Error(`unexpected response ${res.statusText}`);
  }

  const extractStream = tar.x({
    cwd: dir,
  });

  // @ts-ignore
  await pipelineAsync(res.body, extractStream);

  return { osmosisExecutablePath };
}
