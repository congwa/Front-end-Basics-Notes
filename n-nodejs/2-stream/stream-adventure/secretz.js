
/**
 

一个加密的、gzip 压缩的 tar 文件将通过管道传输到 process.stdin。为了克服这一挑战，对于 tar 输入中的每个文件，打印文件内容的十六进制编码的 md5 哈希，后跟一个空格，后跟文件路径，然后是换行符。

您将收到密码算法名称 process.argv[2]、密码密钥 process.argv[3] 和密码初始化向量 process.argv[4]。您可以将这些参数直接传递给 crypto.createDecipheriv() 。

来自 npm 的 tar 模块有一个 tar.Parse() 构造函数，它可以自动解压缩 gzipped tar 文件（如果检测到）并为 tar 输入中的每个文件发出 entry 事件。

每个 entry 对象都是来自存档的文件内容的可读流，并且：

`entry.type` is the kind of file ('File', 'Directory', etc)
`entry.path` is the file path

使用 tar 模块如下所示：

const tar = require('tar')
const parser = new tar.Parse()
parser.on('entry', function (e) {
    console.dir(e)
});
const fs = require('fs')
fs.createReadStream('file.tar').pipe(parser)

使用 crypto.createHash('md5', { encoding: 'hex' }) 生成一个流，输出写入内容的十六进制 md5 散列。

concat-stream 模块可用于连接所有流数据


 */

const crypto = require('crypto')
const tar = require('tar')
const concat = require('concat-stream')

// 创建一个 tar 解析器对象
const parser = new tar.Parse()

// 监听 entry 事件，当遇到压缩包中的文件时触发
parser.on('entry', function (e) {
  // 只处理类型为 File 的文件
  if (e.type !== 'File') return e.resume()

  // 创建一个 md5 哈希计算器
  const h = crypto.createHash('md5', { encoding: 'hex' })

  // 将当前文件流通过哈希计算器，最后将计算出来的哈希值与文件路径一起输出
  e.pipe(h).pipe(concat(function (hash) {
    console.log(hash + ' ' + e.path)
  }))
})

// 获取命令行参数
const cipher = process.argv[2]  // 加密算法
const key = process.argv[3]     // 密钥
const iv = process.argv[4]      // 初始化向量

// 将输入流通过解密器、tar 解析器依次进行解密和解压缩，并捕获解析器发出的 entry 事件
process.stdin
  .pipe(crypto.createDecipheriv(cipher, key, iv)) // 使用给定的加密算法、密钥、初始化向量创建一个解密器
  .pipe(parser)                                   // 将解密后的数据流通过 tar 解压缩