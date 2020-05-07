"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tools_1 = require("./tools");
var WxMiniProgramOriginalPlugin = /** @class */ (function () {
    function WxMiniProgramOriginalPlugin(options) {
        /**
         * 从 webpack 中所获取的信息
         */
        this.webpackSystemInfo = { srcDir: '', aliasInfos: [] };
        this.pluginDir = __dirname;
        var _a = options.wxssSrcSuffix, wxssSrcSuffix = _a === void 0 ? 'wxss' : _a, _b = options.isUseTs, isUseTs = _b === void 0 ? false : _b, outputDir = options.outputDir;
        if (!outputDir) {
            throw new Error('options outputDir not set');
        }
        this.options = {
            wxssSrcSuffix: wxssSrcSuffix,
            isUseTs: isUseTs,
            outputDir: outputDir
        };
        // 准备环境
        tools_1.makeEnvironment(this.pluginDir);
    }
    WxMiniProgramOriginalPlugin.prototype.apply = function (compiler) {
        // 获取webpack 系统信息
        this.webpackSystemInfo = tools_1.getWebpackSystemInfos(compiler);
        // 设置runtime chunk
        tools_1.setRuntimeChunk(compiler, this.options.outputDir, this.pluginDir);
        compiler.hooks.emit.tap(WxMiniProgramOriginalPlugin.PLUGIN_NAME, function () {
            console.log('enter');
        });
    };
    /**
     * 获取webpack所需的入口
     */
    WxMiniProgramOriginalPlugin.prototype.getEntry = function () {
        return tools_1.getEntry(this.options.outputDir, this.pluginDir);
    };
    /**
     * 获取webpack所需的output信息
     */
    WxMiniProgramOriginalPlugin.prototype.getOutput = function () {
        return tools_1.getOutput(this.options.outputDir);
    };
    WxMiniProgramOriginalPlugin.PLUGIN_NAME = 'WxMiniProgramOriginalPlugin';
    return WxMiniProgramOriginalPlugin;
}());
exports.WxMiniProgramOriginalPlugin = WxMiniProgramOriginalPlugin;
