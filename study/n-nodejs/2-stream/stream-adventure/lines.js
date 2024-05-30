const split2 = require('split2');
const through2 = require('through2');

let lineNum = 1; // 行号

const transformStream = through2(function(chunk, encoding, next) {
  const line = chunk.toString(); // 将数据块转换为字符串
  let transformedLine; // 转换后的行字符串

  if (lineNum % 2 === 0) { // 偶数行转为大写
    transformedLine = line.toUpperCase();
  } else { // 奇数行转为小写
    transformedLine = line.toLowerCase();
  }

  this.push(transformedLine + '\n'); // 推入输出队列中，并加上换行符
  lineNum++; // 行号自增
  next(); // 调用 next() 函数，继续处理下一个数据块
});

process.stdin.pipe(split2()).pipe(transformStream).pipe(process.stdout);
