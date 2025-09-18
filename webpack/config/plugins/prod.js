// webpack/config/plugins/prod.js
import CompressionPlugin from "compression-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import S3UploadPlugin from "./s3-upload-plugin.js";
import { loadDeployConfig } from "../../../scripts/load-config.mjs";

export function prodPlugins() {
  const plugins = [
    new CompressionPlugin({
      algorithm: "brotliCompress",
      filename: "[path][base].br",
      test: /\.(js|css|html|svg)$/i,
      compressionOptions: { level: 11 },
      deleteOriginalAssets: false,
    }),
    new CompressionPlugin({
      algorithm: "gzip",
      filename: "[path][base].gz",
      test: /\.(js|css|html|svg)$/i,
      deleteOriginalAssets: false,
    }),
  ];

  // Add S3 upload plugin if deploying
  if (process.env.DEPLOY_TO_S3) {
    const cfg = loadDeployConfig();
    plugins.push(
      new S3UploadPlugin({
        bucket: cfg.s3Bucket,
        region: cfg.awsRegion,
        distributionId: cfg.cloudFrontDistributionId,
      })
    );
  }

  if (process.env.ANALYZE) {
    plugins.push(
      new BundleAnalyzerPlugin({ analyzerMode: "static", openAnalyzer: false })
    );
  }

  return plugins;
}
