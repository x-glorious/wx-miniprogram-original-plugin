import Fs from 'fs'
import {
    transformImportPathToRealPath,
    getFakerImportRelativePath,
    transformRootOrRelativeToRealPath
} from '../tools'
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

    // const test = content.replace(/\/\/.*?\n/g, '')
    // console.log(test)
    // 去除所有js注释，得到真正的内容
    const realContent = content.replace(starCommentRegex, '').replace(lineCommentRegex, '')

    // 获取 import and require 依赖
    const getImportDel = (searchRegex: RegExp) => {
        let temp: string | null = null
        while ((temp = (searchRegex.exec(realContent) || [])[1])) {
            const absolutePath =
                transformImportPathToRealPath(temp, webpackSystemInfo.aliasInfos) ||
                transformRootOrRelativeToRealPath(fileAbsolutePath, temp, webpackSystemInfo.srcDir)
            dependencies.add(absolutePath)
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
