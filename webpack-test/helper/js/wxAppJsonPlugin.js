"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var WxAppJsonPlugin = (function () {
    function WxAppJsonPlugin(options) {
        this.fileDependencyMap = new Map();
        this.notNeedDependedByFiles = new Set();
        this.options = __assign({}, options);
        var tempDir = options.tempDir;
        this.fakePageFilePath = path_1.default.resolve(tempDir, WxAppJsonPlugin.appPagesFakeImportFileName);
        this.fConsole = new FormatConsole();
    }
    WxAppJsonPlugin.prototype.getEntry = function () {
        var _a;
        var srcDir = this.options.srcDir;
        this.updateFakeImport();
        var entryKey = path_1.default.relative(srcDir, this.fakePageFilePath);
        this.initFileDependency();
        this.updateFakeImport();
        this.fConsole.info('Init file dependency finished');
        return _a = {},
            _a[entryKey] = this.fakePageFilePath,
            _a;
    };
    WxAppJsonPlugin.prototype.apply = function (compiler) {
        var _this = this;
        var appJsonPath = this.options.appJsonPath;
        compiler.hooks.watchRun.tap(WxAppJsonPlugin.NAME, function (newCompiler, e) {
            var modifyFiles = newCompiler.watchFileSystem.watcher.mtimes;
            var needUpdate = false;
            for (var filePath in modifyFiles) {
                if (filePath === appJsonPath) {
                    _this.fConsole.info('App(.json?) modified');
                    _this.initFileDependency();
                    needUpdate = true;
                }
                else {
                    if (fs_1.default.existsSync(filePath) && filePath !== _this.fakePageFilePath) {
                        _this.oneFileModified(filePath);
                        needUpdate = true;
                    }
                }
            }
            if (needUpdate) {
                _this.updateFakeImport();
                _this.fConsole.info('Update fake importer');
            }
        });
    };
    WxAppJsonPlugin.prototype.oneFileModified = function (absolutePath) {
        this.disposeAnalysisFiles([absolutePath], false);
    };
    WxAppJsonPlugin.prototype.updateFakeImport = function () {
        var _this = this;
        var tempDir = this.options.tempDir;
        var allFileAbsolutePathSet = new Set();
        var dependedByCounterMap = new Map();
        var notExistFiles = new Set();
        var sureExistInCounterMap = function (filePath, defaultValue) {
            if (!dependedByCounterMap.has(filePath)) {
                dependedByCounterMap.set(filePath, defaultValue);
            }
        };
        for (var _i = 0, _a = Array.from(this.fileDependencyMap.entries()); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (!fs_1.default.existsSync(key)) {
                notExistFiles.add(key);
                continue;
            }
            sureExistInCounterMap(key, value.isInDependent ? 1 : 0);
            if (value.dependency) {
                value.dependency.forEach(function (item) {
                    sureExistInCounterMap(item, 0);
                    var nowCounter = dependedByCounterMap.get(item);
                    dependedByCounterMap.set(item, nowCounter + 1);
                });
            }
        }
        notExistFiles.forEach(function (item) { return _this.fileDependencyMap.delete(item); });
        for (var _c = 0, _d = Array.from(dependedByCounterMap.entries()); _c < _d.length; _c++) {
            var _e = _d[_c], absolutePath = _e[0], counter = _e[1];
            if (counter > 0) {
                allFileAbsolutePathSet.add(absolutePath);
            }
            else {
                if (this.notNeedDependedByFiles.has(absolutePath)) {
                    allFileAbsolutePathSet.add(absolutePath);
                }
                else {
                    this.fileDependencyMap.delete(absolutePath);
                }
            }
        }
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir);
        }
        var fileContent = Array.from(allFileAbsolutePathSet)
            .map(function (absolutePath) { return path_1.default.relative(tempDir, absolutePath); })
            .map(function (item, index) {
            var forWinCompatibility = item.replace(/\\/g, '/');
            var requireString = "const file_" + index + " = require('" + forWinCompatibility + "');";
            var somethingForCheck = "let fake_" + index + " = file_" + index + ";fake_" + index + "=()=>{};fake_" + index + "();";
            return requireString + '\n' + somethingForCheck + '\n';
        })
            .join('');
        fs_1.default.writeFileSync(this.fakePageFilePath, fileContent, {
            flag: 'w'
        });
    };
    WxAppJsonPlugin.prototype.initFileDependency = function () {
        var _a = this.options, srcDir = _a.srcDir, pageFileSuffixArray = _a.pageFileSuffixArray, appLevelFiles = _a.appLevelFiles;
        var appJsonString = fs_1.default.readFileSync(path_1.default.resolve(srcDir, 'app.map')).toString();
        var appObj = JSON.parse(appJsonString);
        var allPagesPair = appObj.pages.map(function (item) { return path_1.default.resolve(srcDir, item); });
        var allPageFilesPath = [];
        allPagesPair.forEach(function (item) {
            allPageFilesPath = __spreadArrays(allPageFilesPath, pageFileSuffixArray.map(function (suffix) { return item + "." + suffix; }));
        });
        allPageFilesPath = __spreadArrays(allPageFilesPath, appLevelFiles);
        this.notNeedDependedByFiles = new Set(__spreadArrays(allPageFilesPath));
        this.fileDependencyMap = new Map();
        this.disposeAnalysisFiles(allPageFilesPath, true);
    };
    WxAppJsonPlugin.prototype.disposeAnalysisFiles = function (analysisArray, init) {
        var allFilesAbsolutePath = Array.from(new Set(__spreadArrays(analysisArray)));
        while (allFilesAbsolutePath.length) {
            var absolutePath = allFilesAbsolutePath.pop();
            var dataExist = this.fileDependencyMap.has(absolutePath);
            if (!dataExist) {
                var dependencyInfo = this.getDependency(absolutePath);
                var isInDependent = dependencyInfo.isInDependent, dependency = dependencyInfo.dependency;
                this.fileDependencyMap.set(absolutePath, {
                    isInDependent: isInDependent,
                    dependency: dependency
                });
                allFilesAbsolutePath = Array.from(new Set(__spreadArrays(allFilesAbsolutePath, Array.from(dependency))));
            }
            if (dataExist && !init) {
                var dependencyInfo = this.getDependency(absolutePath);
                var dependency = dependencyInfo.dependency;
                this.fileDependencyMap.get(absolutePath).dependency = dependency;
                allFilesAbsolutePath = Array.from(new Set(__spreadArrays(allFilesAbsolutePath, Array.from(dependency))));
            }
        }
    };
    WxAppJsonPlugin.prototype.disposeFileNameAlias = function (filePath) {
        var _a = this.options, dependencyPairs = _a.dependencyPairs, defaultExt = _a.defaultExt;
        var ext = path_1.default.extname(filePath);
        var withDefaultExt = ext ? filePath : filePath + ("." + defaultExt);
        var result = withDefaultExt;
        dependencyPairs.forEach(function (_a) {
            var suffix = _a.suffix, aliasInfo = _a.aliasInfo;
            var dependencyFileChecker = new RegExp("\\." + suffix + "$");
            if (dependencyFileChecker.test(withDefaultExt)) {
                if (withDefaultExt.includes(aliasInfo.aliasSymbol)) {
                    result = path_1.default.resolve(aliasInfo.matchPath, withDefaultExt.replace(aliasInfo.aliasSymbol, '.'));
                }
            }
        });
        return result;
    };
    WxAppJsonPlugin.prototype.getDependency = function (fileAbsolutePath) {
        var isInDependent = true;
        var setImportRegex = undefined;
        var dependencyPairs = this.options.dependencyPairs;
        var dependencySet = new Set();
        dependencyPairs.forEach(function (_a) {
            var suffix = _a.suffix, importRegex = _a.importRegex;
            var dependencyFileChecker = new RegExp("\\." + suffix + "$");
            if (dependencyFileChecker.test(fileAbsolutePath)) {
                isInDependent = false;
                setImportRegex = importRegex;
            }
        });
        if (!isInDependent) {
            var fileContent = fs_1.default.readFileSync(fileAbsolutePath).toString();
            var importRegexObj = new RegExp(setImportRegex);
            var temp = null;
            while ((temp = (importRegexObj.exec(fileContent) || [])[1])) {
                dependencySet.add(this.disposeFileNameAlias(temp));
            }
        }
        return {
            dependency: dependencySet,
            isInDependent: isInDependent
        };
    };
    WxAppJsonPlugin.appPagesFakeImportFileName = 'fakePageImport.ts';
    WxAppJsonPlugin.NAME = 'WxAppJsonPlugin';
    return WxAppJsonPlugin;
}());
var FormatConsole = (function () {
    function FormatConsole() {
        var _this = this;
        this.styles = {
            cyanBack: "\u001B[46;30m",
            pinkBack: "\u001B[45;30m",
            yellowBack: "\u001B[43;30m"
        };
        this.info = function (text) {
            console.log(_this.format(_this.styles.cyanBack, 'INFO', text));
        };
        this.error = function (text) {
            console.log(_this.format(_this.styles.pinkBack, 'ERROR', text));
        };
        this.logger = function (text) {
            console.log(_this.format(_this.styles.yellowBack, 'LOGGER', text));
        };
        this.format = function (back, title, content) {
            return back + " " + title + " \u001B[0m " + content + "\n";
        };
    }
    return FormatConsole;
}());
module.exports = WxAppJsonPlugin;
