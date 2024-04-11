/**
 * 实现一个写入控制台 writing:  + 给定块的可写流 新块通过标准输入发送。
 */


const { Writable } = require('stream');

class MyWritable extends Writable {
  _write(chunk, encoding, callback) {
    console.log(`writing: ${chunk.toString()}`);
    callback();
  }
}

const myWritable = new MyWritable();

process.stdin.pipe(myWritable);