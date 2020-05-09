import Fs from 'fs'
import {
    transformRootOrRelativeToRealPath,
    getFakerImportRelativePath,
    getSearchExtInfo
} from '../tools'
import { FileAnalyzer } from '../index'

interface IJson {
    pages: string[]
    usingComponents: {
        [key: string]: string
    }
}

/**
 * 获得前缀所对应的页面或者组件的4文件
 * @param prefixPath page components的文件前缀
 * @param additionalWxssSuffixArray wxss可能会使用额外的文件后缀
 */
const getPageOrComponentFiles = (prefixPath: string, additionalWxssSuffixArray: string[]) => {
    const { extArray } = getSearchExtInfo(additionalWxssSuffixArray)
    const filePathArray = []

    for (const oneFileTypeArray of extArray) {
        for (const ext of oneFileTypeArray) {
            const filePath = `${prefixPath}.${ext}`
            if (Fs.existsSync(filePath)) {
                filePathArray.push(filePath)
                break
            }
        }
    }

    // 4文件不全，则报错
    if (filePathArray.length !== 4) {
        throw new Error(`Page or components file structure incomplete`)
    }

    return filePathArray
}

/**
 * json文件分析器
 * 注意，json文件中有 pages数组 和 usingComponents 对象
 */
const analyzer: FileAnalyzer = (
    fileAbsolutePath,
    webpackSystemInfo,
    options,
    additionalDependencies
) => {
    const dependencies = new Set<string>(additionalDependencies ? additionalDependencies : [])

    const content = Fs.readFileSync(fileAbsolutePath).toString()
    const jsonObj = JSON.parse(content) as IJson
    const { pages, usingComponents } = jsonObj

    const disposePrefixArray = new Set<string>()

    // 获取Pages usingComponents里面对应的路径
    if (pages) {
        pages.forEach((item) => {
            disposePrefixArray.add(item)
        })
    }
    if (usingComponents) {
        for (const keyString in usingComponents) {
            disposePrefixArray.add(usingComponents[keyString])
        }
    }

    disposePrefixArray.forEach((item) => {
        // 获取前缀的绝对路径
        const prefixAbsolutePath = transformRootOrRelativeToRealPath(
            fileAbsolutePath,
            item,
            webpackSystemInfo.srcDir
        )
        const filePathArray = getPageOrComponentFiles(
            prefixAbsolutePath,
            options.additionalWxssSuffixArray
        )
        filePathArray.forEach((filePath) => dependencies.add(filePath))
    })

    return {
        absolutePath: fileAbsolutePath,
        dependencies,
        importPath: getFakerImportRelativePath(fileAbsolutePath)
    }
}

export default analyzer
