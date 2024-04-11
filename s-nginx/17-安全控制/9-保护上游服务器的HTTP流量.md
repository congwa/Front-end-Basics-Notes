# 加密NGINX和上游服务器之间的HTTP流量

本文介绍如何使用SSL/TLS加密NGINX和上游组或代理服务器之间的HTTP流量。

## 先决条件

- NGINX Open Source或NGINX Plus
- 一个代理服务器或一个上游服务器组
- SSL证书和私钥

## 获取SSL服务器证书

您可以从受信任的证书颁发机构（CA）购买服务器证书，或者使用OpenSSL库创建自己的内部CA并生成自己的证书。服务器证书和私钥应放置在每个上游服务器上。

## 获取SSL客户端证书

NGINX将使用SSL客户端证书来识别自己与上游服务器之间的连接。此客户端证书必须由受信任的CA签名，并与相应的私钥一起在NGINX上配置。

您还需要配置上游服务器以要求所有传入的SSL连接使用客户端证书，并信任颁发NGINX客户端证书的CA。然后，当NGINX连接到上游时，它将提供其客户端证书，并且上游服务器将接受它。

## 配置NGINX

首先，在代理_pass指令中将URL更改为支持SSL连接的上游组。在NGINX配置文件中，为代理服务器或上游组中的"https"协议指定：

```nginx
location /upstream {
    proxy_pass https://backend.example.com;
}
```

使用proxy_ssl_certificate和proxy_ssl_certificate_key指令在每个上游服务器上添加将用于验证NGINX身份的客户端证书和密钥：

```nginx
location /upstream {
    proxy_pass                https://backend.example.com;
    proxy_ssl_certificate     /etc/nginx/client.pem;
    proxy_ssl_certificate_key /etc/nginx/client.key;
}
```

如果您对上游服务器使用自签名证书或自己的CA，请还包括proxy_ssl_trusted_certificate。该文件必须采用PEM格式。可选地，还可以包括proxy_ssl_verify和proxy_ssl_verfiy_depth指令以让NGINX检查安全证书的有效性：

```nginx
location /upstream {
    #...
    proxy_ssl_trusted_certificate /etc/nginx/trusted_ca_cert.crt;
    proxy_ssl_verify       on;
    proxy_ssl_verify_depth 2;
    #...
}
```

每个新的SSL连接都需要完成完整的SSL握手过程，这相当消耗CPU资源。为了让NGINX代理预先协商的连接参数并使用所谓的缩短握手，可以包括proxy_ssl_session_reuse指令：

```nginx
location /upstream {
    #...
    proxy_ssl_session_reuse on;
    #...
}
```

可选地，您可以指定使用哪些SSL协议和密码：

```nginx
location /upstream {
        #...
        proxy_ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        proxy_ssl_ciphers   HIGH:!aNULL:!MD5;
}
```

## 配置上游服务器

每个上游服务器都应配置为接受HTTPS连接。对于每个上游服务器，使用ssl_certificate和ssl_certificate_key指令指定服务器证书和私钥的路径：

```nginx
server {
    listen              443 ssl;
    server_name         backend1.example.com;

    ssl_certificate     /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/certs/server.key;
    #...

    location /yourapp {
        proxy_pass http://url_to_app.com;
        #...
    }
}
```

使用ssl_client_certificate指令指定客户端证书的路径：

```nginx
server {
    #...
    ssl_client_certificate /etc/ssl/certs/ca.crt;
    ssl_verify_client      optional;
    #...
}
```

## 完整示例

```nginx
http {
    #...
    upstream backend.example.com {
        server backend1.example.com:443;
        server backend2.example.com:443;
    }

    server {
        listen      80;
        server_name www.example.com;
        #...

        location /upstream {
            proxy_pass                    https://backend.example.com;
            proxy_ssl_certificate         /etc/nginx/client.pem;
            proxy_ssl_certificate_key     /etc/nginx/client.key;
            proxy_ssl_protocols           TLSv1 TLSv1.1 TLSv1.2;
            proxy_ssl_ciphers             HIGH:!aNULL:!MD5;
            proxy_ssl_trusted_certificate /etc/nginx/trusted_ca_cert.crt;

            proxy_ssl_verify        on;
            proxy_ssl_verify_depth  2;
            proxy_ssl_session_reuse on;
        }
    }

    server {
        listen      443 ssl;
        server_name backend1.example.com;

        ssl_certificate        /etc/ssl/certs/server.crt;
        ssl_certificate_key    /etc/ssl/certs/server.key;
        ssl_client_certificate /etc/ssl/certs/ca.crt;
        ssl_verify_client      optional;

        location /yourapp {
            proxy_pass http://url_to_app.com;
        #...
        }
    }

    server {
        listen      443 ssl;
        server_name backend2.example.com;

        ssl_certificate        /etc/ssl/certs/server.crt;
        ssl_certificate_key    /etc/ssl/certs/server.key;
        ssl_client_certificate /etc/ssl/certs/ca.crt;
        ssl_verify_client      optional;

        location /yourapp {
            proxy_pass http://url_to_app.com;
        #...
        }
    }
}
```

在此示例中，proxy_pass指令中的"https"协议指定了由NGINX转发到上游服务器的流量是安全的。

当NGINX将安全连接第一次传递到上游服务器时，会执行完整的握手过程。proxy_ssl_certificate指令定义了上游服务器需要的PEM格式证书的位置，proxy_ssl_certificate_key指令定义了证书的私钥的位置，而proxy_ssl_protocols和proxy_ssl_ciphers指令则控制使用哪些协议和密码。

下次NGINX将连接传递给上游服务器时，会重用会话参数，因为有了proxy_ssl_session_reuse指令，安全连接建立得更快。

proxy_ssl_trusted_certificate指令中的可信CA证书用于验证上游证书。proxy_ssl_verify_depth指令指定了检查的证书链中的两个证书，而proxy_ssl_verify指令则验证证书的有效性。