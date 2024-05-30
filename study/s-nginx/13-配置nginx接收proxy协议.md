# NGINX接收PROXY协议

本文介绍如何配置NGINX和NGINX Plus以接受PROXY协议，将负载均衡器或代理的IP地址重写为PROXY协议头中接收到的IP地址，配置简单的客户端IP地址日志记录，并启用NGINX和TCP上游服务器之间的PROXY协议。

## 介绍

PROXY协议使得NGINX和NGINX Plus能够接收通过代理服务器和负载均衡器（如HAproxy和Amazon Elastic Load Balancer（ELB））传递的客户端连接信息。

利用PROXY协议，NGINX可以从HTTP、SSL、HTTP/2、SPDY、WebSocket和TCP中获取客户端请求的原始IP地址。了解客户端请求的原始IP地址可以用于在网站上设置特定语言、保持IP地址的拒绝列表，或者仅仅用于日志记录和统计目的。

通过PROXY协议传递的信息包括客户端IP地址、代理服务器IP地址以及两个端口号。

使用这些数据，NGINX可以通过以下几种方式获取客户端的原始IP地址：

- 使用$proxy_protocol_addr和$proxy_protocol_port变量来捕获原始客户端IP地址和端口。$remote_addr和$remote_port变量用于捕获负载均衡器的IP地址和端口。
- 使用RealIP模块来重写$remote_addr和$remote_port变量中的值，将负载均衡器的IP地址和端口替换为原始客户端的IP地址和端口。$realip_remote_addr和$realip_remote_port变量保留负载均衡器的地址和端口，而$proxy_protocol_addr和$proxy_protocol_port变量仍然保留原始客户端的IP地址和端口。

## 先决条件

- 接受PROXY协议v2，需要NGINX Plus R16或更高版本，或者NGINX Open Source 1.13.11或更高版本。
- 接受HTTP的PROXY协议，需要NGINX Plus R3或更高版本，或者NGINX Open Source 1.5.12或更高版本。
- 对于TCP客户端的PROXY协议支持，需要NGINX Plus R7或更高版本，或者NGINX Open Source 1.9.3或更高版本。
- 接受TCP的PROXY协议，需要NGINX Plus R11或更高版本，或者NGINX Open Source 1.11.4或更高版本。
- 在NGINX Open Source中，默认不包括HTTP和Stream TCP的RealIP模块。请参阅安装NGINX Open Source获取详细信息。在NGINX Plus中不需要额外的步骤。

## 配置NGINX接收PROXY协议

要配置NGINX接受PROXY协议头，请在http {}或stream {}块中的server块中的listen指令中添加proxy_protocol参数。

```nginx
http {
    #...
    server {
        listen 80   proxy_protocol;
        listen 443  ssl proxy_protocol;
        #...
    }
}
   
stream {
    #...
    server {
        listen 12345 proxy_protocol;
        #...
    }
}
```

现在可以使用$proxy_protocol_addr和$proxy_protocol_port变量来获取客户端IP地址和端口，还可以配置HTTP和Stream RealIP模块将负载均衡器中的IP地址替换为客户端的IP地址和端口。

## 更改负载均衡器的IP地址为客户端的IP地址

可以使用HTTP和Stream RealIP模块将负载均衡器或TCP代理的地址替换为从PROXY协议中接收到的客户端IP地址。这可以通过以下步骤完成：

1. 确保已经配置NGINX接受PROXY协议头。请参阅配置NGINX接受PROXY协议。
2. 确保NGINX安装中包含HTTP和Stream Real‑IP模块：

    ```bash
    nginx -V 2>&1 | grep -- 'http_realip_module'
    nginx -V 2>&1 | grep -- 'stream_realip_module'
    ```

    如果没有，请重新编译带有这些模块的NGINX。有关详细信息，请参阅安装 NGINX Open Source。 NGINX Plus 不需要额外的步骤。
3. 在 HTTP、Stream 或两者的 set_real_ip_from 指令中，指定 TCP 代理或负载平衡器的 IP 地址或地址的 CIDR 范围：
   
   ```nginx
      server {
        #...
        set_real_ip_from 192.168.1.0/24;
      #...
    }
   ```

4. 在 http {} 上下文中，通过将 proxy_protocol 参数指定给 real_ip_header 指令，将负载均衡器的 IP 地址更改为从 PROXY 协议标头接收到的客户端 IP 地址：

  ```nginx
  http {
      server {
          #...
          real_ip_header proxy_protocol;
        }
  }
  ```

## 记录原始 IP 地址

当你知道客户端的原始IP地址时，你可以配置正确的日志记录方式：

对于HTTP，使用`$proxy_protocol_addr`变量和`proxy_set_header`指令，配置NGINX将客户端IP地址传递给上游服务器：

