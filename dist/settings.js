"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const CACHE_DIR = '.cache';
const PLUGIN_DIR = __dirname;
exports.default = {
    /**
     * webpack 运行时路径
     */
    runtimeChunkPath: path_1.default.resolve(PLUGIN_DIR, `${CACHE_DIR}/webpackRuntime`),
    /**
     * 虚假导入文件路径
     */
    fakerImporterPath: path_1.default.resolve(PLUGIN_DIR, `${CACHE_DIR}/fakerImporter.js`),
    /**
     * 缓存目录相对地址
     */
    cacheRelativeDir: CACHE_DIR,
    /**
     * 缓存目录
     */
    cacheDir: path_1.default.resolve(PLUGIN_DIR, CACHE_DIR),
    /**
     * 插件文件所在目录
     */
    pluginDir: PLUGIN_DIR,
    appLevelAdditionJsonFiles: ['project.config.json', 'sitemap.json']
};
