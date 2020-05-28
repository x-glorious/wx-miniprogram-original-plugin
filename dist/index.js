"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tools_1 = require("./tools");
const javascript_1 = __importDefault(require("./analyzer/javascript"));
const json_1 = __importDefault(require("./analyzer/json"));
const wxml_1 = __importDefault(require("./analyzer/wxml"));
const wxss_1 = __importDefault(require("./analyzer/wxss"));
const settings_1 = __importDefault(require("./settings"));
var FileTypeEnum;
(function (FileTypeEnum) {
    FileTypeEnum[FileTypeEnum["JS"] = 0] = "JS";
    FileTypeEnum[FileTypeEnum["WXSS"] = 1] = "WXSS";
    FileTypeEnum[FileTypeEnum["WXML"] = 2] = "WXML";
    FileTypeEnum[FileTypeEnum["JSON"] = 3] = "JSON";
})(FileTypeEnum = exports.FileTypeEnum || (exports.FileTypeEnum = {}));
class WxMiniProgramOriginalPlugin {
    constructor(options) {
        /**
         * 从 webpack 中所获取的信息
         */
        this.webpackSystemInfo = { srcDir: '', aliasInfos: [] };
        /**
         * 导入文件路径缓存，存留所有fake import的的绝对路径
         */
        this.importFilePathCache = new Set();
        const { additionalWxssSuffixArray = [], outputDir } = options;
        if (!outputDir) {
            throw new Error('options outputDir not set');
        }
        this.options = {
            additionalWxssSuffixArray,
            outputDir
        };
        this.dependencyMap = new Map();
        // 缓存搜索后缀地图信息
        this.searchExtInfo = tools_1.getSearchExtInfo(additionalWxssSuffixArray);
        // 准备环境
        tools_1.makeEnvironment();
    }
    apply(compiler) {
        const { fakerImporterPath } = settings_1.default;
        // 获取webpack 系统信息
        this.webpackSystemInfo = tools_1.getWebpackSystemInfos(compiler);
        // 设置runtime chunk
        tools_1.setRuntimeChunk(compiler, this.options.outputDir);
        // 更新依赖表
        this.updateDependencyMap(new Set([this.appJsonFilePath]));
        // 更新 fake 文件
        this.updateFake();
        compiler.hooks.watchRun.tap(WxMiniProgramOriginalPlugin.PLUGIN_NAME, (newCompiler, e) => {
            const modifyFiles = newCompiler.watchFileSystem.watcher.mtimes;
            const changedFileSet = new Set();
            for (const filePath in modifyFiles) {
                if (fs_1.default.existsSync(filePath) && filePath !== fakerImporterPath) {
                    changedFileSet.add(filePath);
                }
            }
            if (changedFileSet.size) {
                // 更新依赖表
                this.updateDependencyMap(changedFileSet);
                // 更新 fake 文件
                this.updateFake();
            }
        });
        compiler.hooks.emit.tap(WxMiniProgramOriginalPlugin.PLUGIN_NAME, (compilation) => {
            this.importFilePathCache.forEach((absolutePath) => {
                if (tools_1.getBelongFileType(absolutePath, this.searchExtInfo.extMap) === FileTypeEnum.JSON) {
                    const assetInfo = tools_1.getJsonAssetInfo(absolutePath, this.webpackSystemInfo.srcDir);
                    if (assetInfo) {
                        const { keyString, value } = assetInfo;
                        compilation.assets[keyString] = value;
                    }
                }
            });
        });
    }
    /**
     * app json 文件地址
     */
    get appJsonFilePath() {
        return path_1.default.resolve(this.webpackSystemInfo.srcDir, 'app.json');
    }
    /**
     * 获取webpack所需的入口
     */
    getEntry() {
        return tools_1.getEntry(this.options.outputDir);
    }
    /**
     * 获取webpack所需的output信息
     */
    getOutput() {
        return tools_1.getOutput(this.options.outputDir);
    }
    updateFake() {
        const { importFileAbsoluteSet, importPathSet, notImportedByOtherSet } = tools_1.getFakeImportInfos(this.dependencyMap, this.appJsonFilePath);
        // 更新 fake 内容
        tools_1.updateFakeContent(importPathSet);
        // FIXME: 可能由于webpack缓存的原因，当一个文件被引入，然后不引入，再次引入的时候
        // webpack 不会将其重新输出，除非手动保存一次或者修改
        // 故而在此对于新文件重写刷新
        // 此处做法过于丑陋，后续仍需改进，了解其内在原因
        importFileAbsoluteSet.forEach((newImport) => {
            if (!this.importFilePathCache.has(newImport)) {
                tools_1.refreshAFile(newImport);
            }
        });
        // 更新 导入文件文件绝对路径缓存
        this.importFilePathCache = importFileAbsoluteSet;
        // 没有被任何人引用的 key 需要删除
        notImportedByOtherSet.forEach((deleteKey) => this.dependencyMap.delete(deleteKey));
    }
    /**
     * 更新依赖地图
     * @param causeChangeFilesPath 造成印象的文件路径
     */
    updateDependencyMap(causeChangeFilesPath) {
        const { srcDir } = this.webpackSystemInfo;
        const disposedFiles = new Set();
        let needDisposeFileArray = Array.from(causeChangeFilesPath);
        while (needDisposeFileArray.length) {
            const absoluteFilePath = needDisposeFileArray.pop();
            let additionalDependencies = undefined;
            if (absoluteFilePath === this.appJsonFilePath) {
                additionalDependencies = tools_1.getAppJsonAdditionalDependencies(this.searchExtInfo.extMap, srcDir);
            }
            // 文件不存在，则删除其文件依赖信息
            if (!fs_1.default.existsSync(absoluteFilePath)) {
                this.dependencyMap.delete(absoluteFilePath);
                continue;
            }
            // 依赖表中存在 并且 不是引起更新的文件
            // 略过依赖更新，因为他的依赖不会更新
            if (this.dependencyMap.has(absoluteFilePath) &&
                !causeChangeFilesPath.has(absoluteFilePath)) {
                continue;
            }
            // 已处理过的文件不再处理
            if (disposedFiles.has(absoluteFilePath)) {
                continue;
            }
            disposedFiles.add(absoluteFilePath);
            // 获取文件依赖信息
            const fileInfo = this.getFileDependency(absoluteFilePath, additionalDependencies);
            // 更新引用信息
            this.dependencyMap.set(absoluteFilePath, fileInfo);
            // 更新待处理列表
            needDisposeFileArray = Array.from(new Set([...needDisposeFileArray, ...Array.from(fileInfo.dependencies)]));
        }
    }
    /**
     * 获取文件依赖
     * @param fileAbsolutePath 文件绝对路径
     * @param additionalDependencies 额外增添的依赖
     */
    getFileDependency(fileAbsolutePath, additionalDependencies) {
        const analyzerMap = {
            [FileTypeEnum.JS]: javascript_1.default,
            [FileTypeEnum.JSON]: json_1.default,
            [FileTypeEnum.WXML]: wxml_1.default,
            [FileTypeEnum.WXSS]: wxss_1.default
        };
        // 在这里允许分析的文件一定是已知的，文件类型一定会能正常分析
        const fileType = tools_1.getBelongFileType(fileAbsolutePath, this.searchExtInfo.extMap);
        return analyzerMap[fileType](fileAbsolutePath, this.webpackSystemInfo, this.options, additionalDependencies);
    }
}
exports.WxMiniProgramOriginalPlugin = WxMiniProgramOriginalPlugin;
WxMiniProgramOriginalPlugin.PLUGIN_NAME = 'WxMiniProgramOriginalPlugin';
/**
 * 相对文件loader生成函数
 * @param srcDir 微信小程序根目录
 */
exports.relativeFileLoaderFac = (srcDir) => (ext = '[ext]') => {
    return {
        loader: 'file-loader',
        options: {
            useRelativePath: true,
            name: `[path][name].${ext}`,
            context: srcDir
        }
    };
};
