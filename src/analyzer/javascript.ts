import Fs from 'fs'
import { transformImportPathToRealPath, getFakerImportRelativePath } from '../tools'
import { FileAnalyzer } from '../index'

/**
 * javascript文件分析器
 */
const analyzer: FileAnalyzer = (
    fileAbsolutePath,
    webpackSystemInfo,
    options,
    additionalDependencies
) => {
    const importRegex = /import\s+[^'"]+\s+from\s+(?:'|")([^\s'"]+?)(?:'|")/g
    const requireRegex = /require\((?:'|")([^\s'"]+?)(?:'|")/g
    const starCommentRegex = /\/\*(.|\n)*?\*\//g
    const lineCommentRegex = /\/\/.*?\n/g

    const dependencies = new Set<string>(additionalDependencies ? additionalDependencies : [])

    const content = Fs.readFileSync(fileAbsolutePath).toString()
    // 去除所有js注释，得到真正的内容
    const realContent = content.replace(starCommentRegex, '').replace(lineCommentRegex, '')

    // 获取 import and require 依赖
    const getImportDel = (searchRegex: RegExp) => {
        let temp: string | null = null
        while ((temp = (searchRegex.exec(realContent) || [])[1])) {
            dependencies.add(transformImportPathToRealPath(temp, webpackSystemInfo.aliasInfos))
        }
    }
    getImportDel(importRegex)
    getImportDel(requireRegex)

    return {
        absolutePath: fileAbsolutePath,
        dependencies,
        importPath: getFakerImportRelativePath(fileAbsolutePath, false)
    }
}

export default analyzer
