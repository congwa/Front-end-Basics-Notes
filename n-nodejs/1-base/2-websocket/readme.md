# websocket


本文实现结果
![websocket_demo](/study/imgs/websocket_demo.png)


## 实现思路


![协议内容](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7c0858debd3d456f9280491f8bd0183b~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)



WebSocket 是基于 TCP 协议之上的应用层协议。它提供双向通信，通过一个初始 HTTP 请求和响应建立连接，然后使用自定义的数据帧来发送和接收数据

实现 WebSocket 的基本流程：

- 创建一个 HTTP 服务器，用于监听 WebSocket 连接。
- 监听客户端发来的升级请求（upgrade 请求），进行响应建立 WebSocket 连接
- 在服务器中增加 upgrade 事件处理函数，用于处理升级请求，并在成功响应后建立 WebSocket 连接。
  - 监听 upgrade 事件，当客户端发起升级请求时触发此事件；
  - 在 upgrade 事件处理函数中，获取到客户端的请求对象 req 和套接字对象 socket；
  - 将 socket 对象保存在 MyWebsocket 实例的属性中，以便后续使用；
  - 给客户端发送响应，告诉客户端升级请求已经成功处理，并且协议已经从 HTTP 转为 WebSocket 协议；
  - 监听 socket 的 data 事件和 close 事件，分别用于处理客户端发送的 WebSocket 数据和关闭连接的事件。
- 对接收到的数据帧进行掩码解密处理，解析出操作码和数据。并根据不同编码方式将数据进行解析并返回给客户端。


实现细节
- 首先，将 socket 对象保存在 MyWebsocket 实例的属性中，这里使用了 this.socket = socket; 将其赋值给 MyWebsocket 实例的 socket 属性。
- 其次，设置该 socket 对象为长连接，以确保连接不会因为长时间没有交互而被服务器断开。这里使用了 socket.setKeepAlive(true); 方法来设置。
- 然后，生成 WebSocket 握手响应报文中的 Sec-WebSocket-Accept 校验 key，使用 hashKey(req.headers['sec-websocket-key']) 方法生成 Sec-WebSocket-Accept 值，并在响应头中返回给客户端，以确认升级请求已被成功处理。
- 最后，监听 socket 的 data 事件和 close 事件，分别用于处理客户端发送的 WebSocket 数据和关闭连接的事件。在 data 事件中，使用 processData(data) 方法处理接收到的 WebSocket 数据；在 close 事件中，使用 emit('close') 方法向客户端发送关闭连接的事件。

注意： Socket运行在应用层和传输层之间，它为我们提供了一组标准的接口，使得我们可以通过网络发送和接收数据。Socket是一种通信套接字，用于在网络上进行进程间通信，是计算机网络编程的基本操作单元。Socket提供了一组标准的接口，使得应用程序可以通过网络进行数据的传输，并且它包含有网络地址和端口号等信息。


## 参考资料

[用 Node.js 手写 WebSocket 协议](https://juejin.cn/post/7197714333475979322)