```nginx
http {
    proxy_set_header X-Real-IP       $proxy_protocol_addr;
    proxy_set_header X-Forwarded-For $proxy_protocol_addr;
}
```

将`$proxy_protocol_addr`变量添加到`log_format`指令中，以便在日志中记录原始IP地址（HTTP或Stream）：

在`http`块中：

```nginx
http {
    #...
    log_format combined '$proxy_protocol_addr - $remote_user [$time_local] '
                        '"$request" $status $body_bytes_sent '
                        '"$http_referer" "$http_user_agent"';
}
```

在`stream`块中：

```nginx
stream {
    #...
    log_format basic '$proxy_protocol_addr - $remote_user [$time_local] '
                      '$protocol $status $bytes_sent $bytes_received '
                      '$session_time';
}
```


### X-Real-IP和X-Forwarded-For

X-Real-IP和X-Forwarded-For是HTTP请求头，用于在代理服务器上记录客户端的真实IP地址。当HTTP请求通过负载均衡器或反向代理服务器时，它们将被添加到HTTP请求头中，以便后续的服务器可以了解客户端的原始IP地址。

X-Real-IP：用于通过代理服务器传递客户端的真实IP地址。当NGINX作为反向代理服务器时，可以使用$proxy_protocol_addr变量和proxy_set_header指令向上游服务器传递该IP地址。

X-Forwarded-For：用于在多个代理服务器上跟踪客户端请求。每个代理服务器将自己的IP地址追加到该请求头中，形成一个逗号分隔的IP地址列表。在NGINX配置中，可以使用$http_x_forwarded_for变量获取该列表，并使用字符串操作（例如split函数）获取客户端的真实IP地址。

需要注意的是，由于HTTP请求头是可伪造的，因此应该谨慎使用这些请求头来验证客户端的真实IP地址。通常建议在安全设置中使用更强大的方法，例如基于TLS/SSL的客户端身份验证。



## 用于上游 TCP 连接的代理协议

可以通过启用 PROXY 协议，为 NGINX 和上游服务器之间的 TCP 连接提供代理支持。在 stream {} 级别的 server 块中，使用 proxy_protocol 指令来启用 PROXY 协议：

```nginx
stream {
    server {
        listen 12345;
        proxy_pass example.com:12345;
        proxy_protocol on;
    }
}
```



例如：

```nginx
http {
    log_format combined '$proxy_protocol_addr - $remote_user [$time_local] '
                        '"$request" $status $body_bytes_sent '
                        '"$http_referer" "$http_user_agent"';
    #...

    server {
        server_name localhost;

        listen 80   proxy_protocol;
        listen 443  ssl proxy_protocol;

        ssl_certificate      /etc/nginx/ssl/public.example.com.pem;
        ssl_certificate_key  /etc/nginx/ssl/public.example.com.key;

        location /app/ {
            proxy_pass       http://backend1;
            proxy_set_header Host            $host;
            proxy_set_header X-Real-IP       $proxy_protocol_addr;
            proxy_set_header X-Forwarded-For $proxy_protocol_addr;
        }
    }
}
 
stream {
    log_format basic '$proxy_protocol_addr - $remote_user [$time_local] '
                     '$protocol $status $bytes_sent $bytes_received '
                     '$session_time';
    #...
    server {
        listen              12345 ssl proxy_protocol;

        ssl_certificate     /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/cert.key;

        proxy_pass          backend.example.com:12345;
        proxy_protocol      on;
    }
}
```

上述示例假设有一个负载均衡器（例如 Amazon ELB）位于 NGINX 前面，处理所有传入的 HTTPS 流量。NGINX 在端口 443 上接受 HTTPS 流量，在端口 12345 上接受 TCP 流量，并从负载均衡器通过 PROXY 协议获取客户端的 IP 地址（该参数在 http {} 和 stream {} 块的 listen 指令中使用 proxy_protocol 参数）。

NGINX 终止 HTTPS 流量，然后代理解密数据到后端服务器。
- HTTP 使用 `proxy_pass http://backend1;`，
- TCP 使用 `proxy_pass backend.example.com:12345`。
  
  
可以使用 `proxy_set_header` 指令将客户端的 IP 地址和端口传递到后端服务器。`$proxy_protocol_addr` 变量在 `log_format` 指令中指定，在日志中记录客户端的 IP 地址，适用于 HTTP 和 TCP。

此外，TCP 服务器（即 stream {} 块）还可以将其自己的 PROXY 协议数据发送到其后端服务器（`proxy_protocol on` 指令）。

示例中还提供了一个 HTTP 服务器的配置，其中 `log_format` 指令中的 `$proxy_protocol_addr` 变量也将客户端的 IP 地址传递到日志中，并使用 `proxy_set_header` 指令将客户端的 IP 地址和端口传递到后端服务器。