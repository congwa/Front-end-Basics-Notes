
/**
 * 您的程序会将一些 html 写入标准输入。对于类名为“loud”的元素，将所有内部 html 转换为大写，并将所有 html 通过管道传输到 stdout。
 * 
 */


const trumpet = require('trumpet')
const through = require('through2')
const tr = trumpet()

const loud = tr.select('.loud').createStream()
loud.pipe(through(function (buf, _, next) {
  this.push(buf.toString().toUpperCase())
  next()
})).pipe(loud)

process.stdin.pipe(tr).pipe(process.stdout)