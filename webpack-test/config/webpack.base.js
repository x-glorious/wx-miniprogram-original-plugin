const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const { WxMiniProgramOriginalPlugin, relativeFileLoaderFac } = require('../dist/index')

const srcDir = path.resolve(__dirname, `../src`)
const outputDir = path.resolve(__dirname, `../output`)

const wxMiniProgramOriginalPlugin = new WxMiniProgramOriginalPlugin({
    outputDir: outputDir,
    additionalWxssSuffixArray: ['scss']
})
const relativeFileLoader = relativeFileLoaderFac(srcDir)

module.exports = {
    entry: wxMiniProgramOriginalPlugin.getEntry(),
    context: srcDir,
    output: wxMiniProgramOriginalPlugin.getOutput(),
    output: {
        path: outputDir,
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.js', '.ts'],
        // 所有的三方模块
        modules: [path.resolve(__dirname, '../node_modules')],
        alias: {
            '@': srcDir
        }
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                use: [
                    relativeFileLoader('js'),
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    },
                    'eslint-loader'
                ],
                include: srcDir,
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif)$/,
                include: srcDir,
                use: relativeFileLoader()
            },
            {
                test: /\.scss$/,
                include: srcDir,
                use: [relativeFileLoader('wxss'), 'sass-loader']
            },
            {
                test: /\.map$/,
                include: srcDir,
                use: [relativeFileLoader('json')]
            },
            {
                test: /\.wxml$/,
                include: srcDir,
                use: [relativeFileLoader('wxml')]
            }
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            tsconfig: path.resolve(__dirname, '../tsconfig.json'),
            async: false
        }),
        new StyleLintPlugin({
            context: srcDir,
            configFile: path.resolve(__dirname, '../.stylelintrc.js'),
            quiet: true,
            syntax: 'scss',
            fix: true
        }),
        new FriendlyErrorsWebpackPlugin({
            compilationSuccessInfo: {
                notes: ['----------Webpack finished-----------']
            },
            // should the console be cleared between each compilation?
            // default is true
            clearConsole: true
        }),
        wxMiniProgramOriginalPlugin,
        new CleanWebpackPlugin()
    ],
    stats: 'errors-only'
}
