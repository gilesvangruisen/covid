const path = require("path")
const LodashModuleReplacementPlugin = require("lodash-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

const devMode = process.env.NODE_ENV !== "production"

module.exports = {
  entry: "./src/app/index.js",
  devtool: "",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.(css)$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx", ".svg"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "",
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  devServer: {
    stats: {
      children: false, // Hide children information
      maxModules: 0, // Set the maximum number of modules to be shown
    },

    hot: true,
    inline: true,

    contentBase: path.join(__dirname, "dist"),
    historyApiFallback: {
      disableDotRule: true,
      index: "index.html",
    },
  },
  plugins: [new MiniCssExtractPlugin()],
}
