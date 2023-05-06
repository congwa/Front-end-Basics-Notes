
/**
 * 
 * 在此示例中，您将获得一个可读流 counter 作为导出函数的第一个参数：
 */
/**
   module.exports = function (counter) {
  // return a duplex stream to count countries on the writable side
  // and pass through `counter` on the readable side
  }
 */
/**
 * 返回以 counter 作为可读端的双工流。您将编写带有 2 个字符的 country 字段作为输入的对象，
 */

/**
  {"short":"OH","name":"Ohio","country":"US"}
  {"name":"West Lothian","country":"GB","region":"Scotland"}
  {"short":"NSW","name":"New South Wales","country":"AU"}
 */

  /**
   * 创建一个对象来跟踪每个唯一国家/地区代码的出现次数。
   */

  /**
   *   {"US": 2, "GB": 3, "CN": 1}
   */


/**
 const provinces = require('provinces')
const exercise = require('../../lib/duplexExercise')
const { readableStream } = require('../../lib/utils')

const getInput = () => {
  const input = []
  const len = 50 + Math.floor(Math.random() * 25)
  for (let i = 0; i < len; i++) {
    const p = provinces[Math.floor(Math.random() * provinces.length)]
    input.push(p)
  }
  return input
}

exercise.inputStdin = getInput()

const getCounter = () => {
  const counter = readableStream()
  counter.setCounts = function (counts) {
    const self = this
    Object.keys(counts).sort().forEach(function (key) {
      self.push(`${key} => ${counts[key]}\n`)
    })
    this.push(null)
  }
  return counter
}

exercise.submissionArgs = getCounter()
exercise.solutionArgs = getCounter()

module.exports = exercise
 */

const duplexer = require('duplexer2')  
const through = require('through2').obj

module.exports = function (counter) {
  const counts = {} // 使用一个对象来统计每个国家的行数
  const input = through(write, end) // 创建一个 through 流，用于处理输入的数据，并将其转换成一个对象流
  return duplexer({ objectMode: true }, input, counter) // 将处理后的对象流和计数器（也是一个对象流）合并成一个可读/可写的 duplex 流

  function write (row, _, next) { // 定义 write 函数，用于处理输入的数据
    counts[row.country] = (counts[row.country] || 0) + 1 // 统计每个国家的行数
    next() // 标识此次操作已完成
  }

  function end (done) { // 定义 end 函数，用于关闭流
    counter.setCounts(counts) // 将统计的结果设置到计数器上
    done() // 表示此时流已经处理完毕，可以关闭了
  }
}