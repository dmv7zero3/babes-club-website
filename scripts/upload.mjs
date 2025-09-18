// scripts/upload.mjs
// Upload dist/ files to S3 with cache & content-type logic.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import mime from "mime-types";
import { loadDeployConfig } from "./load-config.mjs";

const DRY = !!process.env.DRY_RUN;

function hashFile(p) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex").slice(0, 16);
}

function collectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...collectFiles(full));
    else out.push(full);
  }
  return out;
}

function cacheControlFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (
    [
      ".js",
      ".css",
      ".woff",
      ".woff2",
      ".ttf",
      ".otf",
      ".eot",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".webp",
      ".avif",
    ].includes(ext)
  )
    return "public, max-age=31536000, immutable";
  if (ext === ".html") return "public, max-age=3600";
  return "public, max-age=86400";
}

export async function uploadDist(distDir = "dist") {
  const cfg = loadDeployConfig();
  const client = new S3Client({ region: cfg.awsRegion });
  const files = collectFiles(distDir);
  if (!files.length) throw new Error("No build files found in dist/");

  // Read previous manifest BEFORE overwriting
  const prevPath = path.join(distDir, "deploy-manifest.json");
  let previousManifest = null;
  if (fs.existsSync(prevPath)) {
    try {
      previousManifest = JSON.parse(fs.readFileSync(prevPath, "utf-8"));
    } catch {
      previousManifest = null;
    }
  }

  const manifest = {};
  let totalBytes = 0;

  for (const file of files) {
    const rel = path.relative(distDir, file).replace(/\\/g, "/");
    const body = fs.readFileSync(file);
    totalBytes += body.length;
    const contentType = mime.lookup(file) || "application/octet-stream";
    const cacheControl = cacheControlFor(file);
    const hash = hashFile(file);
    manifest[rel] = { hash, bytes: body.length };
    if (DRY) {
      console.log("[DRY] PutObject", rel, contentType, cacheControl);
      continue;
    }
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.s3Bucket,
        Key: rel,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
      })
    );
    console.log("Uploaded", rel);
  }

  console.log(
    `Upload complete: ${files.length} files, ${(totalBytes / 1024).toFixed(1)} KB`
  );
  if (!DRY) {
    fs.writeFileSync(
      path.join(distDir, "deploy-manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
  }
  return { cfg, files: Object.keys(manifest), manifest, previousManifest };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  uploadDist().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
