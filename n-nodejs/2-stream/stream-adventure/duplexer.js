/**
 * 编写一个程序，该程序导出一个函数，该函数从 cmd 字符串和 args 数组生成进程，并返回将生成进程的标准输入和标准输出连接在一起的单个双工流
 * 
 * 请记住，主进程和子进程将具有不同的流接口。
 * process.stdin is a Readable stream process.stdout is a Writable stream
 * 
 * 对于您所在的进程，stdin 对您来说是可读的。对于子进程，您在外面，因此该进程的标准输入对您是可写的。
 * childProc.stdin is a Writable stream childProc.stdout is a Readable stream
 * 
 * 另外，请查看 duplexer2 文档并注意导出函数的签名是 duplexer2([options], writable, readable) ，这意味着您可能需要传递一个选项参数。
 */


const { spawn } = require('child_process')
const duplexer = require('duplexer2')

module.exports = function (cmd, args) {
  const ps = spawn(cmd, args)
  return duplexer(ps.stdin, ps.stdout)
}