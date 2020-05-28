"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const settings_1 = __importDefault(require("./settings"));
const index_1 = require("./index");
const json_1 = require("./analyzer/json");
/**
 * 获取webpack 系统信息
 * @param compiler webpack compiler
 */
exports.getWebpackSystemInfos = (compiler) => {
    const { context = '', resolve: { alias = {} } = {} } = compiler.options;
    const aliasInfos = [];
    if (!context) {
        throw new Error('Webpack context should be set to wxminiProgram root dir');
    }
    for (const keyString in alias) {
        aliasInfos.push({
            symbolString: keyString,
            path: alias[keyString]
        });
    }
    return {
        srcDir: context,
        aliasInfos
    };
};
/**
 * 设置webpack runtime chunk ，将webpack 运行时文件抽离出来
 * @param compiler webpack compiler
 * @param outputDir 输出目录
 * @param pluginDir 插件所在目录（也就是Index.ts所在的目录）
 */
exports.setRuntimeChunk = (compiler, outputDir) => {
    const { runtimeChunkPath } = settings_1.default;
    const runtimeRelativePath = path_1.default.relative(outputDir, runtimeChunkPath);
    compiler.options.optimization.runtimeChunk = {
        name: runtimeRelativePath
    };
};
/**
 * 获取webpack 输出
 * @param outputDir 输出目录
 */
exports.getOutput = (outputDir) => {
    return {
        filename: '[name].js',
        path: outputDir
    };
};
/**
 * 获取webpack entry
 * @param outputDir 输出目录
 * @param pluginDir 插件所在目录
 */
exports.getEntry = (outputDir) => {
    const { fakerImporterPath } = settings_1.default;
    const fakerRelativePath = path_1.default.relative(outputDir, fakerImporterPath);
    return {
        [fakerRelativePath]: fakerImporterPath
    };
};
/**
 * 创建环境
 * @param pluginDir 插件所在目录
 */
exports.makeEnvironment = () => {
    const { cacheDir, fakerImporterPath } = settings_1.default;
    // 确保 缓存目录存在
    if (!fs_1.default.existsSync(cacheDir)) {
        fs_1.default.mkdirSync(cacheDir);
    }
    // 确保 faker importer 存在
    fs_1.default.writeFileSync(fakerImporterPath, '', {
        flag: 'w'
    });
};
/**
 * 将导入的路径信息转换成真实路径
 * ps: 会做别名处理（为了支持别名绝对路径）
 * @param importFilePath 导入文件路径
 * @param aliasInfos 别名信息
 */
exports.transformImportPathToRealPath = (importFilePath, aliasInfos) => {
    let result = undefined;
    for (const { symbolString, path } of aliasInfos) {
        if (importFilePath.includes(symbolString)) {
            result = path_1.default.resolve(path, importFilePath.replace(symbolString, '.'));
            break;
        }
    }
    return result;
};
/**
 * 获取faker导入所需要的相对路径
 * @param fileAbsolutePath 文件绝对路径
 * @param preserveExt 是否保留后缀，默认保留
 */
exports.getFakerImportRelativePath = (fileAbsolutePath, preserveExt = true) => {
    const { cacheDir } = settings_1.default;
    const result = path_1.default.relative(cacheDir, fileAbsolutePath);
    if (preserveExt) {
        return result;
    }
    // 不保留文件后缀
    const dotIndex = result.lastIndexOf('.');
    return result.slice(0, dotIndex);
};
/**
 * 转换Import根路径或者相对路径到绝对路径
 * @param fileAbsolutePath 文件绝对路径
 * @param importPath import的路径（根路径或者相对路径）
 * @param srcDir 微信小程序根目录
 */
exports.transformRootOrRelativeToRealPath = (fileAbsolutePath, importPath, srcDir) => {
    // 根目录
    if (importPath.startsWith('/')) {
        return path_1.default.resolve(srcDir, importPath.slice(1));
    }
    // 相对路径
    else {
        const fileDir = path_1.default.dirname(fileAbsolutePath);
        return path_1.default.resolve(fileDir, importPath);
    }
};
/**
 * 获取搜索后缀地图
 * @param additionalWxssSuffixArray 额外的wxss文件后缀
 */
exports.getSearchExtInfo = (additionalWxssSuffixArray) => {
    const jsArray = ['js', 'ts'];
    const jsonArray = ['json'];
    const wxmlArray = ['wxml'];
    const wxssArray = ['wxss', ...additionalWxssSuffixArray];
    const extMap = new Map([
        [index_1.FileTypeEnum.JS, jsArray],
        [index_1.FileTypeEnum.JSON, jsonArray],
        [index_1.FileTypeEnum.WXML, wxmlArray],
        [index_1.FileTypeEnum.WXSS, wxssArray]
    ]);
    return {
        extMap,
        extArray: [jsonArray, jsArray, wxssArray, wxmlArray]
    };
};
/**
 * 获取所属文件类型
 * @param absoluteFilePath 文件绝对路径
 * @param expMap 文件后缀地图
 * @returns undefined 代表文件类型不在已知列表
 */
