/**
 * 为何！assest中有了，为什么不输出到目录下面
 */
import { Compiler, compilation } from 'webpack'
import Path from 'path'
import Fs from 'fs'
import {
    getWebpackSystemInfos,
    setRuntimeChunk,
    makeEnvironment,
    getOutput,
    getEntry,
    getSearchExtInfo,
    getBelongFileType,
    getAppJsonAdditionalDependencies,
    getFakeImportInfos,
    updateFakeContent,
    getJsonAssetInfo,
    refreshAFile
} from './tools'
import JavaScriptAnalyzer from './analyzer/javascript'
import JsonAnalyzer from './analyzer/json'
import WxmlAnalyzer from './analyzer/wxml'
import WxssAnalyzer from './analyzer/wxss'
import Settings from './settings'

export enum FileTypeEnum {
    JS,
    WXSS,
    WXML,
    JSON
}

export type ExtMap = Map<FileTypeEnum, string[]>

export interface IExtInfo {
    /**
     * 后缀地图
     */
    extMap: ExtMap
    /**
     * 展开的搜索后缀列表，和文件类型解耦
     */
    extArray: Array<Array<string>>
}

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
    /**
     * 搜索文件后缀信息
     */
    private searchExtInfo: IExtInfo
    /**
     * 依赖信息表
     */
    private dependencyMap: Map<string, IFileInfo>
    /**
     * 导入文件路径缓存，存留所有fake import的的绝对路径
     */
    private importFilePathCache = new Set<string>()

    constructor(options: Partial<IOptions>) {
        const { additionalWxssSuffixArray = [], outputDir } = options

        if (!outputDir) {
            throw new Error('options outputDir not set')
        }

        this.options = {
            additionalWxssSuffixArray,
            outputDir
        }
        this.dependencyMap = new Map()

        // 缓存搜索后缀地图信息
        this.searchExtInfo = getSearchExtInfo(additionalWxssSuffixArray)

        // 准备环境
        makeEnvironment()
    }

    apply(compiler: Compiler) {
        const { fakerImporterPath } = Settings
        // 获取webpack 系统信息
        this.webpackSystemInfo = getWebpackSystemInfos(compiler)
        // 设置runtime chunk
        setRuntimeChunk(compiler, this.options.outputDir)

        // 更新依赖表
        this.updateDependencyMap(new Set([this.appJsonFilePath]))
        // 更新 fake 文件
        this.updateFake()

        compiler.hooks.watchRun.tap(WxMiniProgramOriginalPlugin.PLUGIN_NAME, (newCompiler, e) => {
            const modifyFiles = (newCompiler as any).watchFileSystem.watcher.mtimes
            const changedFileSet = new Set<string>()

            for (const filePath in modifyFiles) {
                if (Fs.existsSync(filePath) && filePath !== fakerImporterPath) {
                    changedFileSet.add(filePath)
                }
            }

            if (changedFileSet.size) {
                // 更新依赖表
                this.updateDependencyMap(changedFileSet)
                // 更新 fake 文件
                this.updateFake()
            }
        })

        compiler.hooks.emit.tap(WxMiniProgramOriginalPlugin.PLUGIN_NAME, (compilation) => {
            this.importFilePathCache.forEach((absolutePath) => {
                if (
                    getBelongFileType(absolutePath, this.searchExtInfo.extMap) === FileTypeEnum.JSON
                ) {
                    const assetInfo = getJsonAssetInfo(absolutePath, this.webpackSystemInfo.srcDir)

                    if (assetInfo) {
                        const { keyString, value } = assetInfo
                        compilation.assets[keyString] = value
                    }
                }
            })
        })
    }

    /**
     * app json 文件地址
     */
    private get appJsonFilePath() {
        return Path.resolve(this.webpackSystemInfo.srcDir, 'app.json')
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

    private updateFake() {
        const { importFileAbsoluteSet, importPathSet, notImportedByOtherSet } = getFakeImportInfos(
            this.dependencyMap,
            this.appJsonFilePath
        )

        // 更新 fake 内容
        updateFakeContent(importPathSet)

        // FIXME: 可能由于webpack缓存的原因，当一个文件被引入，然后不引入，再次引入的时候
        // webpack 不会将其重新输出，除非手动保存一次或者修改
        // 故而在此对于新文件重写刷新
        // 此处做法过于丑陋，后续仍需改进，了解其内在原因
        importFileAbsoluteSet.forEach((newImport) => {
            if (!this.importFilePathCache.has(newImport)) {
                refreshAFile(newImport)
            }
        })
        // 更新 导入文件文件绝对路径缓存
        this.importFilePathCache = importFileAbsoluteSet
        // 没有被任何人引用的 key 需要删除
        notImportedByOtherSet.forEach((deleteKey) => this.dependencyMap.delete(deleteKey))
    }

    /**
     * 更新依赖地图
     * @param causeChangeFilesPath 造成印象的文件路径
     */
    private updateDependencyMap(causeChangeFilesPath: Set<string>) {
        const { srcDir } = this.webpackSystemInfo
        const disposedFiles = new Set<string>()
        let needDisposeFileArray = Array.from(causeChangeFilesPath)

        while (needDisposeFileArray.length) {
            const absoluteFilePath = needDisposeFileArray.pop()!
            let additionalDependencies = undefined

            if (absoluteFilePath === this.appJsonFilePath) {
                additionalDependencies = getAppJsonAdditionalDependencies(
                    this.searchExtInfo.extMap,
                    srcDir
                )
            }

            // 文件不存在，则删除其文件依赖信息
            if (!Fs.existsSync(absoluteFilePath)) {
                this.dependencyMap.delete(absoluteFilePath)
                continue
            }

            // 依赖表中存在 并且 不是引起更新的文件
            // 略过依赖更新，因为他的依赖不会更新
            if (
                this.dependencyMap.has(absoluteFilePath) &&
                !causeChangeFilesPath.has(absoluteFilePath)
            ) {
                continue
            }

            // 已处理过的文件不再处理
            if (disposedFiles.has(absoluteFilePath)) {
                continue
            }
            disposedFiles.add(absoluteFilePath)

            // 获取文件依赖信息
            const fileInfo = this.getFileDependency(absoluteFilePath, additionalDependencies)
            // 更新引用信息
            this.dependencyMap.set(absoluteFilePath, fileInfo)

            // 更新待处理列表
            needDisposeFileArray = Array.from(
                new Set([...needDisposeFileArray, ...Array.from(fileInfo.dependencies)])
            )
        }
    }

    /**
     * 获取文件依赖
     * @param fileAbsolutePath 文件绝对路径
     * @param additionalDependencies 额外增添的依赖
     */
    private getFileDependency(
        fileAbsolutePath: string,
        additionalDependencies: Set<string> | undefined
    ) {
        const analyzerMap = {
            [FileTypeEnum.JS]: JavaScriptAnalyzer,
            [FileTypeEnum.JSON]: JsonAnalyzer,
            [FileTypeEnum.WXML]: WxmlAnalyzer,
            [FileTypeEnum.WXSS]: WxssAnalyzer
        }
        // 在这里允许分析的文件一定是已知的，文件类型一定会能正常分析
        const fileType = getBelongFileType(fileAbsolutePath, this.searchExtInfo.extMap)

        return analyzerMap[fileType!](
            fileAbsolutePath,
            this.webpackSystemInfo,
            this.options,
            additionalDependencies
        )
    }
}

/**
 * 相对文件loader生成函数
 * @param srcDir 微信小程序根目录
 */
export const relativeFileLoaderFac = (srcDir: string) => (ext = '[ext]') => {
    return {
        loader: 'file-loader',
        options: {
            useRelativePath: true,
            name: `[path][name].${ext}`,
            context: srcDir
        }
    }
}
