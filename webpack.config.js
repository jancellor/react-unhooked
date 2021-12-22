const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  name: 'main',
  entry: {
    index: path.resolve(__dirname, 'src/typed-test.tsx'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {chrome: '46'},
                  debug: false,
                  useBuiltIns: 'usage',
                  corejs: 3,
                }],
              ['@babel/preset-react'],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-nullish-coalescing-operator',
              '@babel/plugin-proposal-optional-chaining',
            ],
          },
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {chrome: '46'},
                  debug: false,
                  useBuiltIns: 'usage',
                  corejs: 3,
                }],
              ['@babel/preset-react'],
              ['@babel/preset-typescript'],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-nullish-coalescing-operator',
              '@babel/plugin-proposal-optional-chaining',
            ],
          },
        },
      },
      {test: /\.css$/, use: ['style-loader', 'css-loader']},
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin(
      {template: path.resolve(__dirname, 'src/index.html')}),
  ],
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    historyApiFallback: true,
    // https: true
    // contentBase: "./www",
    // hot: false,
    // inline: false // gets rid of WDS disconnected error
  },
};
