# http/1.1

1997年发布， web2.0的时代

http/1.1相比http/1.0增加一个持久连接的概念 请求Connection: keep-alive  响应Proxy-Connection: keep-alive

1. 有线头阻塞的问题 head of line blocking 流水线头部阻塞，http的线头阻塞
    - 浏览器通常保持6个左右的链接
  > tcp协议要求必须按照发送的顺序达到接收端。
 
1. http标头冗余问题 头部总是有重复内容



TODO: 