exports.getBelongFileType = (absoluteFilePath, extMap) => {
    const extName = path_1.default.extname(absoluteFilePath).replace('.', '');
    for (const [fileType, extArray] of Array.from(extMap.entries())) {
        if (extArray.includes(extName)) {
            return fileType;
        }
    }
    return undefined;
};
/**
 * 获得app json文件的额外依赖
 * @param extMap 搜索后缀地图
 * @param srcDir src dir
 */
exports.getAppJsonAdditionalDependencies = (extMap, srcDir) => {
    const { appLevelAdditionJsonFiles } = settings_1.default;
    // APP 级别页面文件不存在 wxml
    const appPageFileTypes = [index_1.FileTypeEnum.WXSS, index_1.FileTypeEnum.JSON, index_1.FileTypeEnum.JS];
    const appPageFiles = json_1.getPageOrComponentFiles(path_1.default.resolve(srcDir, 'app'), appPageFileTypes.map((filetype) => extMap.get(filetype)));
    const appLevelJsonFiles = appLevelAdditionJsonFiles.map((jsonFile) => path_1.default.resolve(srcDir, jsonFile));
    return new Set([...appPageFiles, ...appLevelJsonFiles]);
};
/**
 * 刷新一个文件
 * @param fileAbsolutePath 文件绝对路径
 */
exports.refreshAFile = (fileAbsolutePath) => {
    const content = fs_1.default.readFileSync(fileAbsolutePath);
    // 重写
    fs_1.default.writeFileSync(fileAbsolutePath, content, {
        flag: 'w'
    });
};
/**
 * 获取 fake import 所需的信息
 * @param dependencyMap 依赖地图，里面所有 key 对应的文件都需要存在
 * @param appJsonFilePath app json文件地址
 */
exports.getFakeImportInfos = (dependencyMap, appJsonFilePath) => {
    const dependedByCounterMap = new Map();
    const importPathSet = new Set();
    const importFileAbsoluteSet = new Set();
    const notImportedByOtherSet = new Set();
    const sureExistInCounterMap = (filePath) => {
        // app.json 没有人引用他，但是我们需要它，故而默认为1
        const defaultValue = filePath === appJsonFilePath ? 1 : 0;
        if (!dependedByCounterMap.has(filePath)) {
            dependedByCounterMap.set(filePath, defaultValue);
        }
    };
    for (const [keyString, fileInfo] of Array.from(dependencyMap.entries())) {
        const { dependencies } = fileInfo;
        // 确保在被引用计数器地图中存在
        sureExistInCounterMap(keyString);
        if (dependencies) {
            dependencies.forEach((item) => {
                sureExistInCounterMap(item);
                const nowCounter = dependedByCounterMap.get(item);
                dependedByCounterMap.set(item, nowCounter + 1);
            });
        }
    }
    for (const [absolutePath, counter] of Array.from(dependedByCounterMap.entries())) {
        const { importPath } = dependencyMap.get(absolutePath);
        // 有引用的文件则 fake import
        if (counter > 0) {
            importPathSet.add(importPath);
            importFileAbsoluteSet.add(absolutePath);
        }
        // 如果没有引用
        else {
            notImportedByOtherSet.add(absolutePath);
        }
    }
    return {
        importPathSet,
        importFileAbsoluteSet,
        notImportedByOtherSet
    };
};
/**
 * 更新 fake content
 * @param importPathSet import path set (require 里面需要用到的)
 */
exports.updateFakeContent = (importPathSet) => {
    const { fakerImporterPath } = settings_1.default;
    const fileContent = Array.from(importPathSet)
        .map((item, index) => {
        // 对 win 的路径做一个兼容
        const forWinCompatibility = item.replace(/\\/g, '/');
        const requireString = `const file_${index} = require('${forWinCompatibility}');`;
        const somethingForCheck = `let fake_${index} = file_${index};fake_${index}=()=>{};fake_${index}();`;
        return requireString + '\n' + somethingForCheck + '\n';
    })
        .join('');
    fs_1.default.writeFileSync(fakerImporterPath, fileContent, {
        flag: 'w'
    });
};
/**
 * 获取 json 文件在 asset 里面的信息
 * @param fileAbsolutePath json绝对路径
 * @param srcDir 根目录
 */
exports.getJsonAssetInfo = (fileAbsolutePath, srcDir) => {
    if (fs_1.default.existsSync(fileAbsolutePath)) {
        const content = fs_1.default.readFileSync(fileAbsolutePath).toString();
        const keyString = path_1.default.relative(srcDir, fileAbsolutePath);
        return {
            keyString,
            value: {
                source: () => {
                    return content;
                },
                size: () => {
                    return content.length;
                }
            }
        };
    }
    return undefined;
};
