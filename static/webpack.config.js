const webpack = require('webpack')
const path = require('path');

let config = {
    entry: path.resolve(__dirname, 'index.js'),
    output: {
        path: path.resolve(__dirname, ''),
        filename: 'bundle.js'
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            query:
                {
                    presets:['es2015', 'react']
                }
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({
            "React": "react",
        }),
    ],
};

module.exports = config;