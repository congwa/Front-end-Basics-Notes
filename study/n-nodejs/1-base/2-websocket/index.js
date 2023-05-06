// 引入模块
const { EventEmitter } = require('events');
const http = require('http');
const crypto = require('crypto');

// 生成 websocket 握手的 Sec-WebSocket-Accept 校验 key
function hashKey(key) {
  const sha1 = crypto.createHash('sha1');
  sha1.update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
  return sha1.digest('base64');
}

// 对 WebSocket 数据进行掩码处理
// 是用来给内容解密
function handleMask(maskBytes, data) {
  const payload = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    payload[i] = maskBytes[i % 4] ^ data[i];
  }
  return payload;
}

// 定义 WebSocket 数据帧中的操作码
const OPCODES = {
  CONTINUE: 0, // 继续传输数据帧
  TEXT: 1, // 文本数据
  BINARY: 2, // 二进制数据
  CLOSE: 8, // 关闭连接通知
  PING: 9, // 发送 ping 帧
  PONG: 10, // 发送 pong 帧
};

// 编码 WebSocket 数据帧
function encodeMessage(opcode, payload) {
  let bufferData = Buffer.alloc(payload.length + 2 + 0);

  // 设置 FIN 为 1 并设置操作码
  let byte1 = parseInt('10000000', 2) | opcode;
  // 设置负载长度
  let byte2 = payload.length;

  bufferData.writeUInt8(byte1, 0);
  bufferData.writeUInt8(byte2, 1);

  // 写入负载数据
  payload.copy(bufferData, 2);

  return bufferData;
}

// WebSocket 类
class MyWebsocket extends EventEmitter {
  constructor(options) {
    super(options);

    // 创建 http 服务器用于监听 WebSocket 连接
    const server = http.createServer();
    server.listen(options.port || 8080);

    // 监听 upgrade 事件，建立 WebSocket 连接
    server.on('upgrade', (req, socket) => {
      this.socket = socket;
      socket.setKeepAlive(true);

      // 对客户端发来的握手请求进行响应
      const resHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Sec-WebSocket-Accept: ' + hashKey(req.headers['sec-websocket-key']),
        '',
        ''
      ].join('\r\n');
      socket.write(resHeaders);

      // 监听 socket 的 data 和 close 事件
      socket.on('data', (data) => {
        this.processData(data);
      });
      socket.on('close', (error) => {
        this.emit('close'); // 发送 close 事件
      });
    });

  }

  // 处理接收的数据帧
  handleRealData(opcode, realDataBuffer) {
    switch (opcode) {
      case OPCODES.TEXT:
        this.emit('data', realDataBuffer.toString('utf8')); // 发送 data 事件
        break;
      case OPCODES.BINARY:
        this.emit('data', realDataBuffer); // 发送 data 事件
        break;
      default:
        this.emit('close'); // 发送 close 事件
        break;
    }
  }

  // 处理接收到的数据
  processData(bufferData) {
    const byte1 = bufferData.readUInt8(0);
    let opcode = byte1 & 0x0f;

    const byte2 = bufferData.readUInt8(1);
    const str2 = byte2.toString(2);
    const MASK = str2[0];

    let curByteIndex = 2;

    // 获取负载长度
    let payloadLength = parseInt(str2.substring(1), 2);
    if (payloadLength === 126) {
      payloadLength = bufferData.readUInt16BE(2); // 从第 3 字节读取 16 位无符号整数
      curByteIndex += 2;
    } else if (payloadLength === 127) {
      payloadLength = bufferData.readBigUInt64BE(2); // 从第 3 字节开始读取 64 位大端序列无符号整数
      curByteIndex += 8;
    }

    let realData = null;

    // 如果有掩码，则根据掩码对负载数据进行处理
    if (MASK) {
      const maskKey = bufferData.slice(curByteIndex, curByteIndex + 4);
      curByteIndex += 4;
      const payloadData = bufferData.slice(curByteIndex, curByteIndex + payloadLength);
      realData = handleMask(maskKey, payloadData);
    }

    // 处理真实数据
    this.handleRealData(opcode, realData);

  }

  // 发送消息
  send(data) {
    let opcode;
    let buffer;
    if (Buffer.isBuffer(data)) { // 如果是二进制数据
      opcode = OPCODES.BINARY;
      buffer = data;
    } else if (typeof data === 'string') { // 如果是文本数据
      opcode = OPCODES.TEXT;
      buffer = Buffer.from(data, 'utf8');
    } else {
      console.error('暂不支持发送的数据类型')
    }
    // 发送数据帧
    this.doSend(opcode, buffer);
  }

  // 实际发送消息
  doSend(opcode, bufferDatafer) {
    this.socket.write(encodeMessage(opcode, bufferDatafer));
  }
}

const ws = new MyWebsocket({ port: 8080 });

ws.on('data', (data) => {
  console.log('receive data:' + data);
  setInterval(() => {
    ws.send(data + ' ' + Date.now());
  }, 2000)
});

ws.on('close', (code, reason) => {
  console.log('close:', code, reason);
});