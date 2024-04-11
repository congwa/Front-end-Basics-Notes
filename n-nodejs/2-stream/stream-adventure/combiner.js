/**
  在名为 combiner.js 的新文件中创建一个模块，它应该使用 stream-combiner 模块返回一个可读/可写流。
  您可以使用此代码开始：

  const combine = require('stream-combiner')
    
  module.exports = function () {
    return combine(
      // read newline-separated json,
      // group books into genres,
      // then gzip the output
    )
  }

  您的流将写入以换行符分隔的 JSON 科幻小说类型和书籍列表。 "type":"genre" 行之后的所有书籍都属于该类型，直到下一个 "type":"genre" 出现在输出中。

  {"type":"genre","name":"cyberpunk"}
  {"type":"book","name":"Neuromancer"}
  {"type":"book","name":"Snow Crash"}
  {"type":"genre","name":"space opera"}
  {"type":"book","name":"A Deepness in the Sky"}
  {"type":"book","name":"Void"}


  您的程序应该生成一个以换行符分隔的 JSON 流派行列表，每个流都有一个包含该流中所有书籍的 "books" 数组。上面的输入将产生输出：

  {"name":"cyberpunk","books":["Neuromancer","Snow Crash"]}
  {"name":"space opera","books":["A Deepness in the Sky","Void"]}

  您的流应该采用此 JSON 行列表并使用 zlib.createGzip() 对其进行 gzip 压缩。


 */

const combine = require('stream-combiner')
const through = require('through2')
const split2 = require('split2')
const zlib = require('zlib')

module.exports = function () {
  const grouper = through(write, end) // 通过 `through2` 创建一个可写流，用于分组所有书籍
  let current

  function write(line, _, next) { // 写回调函数，用于对读取到的数据进行处理
    if (line.length === 0) return next() // 空行不做处理，直接调用下一个操作
    const row = JSON.parse(line)

    if (row.type === 'genre') { // 如果读到的行是类型为 "genre"
      if (current) { // 如果当前分组不为空，将其序列化并写入到输出流中
        this.push(JSON.stringify(current) + '\n')
      }
      current = { name: row.name, books: [] } // 创建一个新的分组
    } else if (row.type === 'book') { // 如果读到的行是类型为 "book"
      current.books.push(row.name) // 将书籍名称添加到当前分组中
    }
    next() // 调用下一个操作
  }

  function end(next) { // 结束回调函数，检查是否有未写入输出流的剩余分组
    if (current) {
      this.push(JSON.stringify(current) + '\n')
    }
    next()
  }

  return combine(split2(), grouper, zlib.createGzip()) // 使用 `stream-combiner` 将多个流组合成一个流
}
