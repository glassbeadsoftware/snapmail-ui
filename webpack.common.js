const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: './src/index.js',
    // hc_bridge: './src/hc-bridge.js',
    // mail: './src/mail.js',
  },
  plugins: [
      //new webpack.node.NodeEnvironmentPlugin({infrastructureLogging: {level: "info"}}),
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        const mod = resource.request.replace(/^node:/, "");
        switch (mod) {
          case "zlib":
            resource.request = "browserify-zlib";
            break;
          case "fs":
            resource.request = "fs";
            break;
          default:
            throw new Error(`Not found ${mod}`);
        }
      }),
      new webpack.EnvironmentPlugin(['NODE_ENV']),
      new HtmlWebpackPlugin({
        template: './src/index.html'
      }),
      new CopyWebpackPlugin({
        patterns:[
          {
            context: 'node_modules/@webcomponents/webcomponentsjs',
            from: '**/*.js',
            to: 'webcomponents'
          }]
      })
    ],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
  },
  module: {
    rules: [
    ],
  },
  resolve: {
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify")
    },
  }
}
