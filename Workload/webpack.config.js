const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Webpack = require("webpack");
const path = require("path");
const fs = require("fs").promises;


console.log('*******************     Workload Configuration    *******************');
console.log('process.env.WORKLOAD_NAME: ' + process.env.WORKLOAD_NAME);
console.log('process.env.ITEM_NAMES: ' + process.env.ITEM_NAMES);
console.log('process.env.WORKLOAD_VERSION: ' + process.env.WORKLOAD_VERSION);
console.log('process.env.LOG_LEVEL: ' + process.env.LOG_LEVEL);
console.log('*********************************************************************');


module.exports = {
    mode: "production",
    entry: "./app/index.ts",
    output: {
        filename: "bundle.[fullhash].js",
        path: path.resolve(__dirname, "dist"),
        publicPath: '/',
    },
    plugins: [
        new CleanWebpackPlugin(),
        new Webpack.DefinePlugin({
            "process.env.WORKLOAD_NAME": JSON.stringify(process.env.WORKLOAD_NAME),
            "process.env.ITEM_NAMES": JSON.stringify(process.env.ITEM_NAMES),
            "process.env.WORKLOAD_VERSION": JSON.stringify(process.env.WORKLOAD_VERSION),
            "process.env.LOG_LEVEL": JSON.stringify(process.env.LOG_LEVEL),
            "process.env.ENABLE_PLAYGROUND": JSON.stringify(process.env.ENABLE_PLAYGROUND || 'false'),
        }),
        new Webpack.ProvidePlugin({
            process: 'process/browser.js',
        }),
        new HtmlWebpackPlugin({
            template: "./app/index.html",
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    context: './app/assets/',
                    from: '**/*',
                    to: './assets',
                },
                {
                    from: './app/web.config',
                    to: './web.config',
                },
            ]
        }),
    ],
    resolve: {
        modules: [__dirname, "node_modules"],
        extensions: [".*", ".js", ".jsx", ".tsx", ".ts"],
        fullySpecified: false,
        alias: {
            'process/browser': require.resolve('process/browser.js')
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: "ts-loader",
            },
            {
                test: /\.s[ac]ss$/i,
                use: ["style-loader", "css-loader", "sass-loader"],
            },
            {
                test: /\.(png|jpg|jpeg|svg)$/i,
                type: 'asset/resource'
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false
                }
            }
        ],
    }
};