#!/usr/bin/env node
// scripts/validate-seo.js
// ==============================================================================
// Validates that all generated HTML files have required SEO meta tags.
// Run after build: npm run seo:validate
// ==============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST = path.resolve(__dirname, "../dist");

// Required meta tag patterns
const REQUIRED_TAGS = [
  { name: "title", pattern: /<title>.+<\/title>/ },
  { name: "meta description", pattern: /<meta\s+name="description"\s+content=".+"/ },
  { name: "canonical", pattern: /<link\s+rel="canonical"\s+href="https:\/\/.+"/ },
  { name: "og:title", pattern: /<meta\s+property="og:title"\s+content=".+"/ },
  { name: "og:description", pattern: /<meta\s+property="og:description"\s+content=".+"/ },
  { name: "og:image", pattern: /<meta\s+property="og:image"\s+content="https:\/\/.+"/ },
  { name: "og:url", pattern: /<meta\s+property="og:url"\s+content="https:\/\/.+"/ },
  { name: "twitter:card", pattern: /<meta\s+name="twitter:card"\s+content="summary_large_image"/ },
  { name: "twitter:title", pattern: /<meta\s+name="twitter:title"\s+content=".+"/ },
  { name: "twitter:image", pattern: /<meta\s+name="twitter:image"\s+content="https:\/\/.+"/ },
];

// Warning tags (recommended but not required)
const WARNING_TAGS = [
  { name: "og:image:alt", pattern: /<meta\s+property="og:image:alt"\s+content=".+"/ },
  { name: "twitter:image:alt", pattern: /<meta\s+name="twitter:image:alt"\s+content=".+"/ },
  { name: "JSON-LD", pattern: /<script\s+type="application\/ld\+json">/ },
];

// Colors for terminal output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

/**
 * Validate a single HTML file
 * @param {string} filePath
 * @returns {{ valid: boolean, missing: string[], warnings: string[] }}
 */
function validateHtmlFile(filePath) {
  const html = fs.readFileSync(filePath, "utf-8");
  const missing = [];
  const warnings = [];

  // Check required tags
  for (const { name, pattern } of REQUIRED_TAGS) {
    if (!pattern.test(html)) {
      missing.push(name);
    }
  }

  // Check warning tags
  for (const { name, pattern } of WARNING_TAGS) {
    if (!pattern.test(html)) {
      warnings.push(name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Recursively walk directory and find all index.html files
 * @param {string} dir
 * @returns {string[]} Array of file paths
 */
function findHtmlFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.name === "index.html") {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main validation function
 */
function main() {
  console.log();
  log(colors.blue + colors.bold, "🔍 SEO Meta Tag Validation");
  log(colors.blue, "=".repeat(50));
  console.log();

  if (!fs.existsSync(DIST)) {
    log(colors.red, `❌ Build directory not found: ${DIST}`);
    log(colors.yellow, "   Run 'npm run build' first.");
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(DIST);

  if (htmlFiles.length === 0) {
    log(colors.red, "❌ No HTML files found in dist/");
    process.exit(1);
  }

  log(colors.blue, `Found ${htmlFiles.length} HTML file(s) to validate:\n`);

  let allValid = true;
  let totalWarnings = 0;

  for (const filePath of htmlFiles) {
    const relativePath = path.relative(DIST, filePath);
    const { valid, missing, warnings } = validateHtmlFile(filePath);

    if (valid && warnings.length === 0) {
      log(colors.green, `✅ ${relativePath}`);
    } else if (valid) {
      log(colors.yellow, `⚠️  ${relativePath}`);
      for (const warn of warnings) {
        log(colors.yellow, `   └─ Missing recommended: ${warn}`);
      }
      totalWarnings += warnings.length;
    } else {
      log(colors.red, `❌ ${relativePath}`);
      for (const tag of missing) {
        log(colors.red, `   └─ Missing required: ${tag}`);
      }
      for (const warn of warnings) {
        log(colors.yellow, `   └─ Missing recommended: ${warn}`);
      }
      allValid = false;
      totalWarnings += warnings.length;
    }
  }

  console.log();
  log(colors.blue, "=".repeat(50));

  if (allValid) {
    log(colors.green + colors.bold, "✅ All required SEO meta tags present!");
    if (totalWarnings > 0) {
      log(colors.yellow, `⚠️  ${totalWarnings} recommended tag(s) missing.`);
    }
    console.log();
    process.exit(0);
  } else {
    log(colors.red + colors.bold, "❌ SEO validation failed!");
    log(colors.red, "   Fix missing required tags before deploying.");
    console.log();
    process.exit(1);
  }
}

main();
