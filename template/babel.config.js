const path = require('path')

module.exports = function(api) {
    api.cache(true)

    const presets = [
        '@babel/preset-env',
        // 支持 ts
        '@babel/preset-typescript'
    ]
    const plugins = [
        // 转换 ts 语言
        ['@babel/plugin-transform-typescript', { allowNamespaces: true }],
        // class 转换
        '@babel/proposal-class-properties',
        // 支持 解构
        '@babel/plugin-proposal-object-rest-spread',
        // 减少冗余代码，使用Module构建
        [
            '@babel/plugin-transform-runtime',
            {
                useESModules: true
            }
        ],
        [
            'module-resolver',
            {
                root: './',
                alias: {
                    '@': './src'
                }
            }
        ]
    ]

    return {
        presets,
        plugins
    }
}
