/**
 * 写一个使用 ws 模块的 websocket 客户端，在 websocket 客户端之上生成一个流，将字符串 "hello\n" 写入流并将其通过管道传输到 process.stdout
 * 
 * 如果您对如何编写服务器端代码感到好奇， ws 的自述文件有更多信息： https://github.com/websockets/ws
 * 
 * 确保在解决方案文件所在的目录中 npm install ws
 */

const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:8099')
const stream = WebSocket.createWebSocketStream(ws)
stream.write('hello\n')
stream.pipe(process.stdout)