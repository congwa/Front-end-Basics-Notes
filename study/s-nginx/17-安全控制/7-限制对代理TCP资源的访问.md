# 限制代理 TCP 资源的访问

通过限制客户端的 IP 地址或其他变量，可以保护上游 TCP 应用程序服务器，限制连接数或带宽。本章提供了限制数据库或媒体服务器访问的场景。

## 通过 IP 地址限制访问

NGINX 可以基于客户端计算机的特定 IP 地址或 IP 地址范围来允许或拒绝访问。使用 `allow` 和 `deny` 指令在 `stream` 上下文或服务器块内部允许或拒绝访问：

```nginx
stream {
    #...
    server {
        listen 12345;
        deny   192.168.1.2;
        allow  192.168.1.1/24;
        allow  2001:0db8::/32;
        deny   all;
    }
}
```

规则按顺序从顶部到底部处理：如果序列中的第一个指令是 `deny all`，则所有后续的 `allow` 指令都无效。在此示例中，允许使用子网 `192.168.1.1/24` 访问，但排除了 `192.168.1.2` 的访问。还允许 IPv6 地址范围 `2001:0db8::/32`，拒绝访问任何其他 IP 地址。

## 限制 TCP 连接数

可以限制来自一个 IP 地址的同时 TCP 连接数。这对于防止拒绝服务（DoS）攻击很有用。

首先，在 `stream` 上下文中使用 `limit_conn_zone` 指令定义将存储到一个服务器的最大 TCP 连接数区域和标识连接的键：

```nginx
stream {
    #...
    limit_conn_zone $binary_remote_addr zone=ip_addr:10m;
    #...
}
```

标识连接的键为 `$binary_remote_addr`，表示客户端的 IP 地址以二进制格式表示。共享内存区域的名称为 `ip_addr`，区域大小为 10 兆字节。

定义区域后，使用 `limit_conn` 指令限制连接。它的第一个参数指定了之前由 `limit_conn_zone` 定义的共享内存区域的名称。作为第二个参数，指定每个 IP 地址允许的最大连接数，在 `stream` 上下文或服务器块中（就像以下示例中一样，它还显示了先决条件 `limit_conn_zone` 指令）：

```nginx
stream {
    #...
    limit_conn_zone $binary_remote_addr zone=ip_addr:10m;

    server {
        #...
        limit_conn ip_addr 1;
    }
}
```

在限制每个 IP 地址的连接数时，请注意，多个位于网络地址转换（NAT）设备后面的主机共享同一个 IP 地址。

## 限制带宽

可以配置 TCP 连接的最大下载或上传速度。包括 `proxy_download_rate` 或 `proxy_upload_rate` 指令：

```nginx
server {
    #...
    proxy_download_rate 100k;
    proxy_upload_rate   50k;
}
```

此设置可以使客户端通过单个连接以最大速度每秒下载 100KB 的数据，并通过单个连接以最大速度每秒上传 50KB 的数据。但是，客户端可以打开多个连接。因此，如果目标是限制每个客户端的整体加载速度，则必须像上一节中描述的那样将连接数限制为 1。

```nginx
stream {
    #...
    limit_conn_zone $binary_remote_addr zone=ip_addr:10m;

    server {
        #...
        limit_conn ip_addr  1;
        proxy_download_rate 100k;
        proxy_upload_rate   50k;
    }
}
```


