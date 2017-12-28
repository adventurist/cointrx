const webpack = require('webpack')
const path = require('path');

let config = {
    entry: path.resolve(__dirname, 'txgui.js'),
    output: {
        path: path.resolve(__dirname, ''),
        filename: 'trxgui.js',
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            query: {
                presets: ['es2017', 'react']
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