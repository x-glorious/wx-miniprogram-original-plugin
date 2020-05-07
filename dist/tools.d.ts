import { Compiler } from 'webpack';
import { IWebpackSystemInfo } from './index';
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
export declare const setRuntimeChunk: (compiler: Compiler, outputDir: string, pluginDir: string) => void;
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
export declare const getEntry: (outputDir: string, pluginDir: string) => {
    [x: string]: string;
};
/**
 * 创建环境
 * @param pluginDir 插件所在目录
 */
export declare const makeEnvironment: (pluginDir: string) => void;
