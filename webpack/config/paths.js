// webpack/config/paths.js
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "../../");

export const paths = {
  root,
  src: path.resolve(root, "src"),
  dist: path.resolve(root, "dist"),
  public: path.resolve(root, "public"),
  tsconfig: path.resolve(root, "tsconfig.json"),
  businessInfo: path.resolve(root, "src/businessInfo"),
  data: path.resolve(root, "src/data"),
  notes: path.resolve(root, "notes"),
  styles: path.resolve(root, "src/styles"),
  components: path.resolve(root, "src/components"),
  lib: path.resolve(root, "src/lib"),
};

export default paths;
