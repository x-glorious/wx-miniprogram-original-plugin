"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var settings_1 = __importDefault(require("./settings"));
/**
 * 获取webpack 系统信息
 * @param compiler webpack compiler
 */
exports.getWebpackSystemInfos = function (compiler) {
    var _a = compiler.options, _b = _a.context, context = _b === void 0 ? '' : _b, _c = _a.resolve, _d = (_c === void 0 ? {} : _c).alias, alias = _d === void 0 ? {} : _d;
    var aliasInfos = [];
    if (!context) {
        throw new Error('Webpack context should be set to wxminiProgram root dir');
    }
    for (var keyString in alias) {
        aliasInfos.push({
            symbol: keyString,
            path: alias[keyString]
        });
    }
    return {
        srcDir: context,
        aliasInfos: aliasInfos
    };
};
/**
 * 设置webpack runtime chunk ，将webpack 运行时文件抽离出来
 * @param compiler webpack compiler
 * @param outputDir 输出目录
 * @param pluginDir 插件所在目录（也就是Index.ts所在的目录）
 */
exports.setRuntimeChunk = function (compiler, outputDir, pluginDir) {
    var runtimeRealPath = path_1.default.resolve(pluginDir, settings_1.default.runtimeChunkRelativePath);
    var runtimeRelativePath = path_1.default.relative(outputDir, runtimeRealPath);
    compiler.options.optimization.runtimeChunk = {
        name: runtimeRelativePath
    };
};
/**
 * 获取webpack 输出
 * @param outputDir 输出目录
 */
exports.getOutput = function (outputDir) {
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
exports.getEntry = function (outputDir, pluginDir) {
    var _a;
    var fakerRealPath = path_1.default.resolve(pluginDir, settings_1.default.fakerImporterRelativePath);
    var fakerRelativePath = path_1.default.relative(outputDir, fakerRealPath);
    return _a = {},
        _a[fakerRelativePath] = fakerRealPath,
        _a;
};
/**
 * 创建环境
 * @param pluginDir 插件所在目录
 */
exports.makeEnvironment = function (pluginDir) {
    var cacheRelativeDir = settings_1.default.cacheRelativeDir, fakerImporterRelativePath = settings_1.default.fakerImporterRelativePath;
    var cacheRealPath = path_1.default.resolve(pluginDir, cacheRelativeDir);
    var fakerImporterRealPath = path_1.default.resolve(pluginDir, fakerImporterRelativePath);
    // 确保 缓存目录存在
    if (!fs_1.default.existsSync(cacheRealPath)) {
        fs_1.default.mkdirSync(cacheRealPath);
    }
    // 确保 faker importer 存在
    fs_1.default.writeFileSync(fakerImporterRealPath, '', {
        flag: 'w'
    });
};
