const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const SRC_DIR = path.resolve(__dirname, 'src');
const DIST_DIR = path.resolve(__dirname, 'dist');

const extractPlugin = new ExtractTextPlugin({ filename: 'bundle.css', disable: false, allChunks: true });

module.exports = {
  entry: {
    app: './src/app',
    adminApp: './src/Admin',
    studentApp: './src/Student',
  },
  output: {
    filename: 'Student',
    path: __dirname + '/dist',
  },
  resolve: {
    extensions: ['.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.(pdf)$/i,
        use: 'file-loader'
      },
      {
        test: /\.node$/,
        use: 'raw-loader'
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: 'file-loader'
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        use: 'file-loader'
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader']
      },
      {
        test: /\.html$/,
        use: 'html-loader'
      },{
        test: /\.node$/,
        use: 'file-loader'
      },
    ]
  },
  plugins: [
    extractPlugin,
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname,
        debug: true
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      minimize: true
    })
  ]
};
