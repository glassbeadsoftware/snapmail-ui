const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');

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
