const webpack = require('webpack')
const path = require('path');

let config = {
    entry: path.resolve(__dirname, 'src/txgui/txgui.js'),
    output: {
        path: path.resolve(__dirname, ''),
        filename: 'static/trxgui.js',
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            query: {
                presets: ['env', 'react']
            }
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({
            "React": "react",
        }),
        ["transform-object-rest-spread", { "useBuiltIns": true }]

    ],

};

module.exports = config;