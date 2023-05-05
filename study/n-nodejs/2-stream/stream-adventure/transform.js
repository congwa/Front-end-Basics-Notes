const through = require('through2')

// 创建一个 transform 流对象
const stream = through(function (chunk, encoding, next) {
  // 将数据转换为大写字母
  const upperChunk = chunk.toString().toUpperCase()
  
  // 将转换后的数据推入输出队列中
  this.push(upperChunk)
  
  // 调用 next() 函数以继续处理下一块数据
  next()
})

// 将标准输入流中的数据通过 transform 流传递到标准输出流中
process.stdin.pipe(stream).pipe(process.stdout)