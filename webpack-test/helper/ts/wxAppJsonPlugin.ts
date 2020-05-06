import { Compiler } from 'webpack'
import Fs from 'fs'
import Path from 'path'

interface IOptions {
    outputDir: string
    srcDir: string
    pageFileSuffixArray: string[]
    tempDir: string
    appLevelFiles: string[]
    appJsonPath: string
    dependencyPairs: {
        suffix: string
        importRegex: RegExp
        aliasInfo: {
            aliasSymbol: string
            matchPath: string
        }
    }[]
    defaultExt: string
}

interface IDependencyInfo {
    /**
     * 此文件依赖的文件
     */
    dependency: Set<string>
    /**
     * 是否是独立文件，也就是不需要检查引用的文件，just copy引用
     */
    isInDependent: boolean
}

class WxAppJsonPlugin {
    private options: IOptions
    private fakePageFilePath: string
    private static readonly appPagesFakeImportFileName = 'fakePageImport.ts'
    private fConsole: FormatConsole
    private static readonly NAME = 'WxAppJsonPlugin'
    private fileDependencyMap = new Map<string, IDependencyInfo>()
    /**
     * 不需要被依赖的文件绝对路径列表
     */
    private notNeedDependedByFiles: Set<string> = new Set()

    constructor(options: IOptions) {
        this.options = { ...options }
        const { tempDir } = options
        this.fakePageFilePath = Path.resolve(tempDir, WxAppJsonPlugin.appPagesFakeImportFileName)
        this.fConsole = new FormatConsole()
    }

    /**
     * 获取webpack所需的entry参数
     */
    public getEntry() {
        const { srcDir } = this.options
        this.updateFakeImport()
        const entryKey = Path.relative(srcDir, this.fakePageFilePath)

        // 初始化文件依赖
        this.initFileDependency()
        this.updateFakeImport()
        this.fConsole.info('Init file dependency finished')

        return {
            [entryKey]: this.fakePageFilePath
        }
    }

    apply(compiler: Compiler) {
        const { appJsonPath } = this.options
        compiler.hooks.watchRun.tap(WxAppJsonPlugin.NAME, (newCompiler, e) => {
            const modifyFiles = (newCompiler as any).watchFileSystem.watcher.mtimes
            let needUpdate = false
            for (const filePath in modifyFiles) {
                // 如果是 app json 文件改变了，则代表可能是page出现了改变，重新刷新fake
                if (filePath === appJsonPath) {
                    this.fConsole.info('App(.json?) modified')
                    // 初始化文件依赖
                    this.initFileDependency()
                    needUpdate = true
                } else {
                    if (Fs.existsSync(filePath) && filePath !== this.fakePageFilePath) {
                        this.oneFileModified(filePath)
                        needUpdate = true
                    }
                }
            }

            if (needUpdate) {
                this.updateFakeImport()
                this.fConsole.info('Update fake importer')
            }
        })
    }

    /**
     * 一个文件被改动了
     * @param absolutePath 绝对路径
     */
    private oneFileModified(absolutePath: string) {
        this.disposeAnalysisFiles([absolutePath], false)
    }

