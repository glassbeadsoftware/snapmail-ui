const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: './src/index.js',
    // hc_bridge: './src/hc-bridge.js',
    // main: './src/main.js',
    // mail: './src/mail.js',
  },
  plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV']),
      new HtmlWebpackPlugin({
        template: './src/index.html'
      }),
      new CopyWebpackPlugin([
        {
          context: 'node_modules/@webcomponents/webcomponentsjs',
          from: '**/*.js',
          to: 'webcomponents'
        }
        , { context: './', from: './src/app.js', to: './' }
        , { context: './', from: './src/mail.js', to: './' }
        , { context: './', from: './src/hc_bridge.js', to: './' }
        , { context: './', from: './src/utils.js', to: './' }
      ])
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
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: (url, resourcePath) => {
                // resourcePath - path to css file

                // Don't handle `splash-image.png` urls
                if (url.includes('splash-image.png')) {
                  return false
                }

                return true
              },
            },
          },
        ],
      },
    ],
  },
}
