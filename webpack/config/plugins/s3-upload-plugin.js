// webpack/config/plugins/s3-upload-plugin.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import fs from "fs";
import path from "path";
import mime from "mime-types";

class S3UploadPlugin {
  constructor(options = {}) {
    this.options = {
      bucket: process.env.S3_BUCKET_NAME || "street-lawyer-services",
      region: process.env.AWS_REGION || "us-east-1",
      distributionId:
        process.env.CLOUDFRONT_DISTRIBUTION_ID || "E34BHBYCWQMYEU",
      deleteRemoved: true,
      ...options,
    };

    this.s3Client = new S3Client({ region: this.options.region });
    this.cloudFrontClient = new CloudFrontClient({ region: "us-east-1" });
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync(
      "S3UploadPlugin",
      async (compilation, callback) => {
        try {
          await this.uploadFiles(compilation.outputOptions.path);
          await this.invalidateCloudFront();
          callback();
        } catch (error) {
          callback(error);
        }
      }
    );
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    // Custom MIME types for fonts
    const fontMimeTypes = {
      ".woff2": "font/woff2",
      ".woff": "font/woff",
      ".ttf": "font/ttf",
      ".otf": "font/otf",
      ".eot": "application/vnd.ms-fontobject",
    };

    return (
      fontMimeTypes[ext] || mime.lookup(filePath) || "application/octet-stream"
    );
  }

  getCacheControl(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    // Static assets get long cache times
    if (
      [
        ".woff2",
        ".woff",
        ".ttf",
        ".otf",
        ".eot",
        ".js",
        ".css",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".webp",
        ".avif",
      ].includes(ext)
    ) {
      return "public, max-age=31536000, immutable";
    }

    // HTML files get shorter cache times
    if (ext === ".html") {
      return "public, max-age=3600";
    }

    return "public, max-age=86400";
  }

  async uploadFiles(outputPath) {
    const files = this.getAllFiles(outputPath);

    console.log(`Uploading ${files.length} files to S3...`);

    for (const file of files) {
      const relativePath = path.relative(outputPath, file);
      const key = relativePath.replace(/\\/g, "/"); // Convert Windows paths

      const fileContent = fs.readFileSync(file);
      const contentType = this.getContentType(file);
      const cacheControl = this.getCacheControl(file);

      const command = new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: cacheControl,
      });

      await this.s3Client.send(command);
      console.log(`Uploaded: ${key} (${contentType})`);
    }
  }

  getAllFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async invalidateCloudFront() {
    const command = new CreateInvalidationCommand({
      DistributionId: this.options.distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: ["/*"],
        },
        CallerReference: Date.now().toString(),
      },
    });

    await this.cloudFrontClient.send(command);
    console.log("CloudFront invalidation created");
  }
}

export default S3UploadPlugin;
