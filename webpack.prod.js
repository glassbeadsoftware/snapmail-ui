const merge = require('webpack-merge');
const common = require('./webpack.common.js');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

process.env.NODE_ENV = 'prod';

module.exports = merge(common, {
  optimization: {
    minimize: true
  },
  mode: 'production',
  devServer: {
    contentBase: './dist',
  },
  // output: {
  //   publicPath: './dist'
  // }
});
