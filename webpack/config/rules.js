// webpack/config/rules.js
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import paths from "./paths.js";

const isProd = process.env.NODE_ENV === "production";

export function scriptRule() {
  return {
    test: /\.[tj]sx?$/,
    exclude: /node_modules/,
    use: {
      loader: "babel-loader",
      options: {
        cacheDirectory: true,
        presets: [
          ["@babel/preset-env", { targets: "defaults" }],
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
        plugins: ["@babel/plugin-transform-runtime"],
      },
    },
  };
}

export function cssRule() {
  return {
    test: /\.css$/,
    use: [
      isProd ? MiniCssExtractPlugin.loader : "style-loader",
      {
        loader: "css-loader",
        options: { importLoaders: 1 },
      },
      {
        loader: "postcss-loader",
        options: {
          postcssOptions: {
            config: paths.root + "/postcss.config.cjs",
          },
        },
      },
    ],
  };
}

export function assetRule() {
  return {
    test: /\.(png|jpe?g|gif|webp|avif)$/i,
    type: "asset/resource",
    generator: { filename: "images/[name].[contenthash:8][ext]" },
  };
}

export function svgRule() {
  return {
    test: /\.svg$/i,
    oneOf: [
      {
        resourceQuery: /component/,
        use: [{ loader: "@svgr/webpack", options: { icon: true } }],
      },
      {
        type: "asset/resource",
        generator: { filename: "images/[name].[contenthash:8][ext]" },
      },
    ],
  };
}

export function fontRule() {
  return {
    test: /\.(woff2?|eot|ttf|otf)$/i,
    type: "asset/resource",
    generator: { filename: "fonts/[name][ext]" },
    include: [paths.public + "/fonts", paths.src + "/fonts"],
  };
}

export function imageOptimizationRule() {
  // Only attach in prod optionally to keep dev fast
  if (!isProd) return null;
  return {
    test: /\.(png|jpe?g|gif|webp)$/i,
    enforce: "pre",
    use: [
      {
        loader: "image-webpack-loader",
        options: {
          mozjpeg: { progressive: true, quality: 70 },
          optipng: { optimizationLevel: 5 },
          pngquant: { quality: [0.65, 0.85], speed: 4 },
          gifsicle: { interlaced: false },
          webp: { quality: 75 },
        },
      },
    ],
  };
}

export function buildModuleRules() {
  return [scriptRule(), cssRule(), assetRule(), svgRule(), fontRule()].filter(
    Boolean
  );
}
