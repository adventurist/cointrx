const webpack = require('webpack')
const path = require('path');

let config = {
    entry: path.resolve(__dirname, 'src/bot/main.jsx'),
    output: {
        path: path.resolve(__dirname, 'static'),
        publicPath: "/static/",
        filename: 'js/bot-bundle.js'
    },
    module: {
        loaders: [{
            test: /\.css$/,
            use: [require.resolve('style-loader'), 'css-loader?url-loader?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]', require.resolve('postcss-loader')]
        },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                include: [path.resolve(__dirname, './src')],
                query: {
                    presets: ['@babel/preset-env', '@babel/react']
                }
            }]
    },
    plugins: [
        new webpack.ProvidePlugin({
            "React": "react",
        }),

    ],
    devtool: "source-map"
};

module.exports = config;
