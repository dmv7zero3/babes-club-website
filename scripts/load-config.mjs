// scripts/load-config.mjs
// Load layered deployment config: ENV > deploy.local.json > deploy.json
// Validate and normalize.
import fs from "fs";
import path from "path";

const root = process.cwd();
const basePath = path.join(root, "config", "deploy.json");
const localPath = path.join(root, "config", "deploy.local.json");

function readJson(p) {
  try {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  } catch (e) {
    throw new Error(`Failed parsing ${p}: ${e.message}`);
  }
  return {};
}

function fromEnv() {
  return {
    awsRegion: process.env.AWS_REGION,
    s3Bucket:
      process.env.S3_BUCKET_NAME ||
      (process.env.S3_BUCKET_PATH
        ? process.env.S3_BUCKET_PATH.replace(/^s3:\/\//, "").replace(/\/+$/, "")
        : undefined),
    cloudFrontDistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    accountId: process.env.CLOUDFRONT_ACCOUNT_ID,
    siteOrigin: process.env.SITE_ORIGIN,
  };
}

export function loadDeployConfig() {
  const base = readJson(basePath);
  const local = readJson(localPath); // gitignored optional layer
  const env = fromEnv();

  // precedence: env > local > base
  const cfg = { ...base, ...local, ...stripUndefined(env) };

  const missing = [];
  if (!cfg.awsRegion) missing.push("awsRegion");
  if (!cfg.s3Bucket) missing.push("s3Bucket");
  if (!cfg.cloudFrontDistributionId) missing.push("cloudFrontDistributionId");
  if (!cfg.accountId) missing.push("accountId");
  if (!cfg.siteOrigin) missing.push("siteOrigin");

  if (missing.length) {
    throw new Error(
      `Deployment config missing: ${missing.join(", ")}. Check config/deploy.json or environment overrides.`
    );
  }

  // Normalize
  cfg.s3Bucket = cfg.s3Bucket.replace(/^s3:\/\//, "").replace(/\/+$/, "");
  cfg.siteOrigin = cfg.siteOrigin.replace(/\/$/, "");

  return cfg;
}

function stripUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const cfg = loadDeployConfig();
    console.table(cfg);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
