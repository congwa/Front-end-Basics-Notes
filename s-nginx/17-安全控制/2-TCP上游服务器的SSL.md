# SSL Termination对于TCP上游服务器

SSL Termination 意味着NGINX Plus作为客户端连接的服务器端SSL终端点：它执行请求的解密和后端服务器本来需要做的响应加密。这个操作被称为 Termination，因为NGINX Plus关闭客户端连接并将客户端数据通过一个新创建的未加密连接转发到上游组中的服务器。在R6版本及更高版本中，NGINX Plus执行SSL Termination TCP连接以及HTTP连接。

## 先决条件

- NGINX Plus R6或更高版本
- 一个负载均衡的上游群组，具有多个TCP服务器
- SSL证书和私钥（获取或自动生成）

## 获取SSL证书

首先，您需要获取服务器证书和私钥，并将它们放在服务器上。证书可以从受信任的证书颁发机构（CA）获取，也可以使用SSL库（如OpenSSL）生成。

## 配置NGINX Plus

要配置SSL Termination，将以下指令添加到NGINX Plus配置中：

## 启用SSL

要启用SSL，请为传递到上游服务器组的TCP服务器指定listen指令的ssl参数：

```nginx
stream {

    server {
        listen     12345 ssl;
        proxy_pass backend;
        #...
    }
}
```

## 添加SSL证书

要添加SSL证书，请使用ssl_certificate指令指定证书路径（必须为PEM格式），并在ssl_certificate_key指令中指定私钥路径：

```nginx
server {
    #...
    ssl_certificate        /etc/ssl/certs/server.crt;
    ssl_certificate_key    /etc/ssl/certs/server.key;
}
```

此外，可以使用ssl_protocols和ssl_ciphers指令来限制连接并仅包括SSL/TLS的强版本和密码：

```nginx
server {
    #...
    ssl_protocols  TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers    HIGH:!aNULL:!MD5;
}
```

ssl_ciphers指令告诉NGINX向SSL库提供其喜欢的密码。

## 加快安全TCP连接

实施SSL/TLS可能会极大地影响服务器性能，因为SSL握手操作（客户端和服务器交换以验证连接是否可信的一系列消息）是相当CPU密集的。SSL握手的默认超时时间为60秒，可以使用`ssl_handshake_timeout`指令重新定义。我们建议不要将此值设置得太低或太高，否则可能会导致握手失败或等待握手完成的时间过长。

```nginx
server {
    #...
    ssl_handshake_timeout 10s;
}
```

## 优化SSL会话缓存

创建一个缓存会话参数的缓存减少了握手次数，因此可以显着提高性能。使用ssl_session_cache指令设置缓存：

```nginx
ssl_session_cache;
```

默认情况下，NGINX Plus使用会话缓存的内置类型，这意味着缓存内置于SSL库中。这并不是最优的，因为这样的缓存只能由一个工作进程使用，并可能导致内存碎片化。将ssl_session_cache指令设置为shared，以便在所有工作进程之间共享缓存，从而加速后来的连接，因为连接设置信息已知：

```nginx
ssl_session_cache shared:SSL:1m;
```

作为参考，1MB的共享缓存可以容纳大约4,000个会话。

默认情况下，NGINX Plus保留缓存的会话参数5分钟。将ssl_session_timeout值增加到几个小时可以提高性能，因为重用缓存的会话参数减少了耗时的握手次数。当您增加超时时间时，需要更大的缓存来容纳所得到的更多的缓存参数。对于以下示例中的4小时超时，20MB的缓存是合适的：

```nginx
ssl_session_timeout 4h;
```

如果超时长度增加，则需要一个更大的缓存来存储会话，例如20MB：

```nginx
server {
    #...
    ssl_session_cache   shared:SSL:20m;
    ssl_session_timeout 4h;
}
```

这些行将创建一个20MB的内存缓存来存储会话信息，并指示NGINX Plus在添加会话参数后4小时内重用会话参数。

## Session Tickets

Session Tickets是会话缓存的替代方法。会话信息存储在客户端端，无需服务器端缓存存储会话信息。当客户端恢复与后端服务器的交互时，它会呈现会话令牌，不需要重新协商。将ssl_session_tickets指令设置为on：

```nginx
server {
    #...
    ssl_session_tickets on;
}
```

使用Session Tickets对于上游群组，每个上游服务器必须使用相同的会话密钥进行初始化。最佳实践是经常更改会话密钥，我们建议您实现一个机制，以使共享密钥在所有上游服务器之间轮换：

```nginx
server {
    #...
    ssl_session_tickets on;
    ssl_session_ticket_key /etc/ssl/session_ticket_keys/current.key;
    ssl_session_ticket_key /etc/ssl/session_ticket_keys/previous.key;
}
```

## 完整示例

```nginx
stream {
    upstream stream_backend {
         server backend1.example.com:12345;
         server backend2.example.com:12345;
         server backend3.example.com:12345;
    }

    server {
        listen                12345 ssl;
        proxy_pass            stream_backend;

        ssl_certificate       /etc/ssl/certs/server.crt;
        ssl_certificate_key   /etc/ssl/certs/server.key;
        ssl_protocols         SSLv3 TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers           HIGH:!aNULL:!MD5;
        ssl_session_cache     shared:SSL:20m;
        ssl_session_timeout   4h;
        ssl_handshake_timeout 30s;
        #...
     }
}
```

在此示例中， server 块中的指令指示 NGINX Plus Termination和解密来自客户端的安全 TCP 流量，并将其未加密地传递给由三台服务器组成的上游组 stream_backend 。

listen 指令的 ssl 参数指示 NGINX Plus 接受 SSL 连接。当客户端请求安全 TCP 连接时，NGINX Plus 启动握手过程，该过程使用 ssl_certificate 指令指定的 PEM 格式证书、ssl_certificate_key 指令指定的证书私钥以及 ssl_protocols 和 ssl_ciphers 列出的协议和密码指令。

一旦建立了安全的 TCP 连接，NGINX Plus 就会根据 ssl_session_cache 指令缓存会话参数。在示例中，会话缓存在所有工作进程之间共享（ shared 参数），大小为 20 MB（ 20m 参数），并保留每个 SSL 会话以供重用 4 小时（ssl_session_timeout 指令）。

