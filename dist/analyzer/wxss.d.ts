import { FileAnalyzer } from '../index';
/**
 * wxss 文件分析器
 * 注意，经过测试scss @import 行为异常(直接拷贝，并且无法使用根路径，但可以使用 alias)
 * 故而我选择不支持，咱们只支持 wxss 的 @import ，其他的咱们就不管了, wxss不支持别名，因为可以使用根路径
 */
declare const analyzer: FileAnalyzer;
export default analyzer;
