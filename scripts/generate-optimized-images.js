import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import crypto from "crypto";

// Get the current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory of the project
const rootDir = path.join(__dirname, "..");

// Configuration for different formats and quality settings
const COMPRESSION_CONFIG = {
  // AVIF - Best compression, newest format
  avif: {
    quality: 65,
    effort: 6, // 0-9, higher = better compression but slower
  },
  // WebP - Good fallback, wide support
  webp: {
    quality: 80,
    effort: 6, // 0-6, higher = better compression but slower
  },
  // Optimized JPEG
  jpeg: {
    quality: 85,
    progressive: true,
    mozjpeg: true, // Use mozjpeg encoder for better compression
  },
  // Optimized PNG
  png: {
    compressionLevel: 9, // 0-9, higher = better compression
    progressive: true,
  },
};

// Log helper
function log(message) {
  console.log(`[Image Optimizer] ${message}`);
}

// Function to walk through directories recursively
async function walkDirectory(directory) {
  log(`Scanning directory: ${directory}`);

  const items = await fs.promises.readdir(directory);
  let files = [];

  for (const item of items) {
    const fullPath = path.join(directory, item);

    try {
      const stat = await fs.promises.stat(fullPath);

      if (stat.isDirectory()) {
        // Ignore common build/dependency directories
        if (
          [
            "node_modules",
            ".git",
            "dist",
            ".next",
            "build",
            "shine-venv",
          ].includes(item)
        ) {
          continue;
        }

        const subFiles = await walkDirectory(fullPath);
        files = files.concat(subFiles);
      } else if (isImageFile(fullPath)) {
        files.push(fullPath);
      }
    } catch (error) {
      log(`Error accessing ${fullPath}: ${error.message}`);
    }
  }

  return files;
}

// Function to filter for image files
function isImageFile(file) {
  const ext = path.extname(file).toLowerCase();
  return [".jpg", ".jpeg", ".png"].includes(ext);
}

// Function to calculate file hash
async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);

    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

// Function to check if conversion is needed
async function needsConversion(sourcePath, outputPath) {
  try {
    // If output doesn't exist, we need conversion
    await fs.promises.access(outputPath);
  } catch {
    return true; // File doesn't exist
  }

  try {
    // Compare modification times
    const sourceStats = await fs.promises.stat(sourcePath);
    const outputStats = await fs.promises.stat(outputPath);

    // If source is newer, we need conversion
    if (sourceStats.mtimeMs > outputStats.mtimeMs) {
      return true;
    }

    // Check content hash for accuracy
    const sourceHash = await calculateFileHash(sourcePath);
    const hashFile = outputPath + ".hash";

    try {
      const storedHash = await fs.promises.readFile(hashFile, "utf8");
      return storedHash !== sourceHash;
    } catch {
      return true; // No hash file, need conversion
    }
  } catch {
    return true; // Error checking, convert to be safe
  }
}

// Function to store file hash
async function storeFileHash(sourcePath, outputPath) {
  try {
    const sourceHash = await calculateFileHash(sourcePath);
    const hashFile = outputPath + ".hash";
    await fs.promises.writeFile(hashFile, sourceHash);
  } catch (error) {
    log(`Warning: Could not store hash for ${outputPath}: ${error.message}`);
  }
}

// Convert to AVIF format using Sharp
async function convertToAvif(imagePath) {
  const directory = path.dirname(imagePath);
  const filename = path.basename(imagePath, path.extname(imagePath));
  const outputPath = path.join(directory, `${filename}.avif`);
  const relativePath = path.relative(rootDir, imagePath);

  if (!(await needsConversion(imagePath, outputPath))) {
    return { skipped: true, format: "AVIF" };
  }

  try {
    log(`Converting to AVIF: ${relativePath}`);

    await sharp(imagePath)
      .avif({
        quality: COMPRESSION_CONFIG.avif.quality,
        effort: COMPRESSION_CONFIG.avif.effort,
      })
      .toFile(outputPath);

    // Verify file was created and has content
    const stats = await fs.promises.stat(outputPath);
    if (stats.size === 0) {
      throw new Error("AVIF file was created but is empty");
    }

    await storeFileHash(imagePath, outputPath);

    log(
      `✅ Created AVIF: ${path.relative(rootDir, outputPath)} (${Math.round(
        stats.size / 1024
      )}KB)`
    );
    return { converted: true, format: "AVIF", size: stats.size };
  } catch (error) {
    log(`❌ Error converting ${relativePath} to AVIF: ${error.message}`);

    // Clean up failed conversion
    try {
      await fs.promises.unlink(outputPath);
    } catch {}

    return { error: error.message, format: "AVIF" };
  }
}

