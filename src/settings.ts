import Path from 'path'

const CACHE_DIR = '.cache'
const PLUGIN_DIR = __dirname

export default {
    /**
     * webpack 运行时路径
     */
    runtimeChunkPath: Path.resolve(PLUGIN_DIR, `${CACHE_DIR}/webpackRuntime`),
    /**
     * 虚假导入文件路径
     */
    fakerImporterPath: Path.resolve(PLUGIN_DIR, `${CACHE_DIR}/fakerImporter.js`),
    /**
     * 缓存目录相对地址
     */
    cacheRelativeDir: CACHE_DIR,
    /**
     * 缓存目录
     */
    cacheDir: Path.resolve(PLUGIN_DIR, CACHE_DIR),
    /**
     * 插件文件所在目录
     */
    pluginDir: PLUGIN_DIR
}
