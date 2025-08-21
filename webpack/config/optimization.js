// webpack/config/optimization.js
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";

export const sharedOptimization = {
  runtimeChunk: "single",
  splitChunks: {
    chunks: "all",
    cacheGroups: {
      // Split React libraries
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: "react",
        chunks: "all",
        priority: 30,
      },
      // Split animation libraries separately
      animations: {
        test: /[\\/]node_modules[\\/](framer-motion|gsap)[\\/]/,
        name: "animations",
        chunks: "all",
        priority: 25,
      },
      // Split utility libraries
      utils: {
        test: /[\\/]node_modules[\\/](lodash|clsx|tailwind-merge)[\\/]/,
        name: "utils",
        chunks: "all",
        priority: 15,
      },
      // Vendor fallback (other node_modules)
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendor",
        chunks: "all",
        priority: 20,
      },
      // Common code
      common: {
        minChunks: 2,
        name: "common",
        priority: 10,
        reuseExistingChunk: true,
      },
    },
  },
};

export const prodOptimization = {
  ...sharedOptimization,
  minimize: true,
  minimizer: [
    "...", // Terser
    new CssMinimizerPlugin(),
  ],
  moduleIds: "deterministic",
  chunkIds: "deterministic",
  sideEffects: true,
  usedExports: true,
  concatenateModules: true,
};
