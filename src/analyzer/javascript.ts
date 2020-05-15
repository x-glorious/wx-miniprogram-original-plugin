import Fs from 'fs'
import Path from 'path'
import {
    transformImportPathToRealPath,
    getFakerImportRelativePath,
    transformRootOrRelativeToRealPath,
    getSearchExtInfo
} from '../tools'
import { FileAnalyzer, FileTypeEnum } from '../index'

const getRealFilePathWithExt = (searchExtArray: string[], disposeAbsolutePath: string) => {
    const nowExt = Path.extname(disposeAbsolutePath)
    let result = ''
    // 已存在后缀，则无需再次处理
    if (nowExt) {
        return disposeAbsolutePath
    }

    for (const ext of searchExtArray) {
        const filePath = `${disposeAbsolutePath}.${ext}`
        if (Fs.existsSync(filePath)) {
            result = filePath
            break
        }
    }

    if (!result) {
        throw new Error(`File ${disposeAbsolutePath} not exist`)
    }

    return result
}

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
    const starCommentRegex = /\/\*(.|[^.])*?\*\//g
    const lineCommentRegex = /\/\/.*[^.]/g

    const { extMap } = getSearchExtInfo(options.additionalWxssSuffixArray)
    const dependencies = new Set<string>(additionalDependencies ? additionalDependencies : [])
    const content = Fs.readFileSync(fileAbsolutePath).toString()

    // 去除所有js注释，得到真正的内容
    const realContent = content.replace(starCommentRegex, '').replace(lineCommentRegex, '')

    // 获取 import and require 依赖
    const getImportDel = (searchRegex: RegExp) => {
        let temp: string | null = null
        while ((temp = (searchRegex.exec(realContent) || [])[1])) {
            const absolutePath =
                transformImportPathToRealPath(temp, webpackSystemInfo.aliasInfos) ||
                transformRootOrRelativeToRealPath(fileAbsolutePath, temp, webpackSystemInfo.srcDir)
            dependencies.add(getRealFilePathWithExt(extMap.get(FileTypeEnum.JS)!, absolutePath))
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
