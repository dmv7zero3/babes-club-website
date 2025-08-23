// webpack/config/plugins/common.js
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";
import { config as dotenvConfig } from "dotenv";
import paths from "../paths.js";
import CopyWebpackPlugin from "copy-webpack-plugin";

// Whitelist env vars (add more as needed)
const allowedEnv = [
  "NODE_ENV",
  "API_BASE_URL",
  "GOOGLE_MAPS_API_KEY",
  "S3_BUCKET_ARN",
  "CLOUDFRONT_DOMAIN",
  "CLOUDFRONT_DISTRIBUTION_ARN",
  "CLOUDFRONT_DISTRIBUTION_ID",
  "API_GATEWAY_ID",
  "API_GATEWAY_URL",
  "API_GATEWAY_RESOURCE_ID",
];
const raw = dotenvConfig().parsed || {};
const filtered = Object.keys(raw)
  .filter((k) => allowedEnv.includes(k))
  .reduce((acc, k) => ({ ...acc, [k]: raw[k] }), {});

// Ensure GOOGLE_MAPS_API_KEY is always injected, even if not in .env
if (!filtered.GOOGLE_MAPS_API_KEY) {
  filtered.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
}

export function buildHtmlPlugins(routeMeta = []) {
  // routeMeta: [{ route: '/', filename: 'index.html', params: {...}}]
  return routeMeta.map(
    (m) =>
      new HtmlWebpackPlugin({
        template: paths.public + "/index.html",
        filename: m.filename,
        templateParameters: m.params || {},
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
        },
      })
  );
}

export function basePlugins({ enableCssExtract }) {
  const envVars = Object.entries(filtered).reduce(
    (acc, [k, v]) => ({ ...acc, [`process.env.${k}`]: JSON.stringify(v) }),
    {}
  );
  const list = [new webpack.DefinePlugin(envVars)];
  // Always copy GSAP plugin files to dist/js/gsap/
  list.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.public + "/js/gsap/*.js*",
          to: "js/gsap/[name][ext]",
          noErrorOnMissing: true,
        },
      ],
    })
  );
  if (enableCssExtract) {
    list.push(
      new MiniCssExtractPlugin({
        filename: "styles/[name].[contenthash:8].css",
        chunkFilename: "styles/[id].[contenthash:8].css",
      })
    );
  }
  return list;
}
