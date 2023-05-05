/**
 * 将 HTTP POST 请求发送到 http://localhost:8099 并将 process.stdin 通过管道传递。将响应流通过管道传输到 process.stdout
 * 
 * 提示：从 request() 返回的 req 对象是可写流，回调函数中的 res 对象是可读流。
 */

const { request } = require('http')

// 设置请求选项POST
const options = { method: 'POST' }

// 发送 HTTP 请求
const req = request('http://localhost:8099', options, (res) => {
  // 处理响应结果（将响应结果输出到控制台）
  res.pipe(process.stdout)
})

// 将标准输入流连接到请求对象中，并发送请求
process.stdin.pipe(req)
