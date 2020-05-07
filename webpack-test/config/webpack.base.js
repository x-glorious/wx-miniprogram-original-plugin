const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const WxAppJsonPlugin = require('../helper/js/wxAppJsonPlugin.js')
const test = require('../dist/index')

console.log(test)
const srcDir = path.resolve(__dirname, `../src`)
const outputDir = path.resolve(__dirname, `../output`)
const tempDir = path.resolve(__dirname, `../.temp`)
const rubbishDirName = 'rubbish'

const wxAppJsonPluginObj = new WxAppJsonPlugin({
    outputDir: outputDir,
    srcDir: srcDir,
    pageFileSuffixArray: ['map', 'scss', 'ts', 'wxml'],
    tempDir: tempDir,
    appLevelFiles: [
        path.resolve(srcDir, 'app.map'),
        path.resolve(srcDir, 'app.ts'),
        path.resolve(srcDir, 'app.scss'),
        path.resolve(srcDir, 'project.config.map'),
        path.resolve(srcDir, 'sitemap.map'),
        path.resolve(srcDir, 'test.json')
    ],
    appJsonPath: path.resolve(srcDir, 'app.map'),
    dependencyPairs: [
        {
            suffix: 'ts',
            importRegex: /import\s+[^'"]+\s+from\s+(?:'|")([^'"]+?)(?:'|")/g,
            aliasInfo: {
                aliasSymbol: '@',
                matchPath: srcDir
            }
        }
    ],
    defaultExt: 'ts'
})

const relativeFileLoader = (ext = '[ext]') => {
    return {
        loader: 'file-loader',
        options: {
            useRelativePath: true,
            name: `[path][name].${ext}`,
            context: srcDir
        }
    }
}

module.exports = {
    entry: wxAppJsonPluginObj.getEntry(),
    context: srcDir,
    output: {
        filename: '[name].js',
        path: outputDir
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
                test: /\.ts$/,
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
        wxAppJsonPluginObj,
        new CleanWebpackPlugin()
    ],
    stats: 'errors-only',
    optimization: {
        // 由于小程序的特殊性，并不需要做额外的分包处理，只把 多余的 webpack runtime 剔除掉
        runtimeChunk: {
            name: `test/${rubbishDirName}/runtime`
        }
    }
}