    /**
     * 更新fake import,去除没有被引用的文件
     */
    private updateFakeImport() {
        const { tempDir } = this.options
        const allFileAbsolutePathSet = new Set<string>()
        const dependedByCounterMap = new Map<string, number>()
        const notExistFiles = new Set<string>()

        const sureExistInCounterMap = (filePath: string, defaultValue: number) => {
            if (!dependedByCounterMap.has(filePath)) {
                dependedByCounterMap.set(filePath, defaultValue)
            }
        }
        for (const [key, value] of Array.from(this.fileDependencyMap.entries())) {
            // 如果文件已经不存在，则略过，不处理其依赖
            if (!Fs.existsSync(key)) {
                notExistFiles.add(key)
                continue
            }
            // 确保文件存在于地图中
            // 如不存在，如果此文件是独立类型，则设置为1（被引用，则被Import）
            sureExistInCounterMap(key, value.isInDependent ? 1 : 0)

            if (value.dependency) {
                value.dependency.forEach((item: string) => {
                    sureExistInCounterMap(item, 0)
                    const nowCounter = dependedByCounterMap.get(item)!
                    dependedByCounterMap.set(item, nowCounter + 1)
                })
            }
        }

        // 将已经删除的文件排除在依赖列表之外
        notExistFiles.forEach((item) => this.fileDependencyMap.delete(item))

        for (const [absolutePath, counter] of Array.from(dependedByCounterMap.entries())) {
            // 有引用的文件则 fake import
            if (counter > 0) {
                allFileAbsolutePathSet.add(absolutePath)
            }
            // 如果没有引用
            else {
                // 此文件属于不需要被引用的文件，则依旧添加
                if (this.notNeedDependedByFiles.has(absolutePath)) {
                    allFileAbsolutePathSet.add(absolutePath)
                }
                // 如不是，则代表此文件已被移除，从依赖表中移除
                else {
                    this.fileDependencyMap.delete(absolutePath)
                }
            }
        }

        // 创建临时文件夹
        if (!Fs.existsSync(tempDir)) {
            Fs.mkdirSync(tempDir)
        }

        const fileContent = Array.from(allFileAbsolutePathSet)
            .map((absolutePath) => Path.relative(tempDir, absolutePath))
            .map((item, index) => {
                // 对 win 的路径做一个兼容
                const forWinCompatibility = item.replace(/\\/g, '/')
                const requireString = `const file_${index} = require('${forWinCompatibility}');`
                const somethingForCheck = `let fake_${index} = file_${index};fake_${index}=()=>{};fake_${index}();`

                return requireString + '\n' + somethingForCheck + '\n'
            })
            .join('')

        Fs.writeFileSync(this.fakePageFilePath, fileContent, {
            flag: 'w'
        })
    }

    /**
     * 初始化依赖
     */
    private initFileDependency() {
        const { srcDir, pageFileSuffixArray, appLevelFiles } = this.options

        const appJsonString = Fs.readFileSync(Path.resolve(srcDir, 'app.map')).toString()
        const appObj = JSON.parse(appJsonString)
        const allPagesPair = (appObj.pages as string[]).map((item) => Path.resolve(srcDir, item))

        let allPageFilesPath: string[] = []
        allPagesPair.forEach((item) => {
            allPageFilesPath = [
                ...allPageFilesPath,
                ...pageFileSuffixArray.map((suffix) => `${item}.${suffix}`)
            ]
        })

        allPageFilesPath = [...allPageFilesPath, ...appLevelFiles]

        // 此处的文件包含 pages、 app level file，这些都是无需被其他文件引用的文件
        // 也只有这些文件才是绝对不“必须“被其他文件引用
        this.notNeedDependedByFiles = new Set([...allPageFilesPath])
        // 清空依赖
        this.fileDependencyMap = new Map<string, IDependencyInfo>()
        this.disposeAnalysisFiles(allPageFilesPath, true)
    }

    /**
     * 处理需要分析的文件
     * @param analysisArray 分析文件列表
     */
    private disposeAnalysisFiles(analysisArray: string[], init: boolean) {
        let allFilesAbsolutePath = Array.from(new Set([...analysisArray]))
        // 处理文件队列
        while (allFilesAbsolutePath.length) {
            const absolutePath = allFilesAbsolutePath.pop()!
            const dataExist = this.fileDependencyMap.has(absolutePath)
            // 如果不存在,则无论是初始化还是后续修改，都直接创建
            if (!dataExist) {
                const dependencyInfo = this.getDependency(absolutePath)
                const { isInDependent, dependency } = dependencyInfo
                // 增加到文件依赖地图里面
                this.fileDependencyMap.set(absolutePath, {
                    isInDependent,
                    dependency: dependency
                })

                // 把依赖文件添加到处理队列之中
                allFilesAbsolutePath = Array.from(
                    new Set([...allFilesAbsolutePath, ...Array.from(dependency)])
                )
            }
            // 如果数据已经存在，并且不是初始化，则更新所有引用的文件的依赖
            if (dataExist && !init) {
                const dependencyInfo = this.getDependency(absolutePath)
                const { dependency } = dependencyInfo
                this.fileDependencyMap.get(absolutePath)!.dependency = dependency

                // 把依赖文件添加到处理队列之中
                allFilesAbsolutePath = Array.from(
                    new Set([...allFilesAbsolutePath, ...Array.from(dependency)])
                )
            }
        }
    }

