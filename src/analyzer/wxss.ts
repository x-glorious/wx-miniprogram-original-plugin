import Fs from 'fs'
import Path from 'path'
import { getFakerImportRelativePath, transformRootOrRelativeToRealPath } from '../tools'
import { FileAnalyzer } from '../index'

/**
 * wxss 文件分析器
 * 注意，经过测试scss @import 行为异常(直接拷贝，并且无法使用根路径，但可以使用 alias)
 * 故而我选择不支持，咱们只支持 wxss 的 @import ，其他的咱们就不管了, wxss不支持别名，因为可以使用根路径
 */
const analyzer: FileAnalyzer = (
    fileAbsolutePath,
    webpackSystemInfo,
    options,
    additionalDependencies
) => {
    const dependencies = new Set<string>(additionalDependencies ? additionalDependencies : [])
    const extName = Path.extname(fileAbsolutePath)

    if (extName === 'wxss') {
        const importRegex = /@import\s+"([^\s"]+?)"\s*;/g
        const starCommentRegex = /\/\*(.|\n)*?\*\//g
        const content = Fs.readFileSync(fileAbsolutePath).toString()

        // 去除所有wxss注释，得到真正的内容
        const realContent = content.replace(starCommentRegex, '')

        // 获取 @import 依赖
        const getImportDel = (searchRegex: RegExp) => {
            let temp: string | null = null
            while ((temp = (searchRegex.exec(realContent) || [])[1])) {
                dependencies.add(
                    transformRootOrRelativeToRealPath(
                        fileAbsolutePath,
                        temp,
                        webpackSystemInfo.srcDir
                    )
                )
            }
        }
        getImportDel(importRegex)
    }

    return {
        absolutePath: fileAbsolutePath,
        dependencies,
        importPath: getFakerImportRelativePath(fileAbsolutePath)
    }
}

export default analyzer
