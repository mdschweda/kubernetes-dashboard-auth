const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, args) => ({
    mode: "production",
    entry: path.resolve(__dirname, "src/frontend/index.js"),
    output: {
        path: path.resolve(__dirname, "dist/static"),
        filename: "index.js"
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: "html-loader",
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            options: { }
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            includePaths: [
                                path.resolve(__dirname, "node_modules/material-design-lite/src")
                            ]
                        }
                    }
                    
                ]
            },
            {
                test: /\.js$/,
                exclude: path.resolve(__dirname, "node_modules"),
                use: [{
                    loader: "babel-loader?chacheDirectory",
                    options: {
                        presets: [
                            [ "@babel/preset-env", {
                                useBuiltIns: "entry"
                            }]
                        ]
                    }
                }]
            },
        ],
    },

    resolve: {
        alias: {
            mdl: path.resolve(__dirname, "node_modules/material-design-lite/src")
        }
    },

    plugins: [
        new HtmlWebPackPlugin({
            template: "./src/frontend/index.html"
        }),
        new MiniCssExtractPlugin({
            filename: "style.css"
        }),
        new CopyWebpackPlugin([{
            context: __dirname,
            from: "./src/static"
        }])
    ],

    devtool: "source-map"
});
