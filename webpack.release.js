const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

process.env.NODE_ENV = 'prod';

module.exports = merge(common, {
  optimization: {
    minimize: false
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },
})
