import { Compiler } from 'webpack'
import {
    getWebpackSystemInfos,
    setRuntimeChunk,
    makeEnvironment,
    getOutput,
    getEntry
} from './tools'

export enum FileTypeEnum {
    JS,
    WXSS,
    WXML,
    JSON
}

export type ExtMap = Map<FileTypeEnum, string[]>

export interface IFileInfo {
    /**
     * 文件绝对路径
     */
    absolutePath: string
    /**
     * 文件依赖
     */
    dependencies: Set<string>
    /**
     * import时的相对路径
     */
    importPath: string
}

/**
 * 文件分析器类型
 * @param fileAbsolutePath 文件绝对路径
 * @param webpackSystemInfo 从webpack中获取的信息
 * @param options 用户设定的信息
 * @param additionalDependencies 额外的依赖
 * @returns 文件依赖信息接口
 */
export type FileAnalyzer = (
    fileAbsolutePath: string,
    webpackSystemInfo: IWebpackSystemInfo,
    options: IOptions,
    additionalDependencies?: Set<string>
) => IFileInfo

export interface IOptions {
    /**
     * wxss 文件在src源代码中所对应的额外的后缀
     */
    additionalWxssSuffixArray: string[]
    /**
     * 输出目录
     */
    outputDir: string
}

export interface IAliasInfo {
    /**
     * 符号
     */
    symbolString: string
    /**
     * 路径
     */
    path: string
}

export interface IWebpackSystemInfo {
    srcDir: string
    aliasInfos: IAliasInfo[]
}

export class WxMiniProgramOriginalPlugin {
    private static readonly PLUGIN_NAME = 'WxMiniProgramOriginalPlugin'
    /**
     * 从 webpack 中所获取的信息
     */
    private webpackSystemInfo: IWebpackSystemInfo = { srcDir: '', aliasInfos: [] }
    /**
     * 插件设置信息
     */
    private options: IOptions

    constructor(options: Partial<IOptions>) {
        const { additionalWxssSuffixArray = [], outputDir } = options

        if (!outputDir) {
            throw new Error('options outputDir not set')
        }

        this.options = {
            additionalWxssSuffixArray,
            outputDir
        }
        // 准备环境
        makeEnvironment()
    }

    apply(compiler: Compiler) {
        // 获取webpack 系统信息
        this.webpackSystemInfo = getWebpackSystemInfos(compiler)
        // 设置runtime chunk
        setRuntimeChunk(compiler, this.options.outputDir)
    }

    /**
     * 获取webpack所需的入口
     */
    public getEntry() {
        return getEntry(this.options.outputDir)
    }

    /**
     * 获取webpack所需的output信息
     */
    public getOutput() {
        return getOutput(this.options.outputDir)
    }
}
