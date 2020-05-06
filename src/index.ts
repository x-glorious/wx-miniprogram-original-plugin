export interface IOptions {
    /**
     * 文件输出目录
     */
    outputDir: string
    /**
     * app 设定文件路径
     */
    appSettingFile: string
    /**
     * 页面或者组件文件后置列表
     */
    pageOrComponentSuffixArray: string[]
    /**
     * app 级别的文件列表
     */
    appLevelFiles: string[]
    /**
     * 是否使用了 ts
     */
    isUseTs: boolean
    /**
     * 依赖信息
     * 没有在此数组中 出现的文件，则认为是绝对需要
     */
    dependencyInfos: {
        suffix: string
        importRegex: RegExp
        aliasInfo: {
            aliasSymbol: string
            matchPath: string
        }
    }[]
}

export default '667'