// Convert to WebP format using Sharp
async function convertToWebp(imagePath) {
  const directory = path.dirname(imagePath);
  const filename = path.basename(imagePath, path.extname(imagePath));
  const outputPath = path.join(directory, `${filename}.webp`);
  const relativePath = path.relative(rootDir, imagePath);

  if (!(await needsConversion(imagePath, outputPath))) {
    return { skipped: true, format: "WebP" };
  }

  try {
    log(`Converting to WebP: ${relativePath}`);

    await sharp(imagePath)
      .webp({
        quality: COMPRESSION_CONFIG.webp.quality,
        effort: COMPRESSION_CONFIG.webp.effort,
      })
      .toFile(outputPath);

    // Verify file was created and has content
    const stats = await fs.promises.stat(outputPath);
    if (stats.size === 0) {
      throw new Error("WebP file was created but is empty");
    }

    await storeFileHash(imagePath, outputPath);

    log(
      `✅ Created WebP: ${path.relative(rootDir, outputPath)} (${Math.round(
        stats.size / 1024
      )}KB)`
    );
    return { converted: true, format: "WebP", size: stats.size };
  } catch (error) {
    log(`❌ Error converting ${relativePath} to WebP: ${error.message}`);

    // Clean up failed conversion
    try {
      await fs.promises.unlink(outputPath);
    } catch {}

    return { error: error.message, format: "WebP" };
  }
}

