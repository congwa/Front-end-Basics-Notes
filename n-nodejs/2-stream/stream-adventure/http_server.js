/**
 * 编写一个 http 服务器，它使用直通流将请求流写回作为 POST 请求的大写响应数据
 * 您的 http 服务器应该侦听 process.argv[2] 中给定的端口，并使用与 TRANSFORM 示例相同的方法将写入它的 POST 请求转换为大写。
 */

// 导入所需的模块
const http = require('http')
const through = require('through2')

// 创建 HTTP 服务器
const server = http.createServer(function (req, res) {
  // 如果请求方法为 POST，则将请求体转换为大写并返回
  if (req.method === 'POST') {
    req.pipe(through(function (buf, _, next) {
      this.push(buf.toString().toUpperCase()) // 将请求体转换为大写并输出
      next() // 转换完成，继续处理下一个数据块
    })).pipe(res) // 返回响应结果
  } else {
    // 如果请求方法不为 POST，则返回错误提示信息
    res.end('send me a POST\n')
  }
})

// 启动 HTTP 服务器并监听指定端口号
server.listen(parseInt(process.argv[2]))
