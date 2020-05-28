import { FileAnalyzer } from '../index';
/**
 * 获得前缀所对应的页面或者组件的4文件
 * @param prefixPath page components的文件前缀,绝对路径前缀
 * @param extArray 搜索后缀列表
 */
export declare const getPageOrComponentFiles: (prefixPath: string, extArray: string[][]) => string[];
/**
 * json文件分析器
 * 注意，json文件中有 pages数组 和 usingComponents 对象
 */
declare const analyzer: FileAnalyzer;
export default analyzer;
