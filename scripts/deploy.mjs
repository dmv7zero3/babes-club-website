// scripts/deploy.mjs
// Orchestrated deploy: build -> upload -> invalidate
import { uploadDist } from "./upload.mjs";
import { invalidate } from "./invalidate.mjs";
import { loadDeployConfig } from "./load-config.mjs";
import { execSync } from "child_process";

const DRY = !!process.env.DRY_RUN;

async function main() {
  const cfg = loadDeployConfig();
  console.log("Deployment config:");
  console.table(cfg);

  if (!process.env.SKIP_BUILD) {
    console.log("Running production build...");
    execSync("npm run build", { stdio: "inherit" });
  } else {
    console.log("Skipping build (SKIP_BUILD set)");
  }

  const { files, manifest, previousManifest } = await uploadDist("dist");

  // Determine changed HTML files (include index.html always)
  let changedHtml = [];
  if (!previousManifest) {
    changedHtml = ["index.html"]; // initial deploy
  } else {
    for (const f of files) {
      if (!f.endsWith(".html")) continue;
      const prev = previousManifest[f];
      const curr = manifest[f];
      if (!prev || prev.hash !== curr.hash) changedHtml.push(f);
    }
    if (!changedHtml.includes("index.html")) changedHtml.push("index.html");
  }

  await invalidate("dist", changedHtml);

  console.log(DRY ? "DRY RUN COMPLETE" : "DEPLOY COMPLETE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
