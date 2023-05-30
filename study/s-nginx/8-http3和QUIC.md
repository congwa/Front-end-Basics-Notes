# NGINX支持QUIC和HTTP/3协议

NGINX从版本1.25.0开始支持QUIC和HTTP/3协议，并且这个功能仍然处于实验阶段，存在一定的风险。在编译NGINX时需要使用提供QUIC支持的SSL库，例如BoringSSL、LibreSSL或QuicTLS。

可以使用`./configure`命令配置NGINX以启用QUIC和HTTP/3，同时也可以配置其他参数，如地址验证，0-RTT和GSO等。

```nginx
# 启用地址验证
quic_retry on;

# 要启用 0-RTT
ssl_early_data on;

# 启用 GSO（通用分段卸载）- 默认情况下，禁用 GSO Linux 特定的优化。如果相应的网络接口配置为支持 GSO，请启用它
quic_gso on;

# 为各种令牌设置主机密钥

quic_host_key <filename>;

```

QUIC 需要在 [ssl_protocols](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_protocols) 指令中默认启用的 TLSv1.3 协议版本。


在配置文件中，可以使用`listen`指令的新参数`quic`来启用HTTP/3 over QUIC。除了`quic`参数外，还可以指定`reuseport`参数以使其与多个工作程序一起正常工作。

建议使用相同的端口号(如8443)来监听`quic`和`https`请求，以提高浏览器的兼容性。在调试方面，建议检查SSL库是否正确配置、使用调试日志进行排错，并启用额外的调试宏。

## 配置示例

```nginx
http {
    log_format quic '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" "$http3"';

    access_log logs/access.log quic;

    server {
        listen 8443 quic reuseport;
        listen 8443 ssl;

        ssl_certificate     certs/example.com.crt;
        ssl_certificate_key certs/example.com.key;

        location / {
            # 用于告知浏览器使用当前页面的主机和端口号来进行QUIC连接，以便后续的请求可以直接使用QUIC协议进行传输，而不需要使用TCP。其中，h3=":8443"表示使用HTTP/3 # over QUIC协议进行传输，:8443表示使用当前页面的端口号进行传输。ma参数表示提示浏览器可以缓存这个Alt-Svc头信息的时间，单位是秒，在这个时间内，浏览器将使用这个信息来建立连接。
            add_header Alt-Svc 'h3=":8443"; ma=86400';
        }
    }
}
```

## 排错提示

* 确保nginx使用正确版本的SSL库  （nginx -V 显示它当前使用的是什么）
* 确保客户端实际上是通过QUIC发送请求
* 使用调试日志进行排错， 它应该包含有关连接及其失败原因的所有详细信息。所有相关消息都包含“ quic ”前缀，可以轻松过滤掉。
* 启用额外的调试宏进行更深入的调查
  
    ```bash
    ./configure
    --with-http_v3_module
    --with-debug
    --with-cc-opt="-DNGX_QUIC_DEBUG_PACKETS -DNGX_QUIC_DEBUG_CRYPTO"
    ```