# 流


---
## stream-adventure

这是一个很好的学习stream的程序

```js
// 可以通过方向键选择要完成的练习题并按回车键进行确认
stream-adventure select 1

// 选择完成后，可以在当前目录下找到一个名为 01.js 的 JavaScript 文件，我们需要在其中编写代码实现目标
// 完成代码编写后，可以在终端中输入以下命令进行测试
stream-adventure verify 01.js
```

我将在本目录完成以上程序的[所有示例](./stream-adventure)

---

## 什么是流

流是在 Node.js 中处理流数据的抽象接口，可以在加载或生成数据时逐块（或逐块）使用数据，而不是将其全部放入内存中开始使用

流有四种方式

- Readable stream，可以读取哪些数据。
- Writable stream，可以写入哪些数据。
- Duplex 流，它是 Readable 和 Writable
- Transform stream，这是一个 Duplex stream，可以在写入和读取数据时修改或转换数据

流存在于许多 Node.js 模块中，例如 http.request() 、 zlib.createGzip() 、 fs.createReadStream() 、 process.stdout ...所有这些返回流。

---
### pipe 方法

pipe 方法允许您将可读流的输出连接为可写流的输入

```js
readable.pipe(writable)
```

如果您通过管道传输到双工流中，您可以链接到其他流。

```js
readable.pipe(duplex).pipe(writable)

```

---
## 可读流

要实现一个 Readable 流，你需要构造一个对象，或者继承自 stream.Readable 类，并在其中实现一个 _read() 方法。


```js
const { Readable } = require('stream')

const myStream = new Readable({})
myStream._read = () => {}

```

或者

```js
const { Readable } = require('stream')

class MyStream extends Readable {
  _read() {}
}
```

注意：此 _read 方法不得由应用程序代码直接调用。它只能由内部 Readable 类方法调用

### 可读流的两种模式

Readable 流以两种模式之一运行：流动和暂停

1. 在流动模式下，数据会自动从底层系统读取并尽快提供
2. 在暂停模式下，必须显式调用 read() 方法才能从流中读取数据块

所有可读流都以暂停模式开始，但可以切换到流动模式，也可以切换回暂停模式。

### 使用可读流

1. readable.pipe(writable) ，将 Writable 流附加到可读对象，使其自动切换到流动模式并将其所有数据推送到附加的 Writable
2. readable.on('readable', ...) ，此处流 ( readable ) 处于暂停模式，必须使用 read(size) 方法开始使用数据。
3. readable.on('data', ...) ，添加 data 事件处理程序将流切换到流动模式。我们可以分别使用 pause() 和 resume() 方法暂停和恢复流。当需要对流的数据执行一些耗时的操作（例如写入数据库）时，这很有用

### 向流中添加数据

可以使用 push() 方法将内容添加到可读内部 Buffer 中。

### docs

- stream.Readable: https://nodejs.org/api/stream.html#stream_class_stream_readable
- readable._read(): https://nodejs.org/api/stream.html#stream_readable_read_size_1
- 流阅读模式： https://nodejs.org/api/stream.html#stream_two_reading_modes

---
## 可写流

要创建自定义 Writable 流，您必须调用 new stream.Writable(options) 构造函数并实现 _write() 或 _writev() 方法

```js
  const { Writable } = require('stream')

  const myWritable = new Writable({
    write(chunk, encoding, callback) {}
  })
```

或者

```js
  const { Writable } = require('stream')

  class MyCustomWritable extends Writable {
    _write(chunk, encoding, callback) {
      // ...
    }
  }
```

### _write方法


_write 方法用于将数据发送到底层资源。

您的应用程序代码不得直接调用此方法。相反，它仅由内部 Writable 类方法调用。

该方法接收以下参数：

- chunk 是要写入的值，通常是从您传递给 stream.write() 的字符串转换而来的 Buffer。
- encoding ，如果块是字符串，将是字符串的字符编码。否则它可能会被忽略。
- callback 提供的块处理完成时将调用的函数。
    回调函数接收一个参数，如果写入过程失败，则此参数必须是 Error 对象，如果成功，则必须是 null 。

### 使用可写流

要将数据写入可写流，您需要在流实例上调用 write() 方法。

