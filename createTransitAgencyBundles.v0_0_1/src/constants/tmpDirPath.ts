import { mkdirSync } from "fs";
import { join } from "path";

const tmpDirPath = join(__dirname, "../tmp");

mkdirSync(tmpDirPath, { recursive: true });

export default tmpDirPath;
