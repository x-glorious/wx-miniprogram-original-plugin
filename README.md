# Wx-miniprogram original framework webpack plugin

### First of all

To be honest, this package seemed more like **a helper package** than **a webpack plugin**

But as a coder, give it a right name is the most difficulty thing, so please forget it

This package is work in the wx miniprogram **original framework**（not use the thrid framework like **mpvue**）, help us to auto dispose the **typescript file** or **scss file** with the power of webpack



### Feature

- Add the wx miniprogram code to the control of webpack
- Support the **typescript** file（Support alias path）
- Support the **scss or less** file
- Auto dependency analysis

> Yes, it may seems like do nothing, but what this package do most is the feature 1
>
> Add the wx miniprogram code to the control of webpack
>
> You can use **various feature** of webpack

> Ps : the wx miniprogram framework has **some limit**, so some features may not support now, like some of the **npm packgae** can not be used in this environment, the detail you can find in the offical doc



### Use

**Plugin constructor**

- `additionalWxssSuffixArray`  **string[]** additional wxss suffix, like `scss` (optional)
- `outputDir` **string** the absolute path of the output target dir



**Provide api**

- `getEntry` get the webpack **entry** option
- `output` get the webpack **output** option 

> Ps : please do not set those two options **manual**



### Tooltips

- Webpack context option **must** be set to your root dir（which contain `app.json`）
- In **every rules**, the last of use please use `relativeFileLoader`, you just give only one param（the target file **extname**）



### Webpack config template

```js
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const { WxMiniProgramOriginalPlugin, relativeFileLoaderFac } = require('wx-miniprogram-original-webpack-plugin')

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

```



### Real project

You can find the real project template in mine github test project

Link : https://github.com/ordinaryP/wx-miniprogram-original-plugin/tree/master/webpack-test