```js
  readable.on('data', (chunk) => {
    writable.write(chunk)
  })
```

```js
const fs = require('fs')
const { Writable } = require('stream')

const fileWritable = fs.createWriteStream('output.txt')

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // 将接收到的数据块写入到 fileWritable 中，并在数据块处理完毕后调用了回调函数
    fileWritable.write(chunk, () => {
      console.log(`Wrote ${chunk.length} bytes to file`)
      callback()
    })
  }
})

// 通过 pipe 方法将标准输入流和 myWritable 可写流连接起来，从而实现了将从控制台输入的数据写入到文件中的功能
process.stdin.pipe(myWritable)


```

您**也可以使用我们之前学过的 pipe 方法**。

---

## through2

转换流获取输入数据并对数据应用操作以生成输出数据

使用 write 和 end 函数创建直通流

```js
const through = require('through2')
const stream = through(write, end)
```

为每个可用输入缓冲区调用 write 函数

```js

function write (buffer, encoding, next) {
  // ...
}
```

当没有更多数据时调用 end 函数

```js
function end () {
    // ...
}
```

在写入函数中，调用 this.push() 生成输出数据，并在准备好接收下一个块时调用 next()

```js

function write (buffer, encoding, next) {
  this.push('I got some data: ' + buffer + '\n')
  next()
}

```

并调用 done() 完成输出

```js

function end (done) {
  done()
}

```

write 和 end 都是可选的

如果未指定 write ，则默认实现将输入数据原封不动地传递到输出。


如果不指定 end ，则默认实现在输入端结束时调用 this.push(null) 关闭输出端。

确保将 process.stdin 通过管道传输到您的转换流并将您的转换流通过管道传输到 process.stdout ，如下所示：

```js
process.stdin.pipe(stream).pipe(process.stdout)
```

要将缓冲区转换为字符串，请调用 buffer.toString() 。

完整示例

```js

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

```


---

## split2

split2用于将数据流按照指定的分隔符进行拆分
该模块实现了一个可读流对象，它会将数据流中的数据根据分隔符拆分成多个数据块并发送出去，从而方便我们对数据流进行处理

```js
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

```

---
## concat-stream

concat-stream 模块可以用于将多个数据块缓存到内存中，最终合并为一个完整的数据块，并通过回调函数返回。

使用该模块可以简化对数据块的处理，尤其是在数据块数量不确定时。

```js
const concat = require('concat-stream');

// 创建一个 concat 流对象
const concatStream = concat(function(data) {
  const str = data.toString(); // 将合并后的数据块转换成字符串
  console.log(str);
});

// 将多个数据块推入 concat 流对象中
concatStream.write('Hello, ');
concatStream.write('World!');
concatStream.end();

```

下面是一个使用 concat-stream 缓冲 POST 内容以便 JSON.parse() 提交的数据的示例：

```js
const concat = require('concat-stream')
const http = require('http')

const server = http.createServer(function (req, res) {
  if (req.method === 'POST') {
    req.pipe(concat(function (body) {
      const obj = JSON.parse(body)
      res.end(Object.keys(obj).join('\n'))
    }));
  }
  else res.end()
});
server.listen(5000)
```

注意: 当数据块非常大或者数据块数量非常多时，使用 concat-stream 模块可能会导致内存占用过高，应该避免在这种情况下使用该模块。

---
## http_server http_client

流不仅适用于文本文件和标准输入/标准输出。来自节点核心的 http.createServer() 处理程序的 http 请求和响应对象也是流。

我们可以将文件流式传输到响应对象：

```js
const http = require('http')
const fs = require('fs')
const server = http.createServer(function (req, res) {
  fs.createReadStream('file.txt').pipe(res)
});
server.listen(process.argv[2])
```

还可以流式传输请求以使用数据填充文件：

```js
const http = require('http')
const fs = require('fs')
const server = http.createServer(function (req, res) {
  if (req.method === 'POST') {
    req.pipe(fs.createWriteStream('post.txt'))
  }
  res.end('beep boop\n')
});
server.listen(process.argv[2])

```

---

## websockets

ws模块用于创建websocket服务端和客户端。

关于[websocket](/study/n-nodejs/1-base/2-websocket/)更多细节，请看这里，包含如何建立socket连接

