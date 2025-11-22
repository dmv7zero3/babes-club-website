import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let cachedCatalog = null;

const possibleCatalogPaths = () => {
  const baseDir = dirname(fileURLToPath(import.meta.url));
  return [
    resolve(baseDir, "../businessInfo/JewleryProducts.json"),
    resolve(baseDir, "../../src/businessInfo/JewleryProducts.json"),
  ];
};

export function getCatalog() {
  if (cachedCatalog) return cachedCatalog;

  for (const path of possibleCatalogPaths()) {
    try {
      const raw = readFileSync(path, "utf-8");
      cachedCatalog = JSON.parse(raw);
      return cachedCatalog;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(
    "Unable to locate JewleryProducts.json. Ensure the file is packaged with the Lambda."
  );
}
