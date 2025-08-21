// webpack/webpack.prod.js
import { merge } from "webpack-merge";
import common from "./webpack.common.js";
import { prodOptimization } from "./config/optimization.js";
import { buildHtmlPlugins } from "./config/plugins/common.js";
import { prodPlugins } from "./config/plugins/prod.js";
import { buildRouteMetaList } from "./config/routes-meta.js";

// Build the enriched route meta list (includes title/description/og/jsonLd)
const routeMeta = buildRouteMetaList();

const prodConfig = merge(common, {
  mode: "production",
  devtool: "source-map",
  optimization: prodOptimization,
});

// Replace HTML plugins from common with full route set
prodConfig.plugins = [
  ...buildHtmlPlugins(routeMeta),
  ...prodConfig.plugins.filter(
    (p) => p.constructor.name !== "HtmlWebpackPlugin"
  ),
  ...prodPlugins(),
];

export default prodConfig;
