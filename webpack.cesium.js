const webpack = require('webpack')
const path = require('path');

let config = {
    entry: path.resolve(__dirname, 'src/cesium/index.js'),
    output: {
        path: path.resolve(__dirname, ''),
        filename: 'static/bundle.js'
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            query: {
                presets: ['es2015', 'react']
            }
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({
            "React": "react",
        }),
    ]
};

module.exports = config;