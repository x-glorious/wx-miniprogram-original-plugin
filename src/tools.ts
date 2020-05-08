import { Compiler } from 'webpack'
import Path from 'path'
import Fs from 'fs'
import Settings from './settings'
import { IAliasInfo, IWebpackSystemInfo } from './index'

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
 */
export const getFakerImportRelativePath = (fileAbsolutePath: string) => {
    const { cacheDir } = Settings
    return Path.relative(cacheDir, fileAbsolutePath)
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