    /**
     * 处理文件路径别名
     * @param filePath 文件路径
     */
    private disposeFileNameAlias(filePath: string) {
        const { dependencyPairs, defaultExt } = this.options
        const ext = Path.extname(filePath)
        // 给没有后缀的文件加上默认后缀
        const withDefaultExt = ext ? filePath : filePath + `.${defaultExt}`

        let result = withDefaultExt
        // 检查是否需检索依赖
        dependencyPairs.forEach(({ suffix, aliasInfo }) => {
            const dependencyFileChecker = new RegExp(`\\.${suffix}$`)

            if (dependencyFileChecker.test(withDefaultExt)) {
                if (withDefaultExt.includes(aliasInfo.aliasSymbol)) {
                    result = Path.resolve(
                        aliasInfo.matchPath,
                        withDefaultExt.replace(aliasInfo.aliasSymbol, '.')
                    )
                }
            }
        })

        return result
    }

    /**
     * 获取一个文件的依赖文件
     * @param fileAbsolutePath 文件绝对路径
     */
    private getDependency(
        fileAbsolutePath: string
    ): { isInDependent: boolean; dependency: Set<string> } {
        let isInDependent = true
        let setImportRegex: RegExp | undefined = undefined
        const { dependencyPairs } = this.options
        const dependencySet = new Set<string>()
        // 检查是否需检索依赖
        dependencyPairs.forEach(({ suffix, importRegex }) => {
            const dependencyFileChecker = new RegExp(`\\.${suffix}$`)

            if (dependencyFileChecker.test(fileAbsolutePath)) {
                isInDependent = false
                setImportRegex = importRegex
            }
        })

        if (!isInDependent) {
            const fileContent = Fs.readFileSync(fileAbsolutePath).toString()
            const importRegexObj = new RegExp(setImportRegex!)
            let temp: string | null = null

            while ((temp = (importRegexObj.exec(fileContent) || [])[1])) {
                // 别名处理
                dependencySet.add(this.disposeFileNameAlias(temp))
            }
        }
        return {
            dependency: dependencySet,
            isInDependent
        }
    }
}

class FormatConsole {
    private styles = {
        cyanBack: `\u001b[46;30m`,
        pinkBack: `\u001b[45;30m`,
        yellowBack: `\u001b[43;30m`
    }

    /**
     * 控制台打印信息
     * 级别：information -- 信息
     * @param text 文本信息
     */
    public info = (text: string) => {
        console.log(this.format(this.styles.cyanBack, 'INFO', text))
    }

    /**
     * 控制台打印信息
     * 级别：error -- 错误
     * @param text 错误信息
     */
    public error = (text: string) => {
        console.log(this.format(this.styles.pinkBack, 'ERROR', text))
    }

    /**
     * 控制台打印信息
     * 级别：logger -- 记录
     * @param text 文本信息
     */
    public logger = (text: string) => {
        console.log(this.format(this.styles.yellowBack, 'LOGGER', text))
    }

    /**
     * 产生颜色格式化字符串
     * @param back 背景色
     * @param content 内容
     */
    private format = (back: string, title: string, content: string) => {
        return `${back} ${title} \u001b[0m ${content}\n`
    }
}

module.exports = WxAppJsonPlugin
