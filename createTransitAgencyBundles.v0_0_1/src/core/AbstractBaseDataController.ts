import { join } from "path";

import AbstractDataController from "./AbstractDataController";

const baseDataDefaultDir = join(__dirname, "../../base_data/");

export default abstract class AbstractBaseDataController extends AbstractDataController {
  constructor(readonly dir: string = baseDataDefaultDir) {
    super(dir);
  }
}
