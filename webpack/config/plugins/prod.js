// webpack/config/plugins/prod.js
import CompressionPlugin from "compression-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import S3UploadPlugin from "./s3-upload-plugin.js";

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
    plugins.push(new S3UploadPlugin());
  }

  if (process.env.ANALYZE) {
    plugins.push(
      new BundleAnalyzerPlugin({ analyzerMode: "static", openAnalyzer: false })
    );
  }

  return plugins;
}
