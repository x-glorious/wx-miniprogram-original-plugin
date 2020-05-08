import Fs from 'fs'
import { transformRootOrRelativeToRealPath, getFakerImportRelativePath } from '../tools'
import { FileAnalyzer } from '../index'

/**
 * wxml文件分析器
 * 注意，wxml中可以使用根路径，故而，我们不支持别名
 */
const analyzer: FileAnalyzer = (
    fileAbsolutePath,
    webpackSystemInfo,
    options,
    additionalDependencies
) => {
    const importRegex = /<import\s+src="([^"]+?)"\s*\/>/g
    const includeRegex = /<include\s+src="([^"]+?)"\s*\/>/g
    const commentRegex = /<!--.*?-->/g

    const dependencies = new Set<string>(additionalDependencies ? additionalDependencies : [])

    const content = Fs.readFileSync(fileAbsolutePath).toString()
    // 去除所有js注释，得到真正的内容
    const realContent = content.replace(commentRegex, '')

    // 获取 import and require 依赖
    const getImportDel = (searchRegex: RegExp) => {
        let temp: string | null = null
        while ((temp = (searchRegex.exec(realContent) || [])[1])) {
            dependencies.add(
                transformRootOrRelativeToRealPath(fileAbsolutePath, temp, webpackSystemInfo.srcDir)
            )
        }
    }
    getImportDel(importRegex)
    getImportDel(includeRegex)

    return {
        absolutePath: fileAbsolutePath,
        dependencies,
        importPath: getFakerImportRelativePath(fileAbsolutePath)
    }
}

export default analyzer