// Optimize original format using Sharp
async function optimizeOriginal(imagePath) {
  const directory = path.dirname(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const filename = path.basename(imagePath, ext);
  const outputPath = path.join(directory, `${filename}-optimized${ext}`);
  const relativePath = path.relative(rootDir, imagePath);

  if (!(await needsConversion(imagePath, outputPath))) {
    return { skipped: true, format: "Original" };
  }

  try {
    log(`Optimizing original: ${relativePath}`);

    let sharpInstance = sharp(imagePath);

    if ([".jpg", ".jpeg"].includes(ext)) {
      sharpInstance = sharpInstance.jpeg({
        quality: COMPRESSION_CONFIG.jpeg.quality,
        progressive: COMPRESSION_CONFIG.jpeg.progressive,
        mozjpeg: COMPRESSION_CONFIG.jpeg.mozjpeg,
      });
    } else if (ext === ".png") {
      sharpInstance = sharpInstance.png({
        compressionLevel: COMPRESSION_CONFIG.png.compressionLevel,
        progressive: COMPRESSION_CONFIG.png.progressive,
      });
    }

    await sharpInstance.toFile(outputPath);

    // Verify file was created and has content
    const stats = await fs.promises.stat(outputPath);
    if (stats.size === 0) {
      throw new Error("Optimized file was created but is empty");
    }

    await storeFileHash(imagePath, outputPath);

    log(
      `✅ Optimized original: ${path.relative(
        rootDir,
        outputPath
      )} (${Math.round(stats.size / 1024)}KB)`
    );
    return { converted: true, format: "Original", size: stats.size };
  } catch (error) {
    log(`❌ Error optimizing ${relativePath}: ${error.message}`);

    // Clean up failed conversion
    try {
      await fs.promises.unlink(outputPath);
    } catch {}

    return { error: error.message, format: "Original" };
  }
}

// Function to clean up orphaned hash files
async function cleanupOrphanedHashes(imageFiles) {
  log("Cleaning up orphaned hash files...");

  let cleanedUp = 0;

  for (const imagePath of imageFiles) {
    const directory = path.dirname(imagePath);
    const filename = path.basename(imagePath, path.extname(imagePath));

    // Check for orphaned hash files for each format
    const formats = [
      { ext: ".avif", name: "AVIF" },
      { ext: ".webp", name: "WebP" },
      { ext: "-optimized" + path.extname(imagePath), name: "Optimized" },
    ];

    for (const format of formats) {
      const outputPath = path.join(directory, filename + format.ext);
      const hashFile = outputPath + ".hash";

      try {
        const hashExists = await fs.promises
          .access(hashFile)
          .then(() => true)
          .catch(() => false);
        const outputExists = await fs.promises
          .access(outputPath)
          .then(() => true)
          .catch(() => false);

        if (hashExists && !outputExists) {
          await fs.promises.unlink(hashFile);
          log(
            `Removed orphaned ${format.name} hash: ${path.relative(
              rootDir,
              hashFile
            )}`
          );
          cleanedUp++;
        }
      } catch (error) {
        log(
          `Warning: Error cleaning up hash file ${hashFile}: ${error.message}`
        );
      }
    }
  }

  if (cleanedUp > 0) {
    log(`✅ Cleaned up ${cleanedUp} orphaned hash files`);
  }
}

// Main processing function
async function processImage(imagePath) {
  const results = {
    avif: await convertToAvif(imagePath),
    webp: await convertToWebp(imagePath),
    optimized: await optimizeOriginal(imagePath),
  };

  return results;
}

// Test Sharp installation
async function testSharpInstallation() {
  try {
    // Test basic Sharp functionality
    const testBuffer = Buffer.alloc(100 * 100 * 4); // 100x100 RGBA
    testBuffer.fill(255); // White pixels

    await sharp(testBuffer, {
      raw: { width: 100, height: 100, channels: 4 },
    })
      .png()
      .toBuffer();

    log("✅ Sharp installation test passed");
    return true;
  } catch (error) {
    log(`❌ Sharp installation test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log("Starting advanced image optimization with Sharp...");
  log("Formats: AVIF (best) → WebP (fallback) → Optimized Original");

  // Test Sharp installation
  const sharpOk = await testSharpInstallation();
  if (!sharpOk) {
    log("❌ Sharp not working properly. Try:");
    log("   npm install sharp --save-dev");
    log("   npm rebuild sharp");
    process.exit(1);
  }

  try {
    // Get all image files from the project recursively
    const imageFiles = await walkDirectory(rootDir);

    log(`Found ${imageFiles.length} images to process`);

    if (imageFiles.length > 0) {
      // Clean up orphaned hash files first
      await cleanupOrphanedHashes(imageFiles);

      log("Beginning optimization...");

      let stats = {
        processed: 0,
        skipped: 0,
        avif: { converted: 0, skipped: 0, errors: 0 },
        webp: { converted: 0, skipped: 0, errors: 0 },
        optimized: { converted: 0, skipped: 0, errors: 0 },
      };

      for (const file of imageFiles) {
        const results = await processImage(file);
        stats.processed++;

        // Count results for each format
        ["avif", "webp", "optimized"].forEach((format) => {
          if (results[format].converted) {
            stats[format].converted++;
          } else if (results[format].skipped) {
            stats[format].skipped++;
          } else if (results[format].error) {
            stats[format].errors++;
          }
        });
      }

      log(`\n✅ Optimization complete!`);
      log(`📊 Statistics:`);
      log(`   • Processed: ${stats.processed} images`);
      log(
        `   • AVIF: ${stats.avif.converted} converted, ${stats.avif.skipped} skipped, ${stats.avif.errors} errors`
      );
      log(
        `   • WebP: ${stats.webp.converted} converted, ${stats.webp.skipped} skipped, ${stats.webp.errors} errors`
      );
      log(
        `   • Optimized: ${stats.optimized.converted} converted, ${stats.optimized.skipped} skipped, ${stats.optimized.errors} errors`
      );
    } else {
      log("No image files found to optimize.");
    }
  } catch (err) {
    log(`❌ Fatal error: ${err.message}`);
    process.exit(1);
  }
}

main();
