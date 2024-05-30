
/**
 * 
 * 实现一个可读流，从您的实现中启动一个新的流实例并通过管道传输到 process.stdout 。
 * 您将收到要添加到流中的内容作为程序的第一个参数 ( process.argv[2] )。
 */



const { Readable } = require('stream')

class ReadableStream extends Readable {
  _read (size) {
  }
}

const stream = new ReadableStream()
stream.push(process.argv[2])
stream.pipe(process.stdout)