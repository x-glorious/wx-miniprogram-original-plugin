import { Compiler } from 'webpack';
export interface IFileInfo {
    /**
     * 文件绝对路径
     */
    absolutePath: string;
    /**
     * 文件依赖
     */
    dependencies: string[];
    /**
     * import时的相对路径
     */
    importPath: string;
}
/**
 * 文件分析器类型
 */
export declare type FileAnalyzer = (fileAbsolutePath: string, aliasInfos: IAliasInfo[]) => IFileInfo;
export interface IOptions {
    /**
     * wxss 文件在src源代码中所对应的后缀
     * default wxss
     */
    wxssSrcSuffix: string;
    /**
     * 是否使用了 ts
     * default false
     */
    isUseTs: boolean;
    /**
     * 输出目录
     */
    outputDir: string;
}
export interface IAliasInfo {
    /**
     * 符号
     */
    symbol: string;
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
     * 插件所在目录（也就是Index.ts文件所在目录）
     */
    private pluginDir;
    /**
     * 插件设置信息
     */
    private options;
    constructor(options: Partial<IOptions>);
    apply(compiler: Compiler): void;
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
}
