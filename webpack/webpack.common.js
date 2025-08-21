// webpack/webpack.common.js
import paths from "./config/paths.js";
import { buildModuleRules } from "./config/rules.js";
import { basePlugins, buildHtmlPlugins } from "./config/plugins/common.js";

// Basic route meta list (root only; others added in prod config)
const routeMeta = [{ route: "/", filename: "index.html" }];

const config = {
  entry: paths.src + "/index.tsx",
  output: {
    path: paths.dist,
    filename: "js/[name].[contenthash:8].js",
    chunkFilename: "js/[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    alias: { "@": paths.src },
    fallback: { path: false, fs: false },
  },
  module: { rules: buildModuleRules() },
  plugins: [
    ...buildHtmlPlugins(routeMeta),
    ...basePlugins({ enableCssExtract: process.env.NODE_ENV === "production" }),
  ],
};

export default config;
