var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin")
/*
 * Default webpack configuration for development
 */
var config = {
  devtool: 'eval-source-map',
  entry:  __dirname + "/app/App.js",
  output: {
    path: __dirname + "/public",
    filename: "bundle.js"
  },
  plugins: [
     new ExtractTextPlugin( "styles.css" )
  ],
  module: {
    loaders: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015','react','stage-0',{"plugins": ["./babelRelayPlugin"]}]
      }
    },
    {
     test: /\.css$/,
     loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
   }
    ]
  },
  devServer: {
    contentBase: "./public",
    port: 3001,
    historyApiFallback: true,
    inline: true
  },
}

/*
 * If bundling for production, optimize output
 */
if (process.env.NODE_ENV === 'production') {
  config.devtool = false;
  config.plugins = [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({comments: false}),
    new webpack.DefinePlugin({
      'process.env': {NODE_ENV: JSON.stringify('production')}
    })
  ];
};


module.exports = config;
