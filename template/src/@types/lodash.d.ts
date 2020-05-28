// 这只是个栗子，loadsh由于使用的 module 方式 小程序不兼容，故而无法使用
declare module '@/library/lodash' {
    export const add: (num1: number, num2: number) => number
}
