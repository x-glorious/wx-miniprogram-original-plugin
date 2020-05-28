"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const tools_1 = require("../tools");
/**
 * wxml文件分析器
 * 注意，wxml中可以使用根路径，故而，我们不支持别名
 */
const analyzer = (fileAbsolutePath, webpackSystemInfo, options, additionalDependencies) => {
    const importRegex = /<import\s+src="([^\s"]+?)"\s*\/>/g;
    const includeRegex = /<include\s+src="([^\s"]+?)"\s*\/>/g;
    const commentRegex = /<!--.*?-->/g;
    const dependencies = new Set(additionalDependencies ? additionalDependencies : []);
    const content = fs_1.default.readFileSync(fileAbsolutePath).toString();
    // 去除所有js注释，得到真正的内容
    const realContent = content.replace(commentRegex, '');
    // 获取 import and require 依赖
    const getImportDel = (searchRegex) => {
        let temp = null;
        while ((temp = (searchRegex.exec(realContent) || [])[1])) {
            dependencies.add(tools_1.transformRootOrRelativeToRealPath(fileAbsolutePath, temp, webpackSystemInfo.srcDir));
        }
    };
    getImportDel(importRegex);
    getImportDel(includeRegex);
    return {
        absolutePath: fileAbsolutePath,
        dependencies,
        importPath: tools_1.getFakerImportRelativePath(fileAbsolutePath)
    };
};
exports.default = analyzer;
