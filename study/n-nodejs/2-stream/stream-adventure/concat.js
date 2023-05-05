/**
 * 
 * 需要使用来自 process.stdin 的 concat() 来缓冲输入
 * 
 * process.stdout 和 concat-stream 都是可写流，所以它们不能通过管道连接在一起。
 * 
 */

const concat = require('concat-stream')

process.stdin.pipe(concat(function (src) {
  const s = src.toString().split('').reverse().join('')
  process.stdout.write(s)
}))