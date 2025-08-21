// webpack/webpack.dev.js
import { merge } from "webpack-merge";
import commonConfig from "./webpack.common.js";
import { devPlugins } from "./config/plugins/dev.js";

const config = merge(commonConfig, {
  mode: "development",
  devtool: "eval-source-map",
  plugins: [...devPlugins()],
  devServer: {
    port: 3001,
    hot: true,
    open: true,
    historyApiFallback: true,
    static: { directory: "./public", watch: true },
    compress: true,
    client: { overlay: { errors: true, warnings: false } },
  },
  optimization: { minimize: false },
});

export default config;
