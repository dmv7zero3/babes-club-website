// scripts/invalidate.mjs
// Create CloudFront invalidation (full or selective from previous manifest diff).
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { loadDeployConfig } from "./load-config.mjs";

const DRY = !!process.env.DRY_RUN;

function buildInvalidationPaths(changedFiles = []) {
  if (process.env.FULL_INVALIDATION === "1") return ["/*"];
  if (!changedFiles.length) return ["/*"]; // fallback safety

  const paths = new Set();
  // Always include root index.html
  paths.add("/index.html");
  paths.add("/");

  for (const f of changedFiles) {
    if (!f.endsWith(".html")) continue;
    if (f === "index.html") continue; // already added
    const fullPath = `/${f}`; // e.g. /about/index.html
    paths.add(fullPath);
    // If pattern like section/index.html add pretty URL variants
    if (/\/index\.html$/i.test(f)) {
      const pretty = "/" + f.replace(/\/index\.html$/i, ""); // /about
      if (pretty && pretty !== "/") {
        paths.add(pretty);
        paths.add(pretty + "/");
      }
    }
  }

  // Guard against very large sets
  if (paths.size > 30) return ["/*"];
  return Array.from(paths);
}

export async function invalidate(distDir = "dist", changedFiles) {
  const cfg = loadDeployConfig();
  const client = new CloudFrontClient({ region: cfg.awsRegion });
  const items = buildInvalidationPaths(changedFiles);
  console.log("Invalidation paths:", items);
  if (DRY) {
    console.log("[DRY] Skipping actual invalidation");
    return;
  }

  const command = new CreateInvalidationCommand({
    DistributionId: cfg.cloudFrontDistributionId,
    InvalidationBatch: {
      Paths: { Quantity: items.length, Items: items },
      CallerReference: Date.now().toString(),
    },
  });
  await client.send(command);
  console.log("CloudFront invalidation submitted");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  invalidate().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
