/**
 * 为何！assest中有了，为什么不输出到目录下面
 */
import { Compiler } from 'webpack';
export declare enum FileTypeEnum {
    JS = 0,
    WXSS = 1,
    WXML = 2,
    JSON = 3
}
export declare type ExtMap = Map<FileTypeEnum, string[]>;
export interface IExtInfo {
    /**
     * 后缀地图
     */
    extMap: ExtMap;
    /**
     * 展开的搜索后缀列表，和文件类型解耦
     */
    extArray: Array<Array<string>>;
}
export interface IFileInfo {
    /**
     * 文件绝对路径
     */
    absolutePath: string;
    /**
     * 文件依赖
     */
    dependencies: Set<string>;
    /**
     * import时的相对路径
     */
    importPath: string;
}
/**
 * 文件分析器类型
 * @param fileAbsolutePath 文件绝对路径
 * @param webpackSystemInfo 从webpack中获取的信息
 * @param options 用户设定的信息
 * @param additionalDependencies 额外的依赖
 * @returns 文件依赖信息接口
 */
export declare type FileAnalyzer = (fileAbsolutePath: string, webpackSystemInfo: IWebpackSystemInfo, options: IOptions, additionalDependencies?: Set<string>) => IFileInfo;
export interface IOptions {
    /**
     * wxss 文件在src源代码中所对应的额外的后缀
     */
    additionalWxssSuffixArray: string[];
    /**
     * 输出目录
     */
    outputDir: string;
}
export interface IAliasInfo {
    /**
     * 符号
     */
    symbolString: string;
    /**
     * 路径
     */
    path: string;
}
export interface IWebpackSystemInfo {
    srcDir: string;
    aliasInfos: IAliasInfo[];
}
export declare class WxMiniProgramOriginalPlugin {
    private static readonly PLUGIN_NAME;
    /**
     * 从 webpack 中所获取的信息
     */
    private webpackSystemInfo;
    /**
     * 插件设置信息
     */
    private options;
    /**
     * 搜索文件后缀信息
     */
    private searchExtInfo;
    /**
     * 依赖信息表
     */
    private dependencyMap;
    /**
     * 导入文件路径缓存，存留所有fake import的的绝对路径
     */
    private importFilePathCache;
    constructor(options: Partial<IOptions>);
    apply(compiler: Compiler): void;
    /**
     * app json 文件地址
     */
    private get appJsonFilePath();
    /**
     * 获取webpack所需的入口
     */
    getEntry(): {
        [x: string]: string;
    };
    /**
     * 获取webpack所需的output信息
     */
    getOutput(): {
        filename: string;
        path: string;
    };
    private updateFake;
    /**
     * 更新依赖地图
     * @param causeChangeFilesPath 造成印象的文件路径
     */
    private updateDependencyMap;
    /**
     * 获取文件依赖
     * @param fileAbsolutePath 文件绝对路径
     * @param additionalDependencies 额外增添的依赖
     */
    private getFileDependency;
}
/**
 * 相对文件loader生成函数
 * @param srcDir 微信小程序根目录
 */
export declare const relativeFileLoaderFac: (srcDir: string) => (ext?: string) => {
    loader: string;
    options: {
        useRelativePath: boolean;
        name: string;
        context: string;
    };
};
