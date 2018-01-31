const webpack = require('webpack')
const path = require('path');

let config = {
    entry: {
        main: "./src/index.jsx"
    },
    output: {
        path: path.resolve(__dirname, 'static'),
        publicPath: "/static/",
        filename: 'js/ui-bundle.js'
    },
    resolve: {
        extensions: [
            '.jsx', '.js', '.json'
        ],
        modules: [
            'node_modules',
            path.resolve(__dirname, './node_modules')
        ]
    },
    module: {
        loaders: [{
                test: /\.css$/,
                use: [require.resolve('style-loader'), 'css-loader?url-loader?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]', require.resolve('postcss-loader')]
            },
            {
            test: /\.jsx?$/,
            loader: 'babel-loader',
            query: {
                presets: ['env', 'stage-0', 'react']
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