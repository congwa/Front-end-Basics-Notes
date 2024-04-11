/**
 
您的程序将在 process.argv[2] 上获得密码，在 process.argv[3] 上获得初始化值，并且"aes256"加密数据将写入标准输入。

只需解密数据并将结果流式传输到 process.stdout。

您可以使用来自 node core 的 crypto.createDecipheriv() api 来解决这个挑战

不要自己调用 .write() ，只需将 stdin 通过管道传输到您的解密器即可


crypto.createDecipheriv(algorithm, key, iv[, options])

该方法与 createDecipher 方法类似，但是需要传递一个额外的参数 iv，用于初始化解密器

algorithm 参数指定了所使用的对称加密算法,如 AES、DES 等

key 参数则指定了用于加密和解密的密钥；

iv 参数则是一个初始化向量，用于在解密过程中增加随机性。

options 参数可以用于设置解密器的各种选项，例如 padding 模式、输入流编码等
 */

const crypto = require("crypto");

process.stdin
  .pipe(crypto.createDecipheriv("aes256", process.argv[2], process.argv[3]))
  .pipe(process.stdout);
