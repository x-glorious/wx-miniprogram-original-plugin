"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tools_1 = require("../tools");
const index_1 = require("../index");
const getRealFilePathWithExt = (searchExtArray, disposeAbsolutePath) => {
    const nowExt = path_1.default.extname(disposeAbsolutePath);
    let result = '';
    // 已存在后缀，则无需再次处理
    if (nowExt) {
        return disposeAbsolutePath;
    }
    for (const ext of searchExtArray) {
        const filePath = `${disposeAbsolutePath}.${ext}`;
        if (fs_1.default.existsSync(filePath)) {
            result = filePath;
            break;
        }
    }
    if (!result) {
        throw new Error(`File ${disposeAbsolutePath} not exist`);
    }
    return result;
};
/**
 * javascript文件分析器
 */
const analyzer = (fileAbsolutePath, webpackSystemInfo, options, additionalDependencies) => {
    const importRegex = /import\s+[^'"]+\s+from\s+(?:'|")([^\s'"]+?)(?:'|")/g;
    const requireRegex = /require\((?:'|")([^\s'"]+?)(?:'|")/g;
    const starCommentRegex = /\/\*(.|[^.])*?\*\//g;
    const lineCommentRegex = /\/\/.*[^.]/g;
    const { extMap } = tools_1.getSearchExtInfo(options.additionalWxssSuffixArray);
    const dependencies = new Set(additionalDependencies ? additionalDependencies : []);
    const content = fs_1.default.readFileSync(fileAbsolutePath).toString();
    // 去除所有js注释，得到真正的内容
    const realContent = content.replace(starCommentRegex, '').replace(lineCommentRegex, '');
    // 获取 import and require 依赖
    const getImportDel = (searchRegex) => {
        let temp = null;
        while ((temp = (searchRegex.exec(realContent) || [])[1])) {
            const absolutePath = tools_1.transformImportPathToRealPath(temp, webpackSystemInfo.aliasInfos) ||
                tools_1.transformRootOrRelativeToRealPath(fileAbsolutePath, temp, webpackSystemInfo.srcDir);
            dependencies.add(getRealFilePathWithExt(extMap.get(index_1.FileTypeEnum.JS), absolutePath));
        }
    };
    getImportDel(importRegex);
    getImportDel(requireRegex);
    return {
        absolutePath: fileAbsolutePath,
        dependencies,
        importPath: tools_1.getFakerImportRelativePath(fileAbsolutePath, false)
    };
};
exports.default = analyzer;
