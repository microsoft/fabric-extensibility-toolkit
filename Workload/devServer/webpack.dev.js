const { merge } = require('webpack-merge');
const baseConfig = require('../webpack.config.js');
const express = require("express");
const Webpack = require("webpack");
const { registerDevServerApis } = require('.'); // Import our manifest API


// making sure the dev configuration is set correctly!
// TODO: once we use the manifest for publishing we can remove this.
process.env.DEV_AAD_CONFIG_FE_APPID = process.env.FRONTEND_APPID;
process.env.DEV_AAD_CONFIG_BE_APPID = process.env.BACKEND_APPID;
process.env.DEV_AAD_CONFIG_BE_AUDIENCE= ""
process.env.DEV_AAD_CONFIG_BE_REDIRECT_URI=process.env.BACKEND_URL;


console.log('********************    Development Variables    *******************');
console.log('process.env.DEV_AAD_CONFIG_FE_APPID: ' + process.env.DEV_AAD_CONFIG_FE_APPID);
console.log('process.env.DEV_AAD_CONFIG_BE_APPID: ' + process.env.DEV_AAD_CONFIG_BE_APPID);
console.log('process.env.DEV_AAD_CONFIG_BE_AUDIENCE: ' + process.env.DEV_AAD_CONFIG_BE_AUDIENCE);
console.log('process.env.DEV_AAD_CONFIG_BE_REDIRECT_URI: ' + process.env.DEV_AAD_CONFIG_BE_REDIRECT_URI);
console.log('*********************************************************************');


module.exports = merge(baseConfig, {
    mode: "development",
    devtool: "source-map",
    plugins: [
        new Webpack.DefinePlugin({
            "process.env.DEV_AAD_CONFIG_FE_APPID": JSON.stringify(process.env.DEV_AAD_CONFIG_FE_APPID),
            "process.env.DEV_AAD_CONFIG_BE_APPID": JSON.stringify(process.env.DEV_AAD_CONFIG_BE_APPID),
            "process.env.DEV_AAD_CONFIG_BE_AUDIENCE": JSON.stringify(process.env.DEV_AAD_CONFIG_BE_AUDIENCE),
            "process.env.DEV_AAD_CONFIG_BE_REDIRECT_URI": JSON.stringify(process.env.DEV_AAD_CONFIG_BE_REDIRECT_URI),
            "NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development")
        }),
    ],
    devServer: {
        port: 60006,
        host: '127.0.0.1',
        open: false,
        historyApiFallback: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "*"
        },
        setupMiddlewares: function (middlewares, devServer) {
            console.log('*********************************************************************');
            console.log('****               Server is listening on port 60006             ****');
            console.log('****   You can now override the Fabric manifest with your own.   ****');
            console.log('*********************************************************************');

            // Add JSON body parsing middleware for our APIs
            devServer.app.use(express.json());
            
            // Add global CORS middleware
            devServer.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
                
                // Handle preflight requests
                if (req.method === 'OPTIONS') {
                    res.sendStatus(204);
                } else {
                    next();
                }
            });
            
            // Register the manifest API from our extracted implementation
            registerDevServerApis(devServer.app);

            return middlewares;
        },
    }
});