const merge = require('webpack-merge')
const base = require('./webpack.base.js')

module.exports = merge(base, {
    mode: 'development',
    watch: true,
    watchOptions: {
        // 不监听的文件或文件夹，支持正则匹配
        ignored: /node_modules/
    }
})
