"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const tools_1 = require("../tools");
/**
 * 获得前缀所对应的页面或者组件的4文件
 * @param prefixPath page components的文件前缀,绝对路径前缀
 * @param extArray 搜索后缀列表
 */
exports.getPageOrComponentFiles = (prefixPath, extArray) => {
    const filePathArray = [];
    for (const oneFileTypeArray of extArray) {
        for (const ext of oneFileTypeArray) {
            const filePath = `${prefixPath}.${ext}`;
            if (fs_1.default.existsSync(filePath)) {
                filePathArray.push(filePath);
                break;
            }
        }
    }
    // 所属文件类型不全，则报错
    if (filePathArray.length !== extArray.length) {
        throw new Error(`Page or components file structure incomplete`);
    }
    return filePathArray;
};
/**
 * json文件分析器
 * 注意，json文件中有 pages数组 和 usingComponents 对象
 */
const analyzer = (fileAbsolutePath, webpackSystemInfo, options, additionalDependencies) => {
    const dependencies = new Set(additionalDependencies ? additionalDependencies : []);
    const { extArray } = tools_1.getSearchExtInfo(options.additionalWxssSuffixArray);
    const content = fs_1.default.readFileSync(fileAbsolutePath).toString();
    const jsonObj = JSON.parse(content);
    const { pages, usingComponents } = jsonObj;
    const disposePrefixArray = new Set();
    // 获取Pages usingComponents里面对应的路径
    if (pages) {
        pages.forEach((item) => {
            disposePrefixArray.add(item);
        });
    }
    if (usingComponents) {
        for (const keyString in usingComponents) {
            disposePrefixArray.add(usingComponents[keyString]);
        }
    }
    disposePrefixArray.forEach((item) => {
        // 获取前缀的绝对路径
        const prefixAbsolutePath = tools_1.transformRootOrRelativeToRealPath(fileAbsolutePath, item, webpackSystemInfo.srcDir);
        const filePathArray = exports.getPageOrComponentFiles(prefixAbsolutePath, extArray);
        filePathArray.forEach((filePath) => dependencies.add(filePath));
    });
    return {
        absolutePath: fileAbsolutePath,
        dependencies,
        importPath: tools_1.getFakerImportRelativePath(fileAbsolutePath)
    };
};
exports.default = analyzer;
