import { Compiler } from 'webpack';
import { IAliasInfo, IWebpackSystemInfo, FileTypeEnum, ExtMap, IExtInfo, IFileInfo } from './index';
/**
 * 获取webpack 系统信息
 * @param compiler webpack compiler
 */
export declare const getWebpackSystemInfos: (compiler: Compiler) => IWebpackSystemInfo;
/**
 * 设置webpack runtime chunk ，将webpack 运行时文件抽离出来
 * @param compiler webpack compiler
 * @param outputDir 输出目录
 * @param pluginDir 插件所在目录（也就是Index.ts所在的目录）
 */
export declare const setRuntimeChunk: (compiler: Compiler, outputDir: string) => void;
/**
 * 获取webpack 输出
 * @param outputDir 输出目录
 */
export declare const getOutput: (outputDir: string) => {
    filename: string;
    path: string;
};
/**
 * 获取webpack entry
 * @param outputDir 输出目录
 * @param pluginDir 插件所在目录
 */
export declare const getEntry: (outputDir: string) => {
    [x: string]: string;
};
/**
 * 创建环境
 * @param pluginDir 插件所在目录
 */
export declare const makeEnvironment: () => void;
/**
 * 将导入的路径信息转换成真实路径
 * ps: 会做别名处理（为了支持别名绝对路径）
 * @param importFilePath 导入文件路径
 * @param aliasInfos 别名信息
 */
export declare const transformImportPathToRealPath: (importFilePath: string, aliasInfos: IAliasInfo[]) => string | undefined;
/**
 * 获取faker导入所需要的相对路径
 * @param fileAbsolutePath 文件绝对路径
 * @param preserveExt 是否保留后缀，默认保留
 */
export declare const getFakerImportRelativePath: (fileAbsolutePath: string, preserveExt?: boolean) => string;
/**
 * 转换Import根路径或者相对路径到绝对路径
 * @param fileAbsolutePath 文件绝对路径
 * @param importPath import的路径（根路径或者相对路径）
 * @param srcDir 微信小程序根目录
 */
export declare const transformRootOrRelativeToRealPath: (fileAbsolutePath: string, importPath: string, srcDir: string) => string;
/**
 * 获取搜索后缀地图
 * @param additionalWxssSuffixArray 额外的wxss文件后缀
 */
export declare const getSearchExtInfo: (additionalWxssSuffixArray: string[]) => IExtInfo;
/**
 * 获取所属文件类型
 * @param absoluteFilePath 文件绝对路径
 * @param expMap 文件后缀地图
 * @returns undefined 代表文件类型不在已知列表
 */
export declare const getBelongFileType: (absoluteFilePath: string, extMap: ExtMap) => FileTypeEnum | undefined;
/**
 * 获得app json文件的额外依赖
 * @param extMap 搜索后缀地图
 * @param srcDir src dir
 */
export declare const getAppJsonAdditionalDependencies: (extMap: ExtMap, srcDir: string) => Set<string>;
/**
 * 刷新一个文件
 * @param fileAbsolutePath 文件绝对路径
 */
export declare const refreshAFile: (fileAbsolutePath: string) => void;
/**
 * 获取 fake import 所需的信息
 * @param dependencyMap 依赖地图，里面所有 key 对应的文件都需要存在
 * @param appJsonFilePath app json文件地址
 */
export declare const getFakeImportInfos: (dependencyMap: Map<string, IFileInfo>, appJsonFilePath: string) => {
    importPathSet: Set<string>;
    importFileAbsoluteSet: Set<string>;
    notImportedByOtherSet: Set<string>;
};
/**
 * 更新 fake content
 * @param importPathSet import path set (require 里面需要用到的)
 */
export declare const updateFakeContent: (importPathSet: Set<string>) => void;
/**
 * 获取 json 文件在 asset 里面的信息
 * @param fileAbsolutePath json绝对路径
 * @param srcDir 根目录
 */
export declare const getJsonAssetInfo: (fileAbsolutePath: string, srcDir: string) => {
    keyString: string;
    value: {
        source: () => string;
        size: () => number;
    };
} | undefined;
