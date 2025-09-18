#!/usr/bin/env node
/* scripts/s3.js
   Centralized S3 helper that reads S3_BUCKET_PATH from .env (via dotenv)
   and runs the equivalent aws cli commands used in package.json.

   Usage: node scripts/s3.js <command>
   Commands: cleanup, sync:build, sync:videos, sync:images, sync:assets,
             fix-js, fix-css, fix-fonts
*/

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const bucket = process.env.S3_BUCKET_PATH;
if (!bucket) {
  console.error("S3_BUCKET_PATH is not set in environment or .env");
  process.exit(1);
}

const run = (cmd) => {
  console.log("$", cmd);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error("Command failed:", err.message || err);
    process.exit(2);
  }
};

const cmd = process.argv[2];
if (!cmd) {
  console.error("No command specified. See scripts/s3.js for usage.");
  process.exit(1);
}

switch (cmd) {
  case "cleanup":
    run(`aws s3 rm ${bucket} --recursive --exclude '*' --include '*.DS_Store'`);
    break;

  case "sync:build":
    run(
      `aws s3 sync dist/ ${bucket} --exclude 'images/*' --exclude 'videos/*' --exclude 'favicon*' --exclude 'apple-touch-icon*' --exclude 'web-app-manifest*' --exclude 'site.webmanifest' --delete --exclude '*.DS_Store'`
    );
    break;

  case "sync:videos":
    run(
      `aws s3 sync public/videos/ ${bucket}videos/ --exclude '*.DS_Store' --content-type 'video/mp4' --content-disposition 'inline' --cache-control 'public, max-age=31536000, immutable'`
    );
    break;

  case "sync:images":
    run(
      `aws s3 sync public/images/ ${bucket}images/ --exclude '*.DS_Store' --exclude '*.hash' --cache-control 'public, max-age=31536000, immutable'`
    );
    break;

  case "sync:assets":
    // run videos then images
    run(
      `aws s3 sync public/videos/ ${bucket}videos/ --exclude '*.DS_Store' --content-type 'video/mp4' --content-disposition 'inline' --cache-control 'public, max-age=31536000, immutable'`
    );
    run(
      `aws s3 sync public/images/ ${bucket}images/ --exclude '*.DS_Store' --exclude '*.hash' --cache-control 'public, max-age=31536000, immutable'`
    );
    break;

  case "fix-js":
    run(
      `aws s3 cp ${bucket}js/ ${bucket}js/ --recursive --metadata-directive REPLACE --content-type 'application/javascript' --cache-control 'public, max-age=31536000, immutable' --include '*.js' --exclude '*.map'`
    );
    break;

  case "fix-css":
    run(
      `aws s3 cp ${bucket}styles/ ${bucket}styles/ --recursive --metadata-directive REPLACE --content-type 'text/css' --cache-control 'public, max-age=31536000, immutable'`
    );
    break;

  case "fix-fonts":
    run(
      `aws s3 cp ${bucket}fonts/ ${bucket}fonts/ --recursive --metadata-directive REPLACE --content-type 'font/woff2' --cache-control 'public, max-age=31536000, immutable' --include '*.woff2'`
    );
    run(
      `aws s3 cp ${bucket}fonts/ ${bucket}fonts/ --recursive --metadata-directive REPLACE --content-type 'font/woff' --cache-control 'public, max-age=31536000, immutable' --include '*.woff'`
    );
    break;

  default:
    console.error("Unknown command:", cmd);
    process.exit(1);
}
