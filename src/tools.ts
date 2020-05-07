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
            symbol: keyString,
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
export const setRuntimeChunk = (compiler: Compiler, outputDir: string, pluginDir: string) => {
    const runtimeRealPath = Path.resolve(pluginDir, Settings.runtimeChunkRelativePath)
    const runtimeRelativePath = Path.relative(outputDir, runtimeRealPath)

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
export const getEntry = (outputDir: string, pluginDir: string) => {
    const fakerRealPath = Path.resolve(pluginDir, Settings.fakerImporterRelativePath)
    const fakerRelativePath = Path.relative(outputDir, fakerRealPath)

    return {
        [fakerRelativePath]: fakerRealPath
    }
}

/**
 * 创建环境
 * @param pluginDir 插件所在目录
 */
export const makeEnvironment = (pluginDir: string) => {
    const { cacheRelativeDir, fakerImporterRelativePath } = Settings
    const cacheRealPath = Path.resolve(pluginDir, cacheRelativeDir)
    const fakerImporterRealPath = Path.resolve(pluginDir, fakerImporterRelativePath)

    // 确保 缓存目录存在
    if (!Fs.existsSync(cacheRealPath)) {
        Fs.mkdirSync(cacheRealPath)
    }

    // 确保 faker importer 存在
    Fs.writeFileSync(fakerImporterRealPath, '', {
        flag: 'w'
    })
}
