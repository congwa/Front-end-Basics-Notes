# 如何使用SSL/TLS加密保护NGINX和TCP上游服务器之间的通信

这篇文章介绍了如何在 NGINX 和 TCP 上游服务器或多个 TCP 服务器的上游组之间，通过 SSL/TLS 加密来保护 TCP 流量的通信过程。

## 先决条件

要使用本文中所述的方法，需要满足以下条件：

- 安装 NGINX Plus R6 或更高版本，或者安装最新版本的 NGINX Open Source，并使用 --with-stream 和 with-stream_ssl_module 配置参数进行编译。
- 配置一个代理 TCP 服务器或一个 TCP 上游服务器组。
- 准备 SSL 证书和私钥。

## 获取 SSL 服务器证书

首先，您需要获得服务器证书和私钥并将它们放在上游服务器上或每个上游组中的每个服务器上。可以通过向受信任的证书颁发机构 (CA) 获得证书或使用 OpenSSL 等 SSL 库生成自签名服务器证书来获取证书。

当您需要加密 NGINX 和上游服务器之间的连接时，可以使用自签名服务器证书。然而，这种连接容易受到中间人攻击的影响，即攻击者可以冒充上游服务器，而 NGINX 并不知道自己正在与一个假服务器通讯。如果您获得了由受信任的 CA 签发的服务器证书（可以使用 OpenSSL 创建自己的内部 CA），则可以配置 NGINX 仅信任由该 CA 签名的证书。这样就更难让攻击者冒充上游服务器。

## 获取 SSL 客户端证书

NGINX 可以使用 SSL 客户端证书来向上游服务器标识自己。这个客户端证书必须由一个受信任的 CA 签名，并与相应的私钥一起存储在 NGINX 上。

您需要配置上游服务器要求所有传入的 SSL 连接使用客户端证书，并信任签发 NGINX 客户端证书的 CA。然后，当 NGINX 连接到上游时，它将提供其客户端证书，而上游服务器将接受它。

## 配置 NGINX

在 NGINX 配置文件的流块 server 中，包括 proxy_ssl 指令：

```ng
stream {
    server {
        ...
        proxy_pass backend;
        proxy_ssl  on;
    }
}
```

然后指定所需的 SSL 客户端证书的路径以及证书的私钥：

```ng
server {
        ...
        proxy_ssl_certificate     /etc/ssl/certs/backend.crt;
        proxy_ssl_certificate_key /etc/ssl/certs/backend.key;
}
```

可以选择指定使用的 SSL 协议和密码：

```ng
server {
        ...
        proxy_ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        proxy_ssl_ciphers   HIGH:!aNULL:!MD5;
}
```

如果您使用由 CA 签发的证书，请还包括 proxy_ssl_trusted_certificate 指令，以指定用于验证上游安全证书的受信任 CA 证书文件的名称。文件必须采用 PEM 格式。还可以选择包括 proxy_ssl_verify 和 proxy_ssl_verfiy_depth 指令，使 NGINX 检查安全证书的有效性：

```ng
server {
    ...
    proxy_ssl_trusted_certificate /etc/ssl/certs/trusted_ca_cert.crt;
    proxy_ssl_verify       on;
    proxy_ssl_verify_depth 2;
}
```

每个新的 SSL 连接都需要客户端和服务器之间进行完整的 SSL 握手，这相当消耗 CPU。为了使 NGINX 可以代理之前协商的连接参数并使用所谓的缩写握手，可以包括 proxy_ssl_session_reuse 指令：

```ng
proxy_ssl_session_reuse on;
```

## 完整示例

```ng
stream {

    upstream backend {
        server backend1.example.com:12345;
        server backend2.example.com:12345;
        server backend3.example.com:12345;
   }

    server {
        listen     12345;
        proxy_pass backend;
        proxy_ssl  on;

        proxy_ssl_certificate         /etc/ssl/certs/backend.crt;
        proxy_ssl_certificate_key     /etc/ssl/certs/backend.key;
        proxy_ssl_protocols           TLSv1 TLSv1.1 TLSv1.2;
        proxy_ssl_ciphers             HIGH:!aNULL:!MD5;
        proxy_ssl_trusted_certificate /etc/ssl/certs/trusted_ca_cert.crt;

        proxy_ssl_verify        on;
        proxy_ssl_verify_depth  2;
        proxy_ssl_session_reuse on;
    }
}
```

在此示例中，proxy_ssl 指令指定将通过 NGINX 转发到上游服务器的 TCP 流量进行安全保护。

当第一次将安全 TCP 连接从 NGINX 传递到上游服务器时，将执行完整的握手过程。上游服务器要求 NGINX 提供 proxy_ssl_certificate 指令中指定的安全证书。proxy_ssl_protocols 和 proxy_ssl_ciphers 指令控制使用哪些协议和密码。

下一次 NGINX 将连接传递到上游时，由于有了 proxy_ssl_session_reuse 指令，会重用会话参数，并且可更快地建立安全的 TCP 连接。

proxy_ssl_trusted_certificate 指令中命名的受信任 CA 证书文件上的受信任 CA 证书用于验证上游服务器上的证书。proxy_ssl_verify_depth 指令指定检查证书链中的两个证书，而 proxy_ssl_verify 指令验证证书的有效性。
