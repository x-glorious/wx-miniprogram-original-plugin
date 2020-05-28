module.exports = {
    // 引入标准配置文件和scss配置扩展
    extends: ['stylelint-config-standard', 'stylelint-config-recommended-scss'],
    plugins: ['stylelint-scss'],
    ignoreFiles: ['./**/*.js', './**/*.ts', './**/*.css', './node_modules/**/*'],
    // 根据组内约定修改以下自定义规则覆盖默认规则
    rules: {
        // 最大嵌套层级4层
        'max-nesting-depth': [4],
        // 缩进尺寸 4
        indentation: 4,
        // 引号必须为单引号
        'string-quotes': ['single'],
        // 冒号后要加空格
        'declaration-colon-space-after': ['always'],
        // 冒号前不加空格
        'declaration-colon-space-before': ['never'],
        // 属性单独成行
        'declaration-block-single-line-max-declarations': [1],
        // 属性和值前不带厂商标记（通过autofixer自动添加，不要自己手工写）
        'property-no-vendor-prefix': [true],
        // 无需厂商前缀
        'value-no-vendor-prefix': [true],
        // 不能使用颜色名定义颜色，只能使用HEX、rgab或hsl格式
        'color-named': ['never'],
        // url值必须使用单引号包裹
        'function-url-quotes': ['always'],
        // 不要使用@while
        'at-rule-blacklist': ['while'],
        // 多选择器必须单独成行，逗号结尾
        'selector-list-comma-newline-after': ['always'],
        // 不能有无效的16进制颜色值
        'color-no-invalid-hex': [true],
        // 允许 :global 伪类前面没有任何选择器
        'no-descending-specificity': null,
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global']
            }
        ],
        'unit-no-unknown': null,
        // 允许的单位
        'unit-whitelist': ['rpx', '%', 'px']
    }
}
