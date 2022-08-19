import { relative } from "path";

import main from ".";

export const downloadOsmosisExecutable = {
  desc: "Download the Osmosis executable.",
  command: "download_osmosis",
  async handler() {
    const { osmosisExecutablePath } = await main();

    const relPath = relative(process.cwd(), osmosisExecutablePath);

    console.log("Osmosis executable located at", relPath);
  },
};
