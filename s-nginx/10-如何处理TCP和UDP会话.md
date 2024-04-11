# TCP/UDP 会话处理阶段

TCP/UDP 会话从客户端传入时，会被按照以下阶段进行连续处理：

## Post-accept

在接受客户端连接后的第一阶段，会调用 `ngx_stream_realip_module` 模块。

## Pre-access

预先检查权限的阶段。在此阶段，会调用 `ngx_stream_limit_conn_module` 和 `ngx_stream_set_module` 模块。

## Access

实际数据处理之前的客户端访问限制的阶段，在此阶段，会调用 `ngx_stream_access_module` 模块，对于 njs，会调用 `js_access` 指令。

## SSL

TLS/SSL 终止阶段，在此阶段，会调用 `ngx_stream_ssl_module` 模块。

## Preread

读取数据的初始字节并放入预读缓冲区，以便模块如`ngx_stream_ssl_preread_module`在处理数据之前分析数据。对于njs，会调用`js_preread`指令。

## Content

实际处理数据的必要阶段，在这个阶段，数据通常会被代理到上游服务器，或者返回给客户端一个指定的值。对于 njs，会调用 `js_filter` 指令。

## Log

最后一个阶段，记录客户端会话处理结果的阶段，在此阶段，会调用 `ngx_stream_log_module` 模块。



## 示例

```nginx

stream {
   # Post-accept 阶段，调用 ngx_stream_realip_module 模块
   real_ip_header X-Forwarded-For;

   # Pre-access 阶段，调用 ngx_stream_limit_conn_module 和 ngx_stream_set_module 模块
   limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;

   server {
      listen 127.0.0.1:80;

      # Access 阶段，调用 ngx_stream_access_module 模块
      access_log /var/log/nginx/access.log;
      allow 192.168.1.0/24;
      deny all;

      # SSL 阶段，调用 ngx_stream_ssl_module 模块
      ssl_certificate     /etc/nginx/ssl/nginx.crt;
      ssl_certificate_key /etc/nginx/ssl/nginx.key;

      # Preread 阶段，调用 ngx_stream_ssl_preread_module 模块
      ssl_preread on;

      # Content 阶段，调用 ngx_stream_upstream_module 模块
      proxy_pass backend;
   }

   # Log 阶段，调用 ngx_stream_log_module 模块
   log_format log '$remote_addr [$time_local] '
                '$protocol $status $bytes_sent $bytes_received '
                '"$upstream_addr" "$upstream_bytes_sent" "$upstream_bytes_received" "$upstream_connect_time"';

   server {
      listen 127.0.0.1:12345;
      access_log /var/log/nginx/access.log log;

      # Content 阶段，调用 njs 模块
      js_filter filter;
   }
}


```