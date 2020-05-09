import { Compiler } from 'webpack'
import Path from 'path'
import Fs from 'fs'
import Settings from './settings'
import { IAliasInfo, IWebpackSystemInfo, FileTypeEnum, ExtMap } from './index'

/**
 * 获取webpack 系统信息
 * @param compiler webpack compiler
 */
export const getWebpackSystemInfos = (compiler: Compiler): IWebpackSystemInfo => {
    const { context = '', resolve: { alias = {} } = {} } = compiler.options
    const aliasInfos: IAliasInfo[] = []

    if (!context) {
        throw new Error('Webpack context should be set to wxminiProgram root dir')
    }

    for (const keyString in alias) {
        aliasInfos.push({
            symbolString: keyString,
            path: alias[keyString]
        })
    }

    return {
        srcDir: context,
        aliasInfos
    }
}

/**
 * 设置webpack runtime chunk ，将webpack 运行时文件抽离出来
 * @param compiler webpack compiler
 * @param outputDir 输出目录
 * @param pluginDir 插件所在目录（也就是Index.ts所在的目录）
 */
export const setRuntimeChunk = (compiler: Compiler, outputDir: string) => {
    const { runtimeChunkPath } = Settings
    const runtimeRelativePath = Path.relative(outputDir, runtimeChunkPath)

    compiler.options.optimization!.runtimeChunk = {
        name: runtimeRelativePath
    }
}

/**
 * 获取webpack 输出
 * @param outputDir 输出目录
 */
export const getOutput = (outputDir: string) => {
    return {
        filename: '[name].js',
        path: outputDir
    }
}

/**
 * 获取webpack entry
 * @param outputDir 输出目录
 * @param pluginDir 插件所在目录
 */
export const getEntry = (outputDir: string) => {
    const { fakerImporterPath } = Settings

    const fakerRelativePath = Path.relative(outputDir, fakerImporterPath)

    return {
        [fakerRelativePath]: fakerImporterPath
    }
}

/**
 * 创建环境
 * @param pluginDir 插件所在目录
 */
export const makeEnvironment = () => {
    const { cacheDir, fakerImporterPath } = Settings

    // 确保 缓存目录存在
    if (!Fs.existsSync(cacheDir)) {
        Fs.mkdirSync(cacheDir)
    }

    // 确保 faker importer 存在
    Fs.writeFileSync(fakerImporterPath, '', {
        flag: 'w'
    })
}

/**
 * 将导入的路径信息转换成真实路径
 * ps: 会做别名处理（为了支持别名绝对路径）
 * @param importFilePath 导入文件路径
 * @param aliasInfos 别名信息
 */
export const transformImportPathToRealPath = (importFilePath: string, aliasInfos: IAliasInfo[]) => {
    let result = importFilePath

    aliasInfos.forEach(({ symbolString, path }) => {
        if (result.includes(symbolString)) {
            result = Path.resolve(path, result.replace(symbolString, '.'))
        }
    })

    return result
}

/**
 * 获取faker导入所需要的相对路径
 * @param fileAbsolutePath 文件绝对路径
 * @param preserveExt 是否保留后缀，默认保留
 */
export const getFakerImportRelativePath = (fileAbsolutePath: string, preserveExt = true) => {
    const { cacheDir } = Settings
    const result = Path.relative(cacheDir, fileAbsolutePath)

    if (preserveExt) {
        return result
    }

    // 不保留文件后缀
    const dotIndex = result.lastIndexOf('.')
    return result.slice(0, dotIndex)
}

/**
 * 转换Import根路径或者相对路径到绝对路径
 * @param fileAbsolutePath 文件绝对路径
 * @param importPath import的路径（根路径或者相对路径）
 * @param srcDir 微信小程序根目录
 */
export const transformRootOrRelativeToRealPath = (
    fileAbsolutePath: string,
    importPath: string,
    srcDir: string
) => {
    // 根目录
    if (importPath.startsWith('/')) {
        return Path.resolve(srcDir, importPath.slice(1))
    }
    // 相对路径
    else {
        const fileDir = Path.dirname(fileAbsolutePath)
        return Path.resolve(fileDir, importPath)
    }
}

/**
 * 获取搜索后缀地图
 * @param additionalWxssSuffixArray 额外的wxss文件后缀
 */
export const getSearchExtInfo = (additionalWxssSuffixArray: string[]) => {
    const jsArray = ['js', 'ts']
    const jsonArray = ['json']
    const wxmlArray = ['wxml']
    const wxssArray = ['wxss', ...additionalWxssSuffixArray]

    const extMap: ExtMap = new Map([
        [FileTypeEnum.JS, jsArray],
        [FileTypeEnum.JSON, jsonArray],
        [FileTypeEnum.WXML, wxmlArray],
        [FileTypeEnum.WXSS, wxssArray]
    ])

    return {
        extMap,
        extArray: [jsonArray, jsArray, wxssArray, wxmlArray]
    }
}

/**
 * 获取所属文件类型
 * @param absoluteFilePath 文件绝对路径
 * @param expMap 文件后缀地图
 * @returns undefined 代表文件类型不在已知列表
 */
export const getBelongFileType = (absoluteFilePath: string, extMap: ExtMap) => {
    const extName = Path.extname(absoluteFilePath)

    for (const [fileType, extArray] of Array.from(extMap.entries())) {
        if (extArray.includes(extName)) {
            return fileType
        }
    }

    return undefined
}
