const path = require('path')

module.exports = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'src', 'index.js'),
  externals: 'react',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
    filename: 'react-selectable-single.js',
    library: 'Selectable',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
    ]
  },
  resolve: {
    modulesDirectories: ['node_modules'],
  }
}
