import { join } from "path";

export const libsDir = join(__dirname, "../../lib");

export const osmosisVersion = "0.48.3";
export const osmosisLibDir = join(libsDir, `osmosis`);
export const osmosisExecutablePath = join(
  osmosisLibDir,
  `osmosis-${osmosisVersion}/bin/osmosis`
);
