# 记录到系统日志

error_log 和 access_log 指令支持记录到系统日志。以下参数将日志记录配置为 syslog：

- server=address
    >定义系统日志服务器的地址。地址可以指定为域名或 IP 地址，带有可选端口，或指定为在" unix: "前缀后指定的 UNIX 域套接字路径。如果未指定端口，则使用 UDP 端口 514。如果域名解析为多个 IP 地址，则使用第一个解析的地址。
- facility=string
    >设置 syslog 消息的功能，如 RFC 3164 中所定义。设施可以是" kern "、" user "、" mail "、" daemon "、" auth "、" intern "、" lpr "、"@7"之一#"、" uucp "、" clock "、" authpriv "、" ftp "、" ntp "、" audit "、" alert "、" cron " , " local0 ".." local7 "。默认为" local7 "
- severity=string
    > 为 access_log 设置 syslog 消息的严重性，如 RFC 3164 中所定义。可能的值与 error_log 指令的第二个参数（级别）相同。默认为" info "
    > 错误消息的严重性由 nginx 确定，因此该参数在 error_log 指令中被忽略
- tag=string
    > 设置系统日志消息的标签。默认为" nginx "
- nohostname 
    > 禁用将"主机名"字段添加到系统日志消息标头 (1.9.7)

## 系统日志配置示例

```nginx
error_log syslog:server=192.168.1.1 debug;

access_log syslog:server=unix:/var/log/nginx.sock,nohostname;
access_log syslog:server=[2001:db8::1]:12345,facility=local7,tag=nginx,severity=info combined;

```

从 1.7.1 版本开始可以记录到 syslog。但是作为商业订阅的一部分，系统日志从 1.5.3 版本开始可用。


## combined

combined  是一个 Nginx 日志格式，它包含了比较详细的请求信息。

combined 格式的日志一般包含以下字段：

- $remote_addr：客户端 IP 地址。
- $remote_user：客户端用户名。
- $time_local：本地时间，格式类似于 [06/Jan/2022:08:09:35 +0000]。
- $request：HTTP 请求方法、URI 和协议版本。
- $status：HTTP 响应状态码。
- $body_bytes_sent：发送给客户端的响应正文大小。
- $http_referer：HTTP Referer 头部值。
- $http_user_agent：HTTP User Agent 头部值。

以下是一个应用了 combined 日志格式的 Nginx 配置示例：

```nginx
http {
    log_format  mylog  '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent"';

    server {
        listen       80;
        server_name  example.com;

        access_log   /var/log/nginx/example.com.access.log mylog;

        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }
    }
}

```

在上面的配置中，首先定义了一个名为 mylog 的日志格式，并将它应用到 server 中的access_log 指令。然后，在 server 中的 location 指令下，配置了一个简单的静态文件服务


当你的用户访问了 `http://example.com/hello-world.html` 页面时，应用了 `mylog` 日志格式，将会输出以下的 log 样例：

```nginx
127.0.0.1 - - [31/May/2023:04:28:49 +0000] "GET /hello-world.html HTTP/1.1" 200 1234 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36"
```

其中：

- `$remote_addr` 输出为 `127.0.0.1`，表示客户端的 IP 地址为本地。
- `$remote_user` 和 `-` 都显示为 `-`，表示没有启用基本认证模块。
- `$time_local` 输出为 `[31/May/2023:04:28:49 +0000]`，表示发生时间为 2023 年 5 月 31 日 4 时 28 分 49 秒（UTC+0）。
- `$request` 输出为 `"GET /hello-world.html HTTP/1.1"`，表示客户端发送了 GET 请求，请求的 URI 是 `/hello-world.html`，协议版本是 HTTP/1.1。
- `$status` 输出为 `200`，表示服务器返回了 200 OK 状态码。
- `$body_bytes_sent` 输出为 `1234`，表示服务器返回的响应正文大小为 1234 字节。
- `$http_referer` 输出为 `-`，表示客户端没有在请求中包含 Referer 头部。
- `$http_user_agent` 输出为 `"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36"`，表示客户端使用的是 Chrome 67 浏览器。

