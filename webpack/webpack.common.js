import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";
import { config as dotenvConfig } from "dotenv";
import paths from "./config/paths.js";
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";

// Load .env file from project root with explicit path
const envPath = path.resolve(process.cwd(), ".env");
console.log("🔍 Loading .env from:", envPath);

// Load dotenv with explicit path and debug output
const dotenvResult = dotenvConfig({ path: envPath });

if (dotenvResult.error) {
  console.warn("⚠️ Could not load .env file:", dotenvResult.error.message);
  console.log("📁 Current working directory:", process.cwd());
  console.log(
    "📄 Make sure .env file exists at project root (same level as package.json)"
  );
} else {
  console.log("✅ Loaded .env file successfully");
  console.log(
    "🔑 Found environment variables:",
    Object.keys(dotenvResult.parsed || {})
  );
}

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

// Get environment variables from both .env file and process.env
const raw = {
  ...process.env, // Start with process.env
  ...(dotenvResult.parsed || {}), // Override with .env file values
};

const filtered = Object.keys(raw)
  .filter((k) => allowedEnv.includes(k))
  .reduce((acc, k) => ({ ...acc, [k]: raw[k] }), {});

// Ensure NODE_ENV is always set
if (!filtered.NODE_ENV) {
  filtered.NODE_ENV = process.env.NODE_ENV || "development";
}

// Debug output for environment variables
console.log("🌍 Environment variables being injected:");
allowedEnv.forEach((key) => {
  const value = filtered[key];
  const status = value ? "✅ SET" : "❌ NOT SET";
  const displayValue =
    key.includes("API_KEY") && value
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : value;
  console.log(`  ${key}: ${status}${value ? ` (${displayValue})` : ""}`);
});

// Helper to build HtmlWebpackPlugin instances for each route (exported for prod config)
export function buildHtmlPlugins(routeMeta = []) {
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

// Helper to build the plugins array (exported for dev config if needed)
export function basePlugins({ enableCssExtract }) {
  const envVars = Object.entries(filtered).reduce((acc, [k, v]) => {
    acc[`process.env.${k}`] = JSON.stringify(v);
    return acc;
  }, {});

  console.log("🔧 DefinePlugin will inject:", Object.keys(envVars));

  const list = [new webpack.DefinePlugin(envVars)];

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

// Main webpack config export (only valid webpack config keys)
const commonConfig = {
  entry: paths.src + "/index.tsx", // adjust as needed
  output: {
    path: paths.dist,
    filename: "[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
        exclude: /node_modules/,
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: { filename: "fonts/[name][ext]" },
      },
      // Add other loaders (e.g., for images) as needed
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": paths.src,
    },
  },
  plugins: [
    ...basePlugins({ enableCssExtract: true }),
    new HtmlWebpackPlugin({
      template: paths.public + "/index.html",
      filename: "index.html",
      minify: false,
    }),
  ],
  // Add other config keys as needed (e.g., devtool, devServer, optimization)
};

export default commonConfig;
