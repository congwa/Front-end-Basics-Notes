const WebSocket = require('ws');

// 创建 WebSocket 实例
const ws = new WebSocket('ws://localhost:8080');

// 监听连接成功事件
ws.on('open', function () {
  console.log('WebSocket 连接成功');
  // 发送数据
  ws.send('发送数据');
  setTimeout(() => {
    ws.send('发送数据2');
  }, 3000);
});

// 监听消息事件
ws.on('message', function (data) {

  console.log('接收到消息：',  Buffer.from(data).toString('utf8'));
});

// 监听连接关闭事件
ws.on('close', function () {
  console.log('WebSocket 连接已关闭');
});