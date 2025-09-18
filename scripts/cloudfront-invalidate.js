#!/usr/bin/env node
/* scripts/cloudfront-invalidate.js
   Reads .env and runs aws cloudfront create-invalidation with the configured distribution id.
   Requires AWS CLI to be configured (credentials + region) in the environment where this runs.
*/

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load .env from project root
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
if (!distributionId) {
  console.error("CLOUDFRONT_DISTRIBUTION_ID is not set in environment or .env");
  process.exit(1);
}

const cmd = `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths '/*'`;
console.log("Running:", cmd);
try {
  const out = execSync(cmd, { stdio: "inherit" });
  process.exit(0);
} catch (err) {
  console.error("CloudFront invalidation failed:", err.message || err);
  process.exit(2);
}
