// import { Compiler } from 'webpack'
export interface IOptions {
    /**
     * 根目录
     */
    srcDir: string
    /**
     * wxss 文件在src源代码中所对应的后缀
     */
    wxssSrcSuffix: string
    /**
     * 是否使用了 ts
     */
    isUseTs: boolean
}

export interface ISystemInfo {
    outDir: string
    alias: {
        symbol: string
        path: string
    }[]
}

export class WxMiniProgramOriginalPlugin {
    // apply(compiler: Compiler) {
    //     // compiler.hooks.entryOption.tap()
    // }
}
