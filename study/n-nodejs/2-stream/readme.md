# 流

## 流的使用经验总结

[流的使用经验总结](/study/n-nodejs/2-stream/%E6%B5%81%E7%9A%84%E4%BD%BF%E7%94%A8%E7%BB%8F%E9%AA%8C.md)

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

### pipe 方法

pipe 方法允许您将可读流的输出连接为可写流的输入

```js
readable.pipe(writable)
```

如果您通过管道传输到双工流中，您可以链接到其他流。

```js
readable.pipe(duplex).pipe(writable)

```