```js
const WebSocket = require('ws')

// 创建一个 WebSocket 服务器并监听指定端口号
const wss = new WebSocket.Server({ port: 8080 })

// 处理客户端连接事件
wss.on('connection', function connection(ws) {
  console.log('client connected')

  // 处理接收到的消息事件
  ws.on('message', function incoming(message) {
    console.log('received: %s', message)

    // 向客户端发送消息
    ws.send(`received: ${message}`)
  })

  // 处理连接关闭事件
  ws.on('close', function close() {
    console.log('client disconnected')
  })
})

// 创建一个 WebSocket 客户端并连接到指定服务器地址
const ws = new WebSocket('ws://localhost:8080')

// 处理连接成功事件
ws.on('open', function open() {
  console.log('connected to server')

  // 向服务器发送消息
  ws.send('hello server')
})

// 处理接收到的消息事件
ws.on('message', function incoming(data) {
  console.log('received: %s', data)
})

// 处理连接关闭事件
ws.on('close', function close() {
  console.log('disconnected from server')
})

```

同时也可以使用流

```js
const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:8099')
const stream = WebSocket.createWebSocketStream(ws)
stream.write('hello\n')
stream.pipe(process.stdout)
```

---
## trumpet

trumpet 是一个基于 Node.js 平台的 HTML 解析器，它可以让你使用 CSS选择器来查找和操作 HTML DOM 元素。

trumpet 通过了 NodeStream 流的方式来解析 HTML，因此可以非常高效地处理大量的数据。

```html

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Example</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is an example page.</p>
</body>
</html>

```

解析以上html

```js

const trumpet = require('trumpet');
const fs = require('fs');

const tr = trumpet();
const stream = fs.createReadStream('index.html').pipe(tr);

tr.select('title', el => {
  el.createReadStream().on('data', data => {
    console.log(`Title: ${data.toString().trim()}`);
  });
});

tr.select('p', el => {
  el.createReadStream().on('data', data => {
    console.log(`Content: ${data.toString().trim()}`);
  });
});

```

---

## Duplex

它实现了同时可读可写的双工流,用于双向通讯

Duplex 流可以将输入的数据转换成输出的数据，并支持在数据传输过程中进行处理和变换

每个 Duplex 流都包含一个内部缓冲区，用于暂存需要处理的数据。

当调用 .write() 方法时，数据会被写入缓冲区；当调用 .read() 方法时，数据则从缓冲区中被读取并输出。Duplex 流的两端可以独立地进行写入和读取操作，不必等待另一端的响应。

```js
const { Duplex } = require('stream');

// 创建一个自定义的 Duplex 流
class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
  }

  // 实现 _read 方法，从缓冲区中读取数据并输出
  _read(size) {
    this.push('hello');
    this.push('world');
    this.push(null);
  }

  // 实现 _write 方法，将输入的数据转换成大写字母，并将其写入缓冲区中
  _write(chunk, enc, cb) {
    const upperChunk = chunk.toString().toUpperCase();
    this.push(upperChunk);
    cb();
  }
}

// 创建一个 MyDuplex 流实例
const myDuplex = new MyDuplex();

// 监听 data 事件，输出数据并将其写回流中
myDuplex.on('data', data => {
  console.log(data.toString());
  myDuplex.write(data);
});

// 结束流
myDuplex.end();

```

---
## duplexer2

```js

const { Readable, Writable } = require('stream');
const duplexer2 = require('duplexer2');

// 创建一个可读流
const input = new Readable({
  read() {
    this.push('hello');
    this.push(null);
  },
});

// 创建一个可写流
const output = new Writable({
  write(chunk, enc, cb) {
    console.log(chunk.toString().trim());
    cb();
  },
});

// 将可读流和可写流组合成双工流
const duplex = duplexer2(output, input);

// 从双工流中读取数据
duplex.on('data', data => console.log(data.toString().trim()));

// 向双工流中写入数据
duplex.write('world');

// 结束双工流
duplex.end();

```


---



---
## 流的使用经验总结

[流的使用经验总结-传送门](/study/n-nodejs/2-stream/%E6%B5%81%E7%9A%84%E4%BD%BF%E7%94%A8%E7%BB%8F%E9%AA%8C.md)



