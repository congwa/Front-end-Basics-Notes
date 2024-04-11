# 限制代理的HTTP资源访问

通过限制客户端IP地址或其他变量，基于每个连接的请求数量、请求速率或带宽使用率，保护您的上游Web和应用程序服务器。

本文详细介绍如何设置连接的最大请求数量或从服务器下载内容的最大速率。

## 引言

使用NGINX和NGINX Plus，可以限制：

- 每个关键值的连接数量（例如每个IP地址）
- 每个关键值的请求速率（允许在一秒钟或一分钟内处理的请求数量）
- 连接的下载速度

请注意，IP地址可能会在NAT设备后共享，因此应谨慎使用按IP地址限制。

## 限制连接数

要限制连接数：

- 使用 `limit_conn_zone` 指令定义键并设置共享内存区域的参数（工作进程将使用此区域来共享键值的计数器）。作为第一个参数，指定作为键计算的表达式。在第二个参数的区域中，指定区域的名称及其大小：

```nginx
limit_conn_zone $binary_remote_addr zone=addr:10m;
```

- 使用 `limit_conn` 指令在 `location {}`、`server {}` 或 `http {}` 上下文中应用限制。将共享内存区域的名称指定为第一个参数，将每个键允许的连接数指定为第二个参数：

```nginx
location /download/ {
     limit_conn addr 1;
}
```

因为使用 `$binary_remote_addr` 变量作为键，所以连接数量是按IP地址限制的。

还有一种限制给定服务器连接数的方法是使用 `$server_name` 变量：

```nginx
http {
    limit_conn_zone $server_name zone=servers:10m;

    server {
        limit_conn servers 1000;
    }
}
```

## 限制请求速率

**速率限制可用于防止DDoS攻击或防止上游服务器在同时处理太多请求时不堪重负。该方法基于漏桶算法**：请求以不同的速率到达桶中，并以固定速率离开桶。

在使用速率限制之前，需要配置"leaky bucket"的全局参数：

- 关键字：用于区分一个客户端和另一个客户端的参数，通常是一个变量。
- 共享内存区域：保存这些键状态（"leaky bucket"）的名称和大小。
- 率：指定每秒请求数（r/s）或每分钟请求数（r/m）的请求速率限制。请求数每分钟用于指定小于每秒一次请求的速率。

使用 `limit_req_zone` 指令设置这些参数。该指令在 `http {}` 级别上定义，这种方法允许将不同的区域和请求溢出参数应用于不同的上下文：

```nginx
http {
    #...
    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
}
```

使用这个配置，创建了一个名为"one"的共享内存区域，大小为10兆字节。该区域保留使用 `$binary_remote_addr` 变量设置的客户端IP地址的状态。请注意，与也包含客户端IP地址的 `$remote_addr` 相比，`$binary_remote_addr` 保存更短的IP地址的二进制表示。

可以使用以下数据计算共享内存区域的最佳大小：IPv4地址的 `$binary_remote_addr` 值大小为4字节，在64位平台上，存储状态占用128字节。因此，大约16,000个IP地址的状态信息占用1兆字节的区域。

当NGINX需要添加新条目时，如果存储被耗尽，它将删除最旧的条目。如果释放空间仍然无法容纳新记录，则NGINX返回状态代码503 Service Unavailable。可以使用 `limit_req_status` 指令重新定义状态代码。

设置了区域后，可以在任何NGINX配置中使用请求限制，并在服务器{}、location {} 或 http {} 上下文中指定限制请求：

```nginx
http {
    #...

    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;

    server {
        #...

        location /search/ {
            limit_req zone=one;
        }
    }
}
```

使用这个配置，NGINX将在/search/位置内处理不超过1个请求每秒。这些请求的处理被延迟，以使总速率不超过指定速率。如果请求数量超过指定速率，NGINX将延迟处理这种请求，直到"桶"（共享内存区域one）充满为止。对于到达完整桶的请求，NGINX将使用503 Service Unavailable错误响应（如果未使用 `limit_req_status` 重新定义）。

## 测试请求速率限制

在配置实际的速率限制之前，可以尝试"dry run"模式，该模式不会限制请求处理速率。但是，这些过多的请求仍然记录在共享内存区域中并进行日志记录。可以通过使用 `limit_req_dry_run` 指令启用"dry run"模式：

```nginx
http {
    #...

    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;

    server {
        #...

        location /search/ {
            limit_req zone=one;
            limit_req_dry_run on;
        }
    }
}
```

超过定义的速率限制的每个请求都将以"干运行"标记记录：

```bash
2019/09/03 10:28:45 [error] 142#142: *13246 limiting requests, dry run, excess: 1.000 by zone "one", client: 172.19.0.1, server: www.example.com, request: "GET / HTTP/1.0", host: "www.example.com:80"
```

## 处理过多的请求

请求的限制是为了适应 `limit_req_zone` 指令中定义的速率。如果请求数量超过指定速率，并且共享内存区域已满，则NGINX将使用错误响应。因为流量倾向于突发性，返回错误以响应客户端请求可能不是最佳情况。

可以缓冲和处理NGINX中的这种过多的请求。`limit_req` 指令的 `burst` 参数设置等待按指定速率处理的过多请求数的最大数量：

```nginx
http {
    #...

    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;

    server {
        #...

        location /search/ {
            limit_req zone=one burst=5;
        }
    }
}
```

使用此配置，如果请求速率超过每秒1个请求，则超出该速率的请求将放入区域one。当该区域满时，超限请求将排队（burst），此队列的大小为5个请求。在队列中的请求处理被延迟，以使整体速率不超过指定速率。超过 `burst` 限制的请求将使用503错误拒绝。

如果不希望在流量突发期间延迟请求，可以添加 `nodelay` 参数：

```nginx
http {
    #...

    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;

    server {
        #...

        location /search/ {
            limit_req zone=one burst=5 nodelay;
        }
    }
}
```

与 `burst` 限制内的过度请求将立即完成处理，而不考虑指定的速率，超过 `burst` 限制的请求将使用503错误拒绝。

## 延迟过多的请求处理

另一种处理过多请求的方法是，在服务一定数量的请求后，对超出数量的请求进行速率限制，直到拒绝请求为止。

可以通过 `delay` 和 `burst` 参数来实现。其中，`delay` 参数用于定义超出速率限制的请求需要延迟多长时间才能得到响应：

```nginx
http {
    # ...

    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;

    server {
        # ...

        location /search/ {
            limit_req zone=one burst=5 delay=3;
        }
    }
}
```

在这个配置中，前三个请求（`delay`）会被立即响应，接下来的两个请求（`burst - delay`）会被延迟，以确保整体速率不高于所指定的速率限制值。如果继续有超出速率限制的请求，则会被拒绝，因为总爆发大小已经超过限制。此后的请求将被继续延迟响应。

## 同步多个共享内存区域的内容

如果您的计算机集群拥有多个 NGINX 实例，并且这些实例使用 `limit_req` 方法，则可以在以下条件下同步它们共享内存区域的内容：

- 每个实例都已配置 `zone_sync` 功能；
- 每个实例的 `limit_req_zone` 指令设置了相同名称的共享内存区域；
- 每个实例的 `limit_req_zone` 指令指定了 `sync` 参数：

```nginx
http {
    # ...

    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s sync;
}
```

详情请参见「[集群中的运行时状态共享](https://docs.nginx.com/nginx/admin-guide/high-availability/clustered-http-servers/#runtime-state-sharing-in-a-cluster)」。

## 限制带宽

要限制每个连接的带宽，请使用 `limit_rate` 指令：

```nginx
location /download/ {
    limit_rate 50k;
}
```

使用此设置，客户端将能够通过单个连接以最大速度下载 50 千字节/秒的内容。但是，客户端可以开启多个连接。因此，如果目标是防止下载速度超过指定值，则还应限制连接数量。例如，每个 IP 地址仅允许一个连接（如果使用上面指定的共享内存区域）：

```nginx
location /download/ {
    limit_conn addr 1;
    limit_rate 50k;
}
```

如需限制客户端下载一定量的数据后才施加带宽限制，请使用 `limit_rate_after` 指令。例如，允许客户端快速下载一定量的数据（例如文件头部或电影索引），然后限制其余数据的下载速度（以便用户观看电影而非下载）。

```nginx
limit_rate_after 500k;
limit_rate       20k;
```

以下示例显示了限制连接数和带宽数量的组合配置。最大允许的连接数为每个客户端地址的 5 个连接，这适用于大多数常见情况，因为现代浏览器通常同时打开最多 3 个连接。与此同时，负责提供下载服务的位置仅允许一个连接：

```nginx
http {
    limit_conn_zone $binary_remote_address zone=addr:10m;

    server {
        root /www/data;
        limit_conn addr 5;

        location / {
        }

        location /download/ {
            limit_conn       addr 1;
            limit_rate_after 1m;
            limit_rate       50k;
        }
    }
}
```

## 动态带宽控制

`limit_rate` 值也可以指定为一个变量，从而实现动态带宽使用场景，例如允许更高的带宽限制适用于现代浏览器：

```nginx
map $ssl_protocol $response_rate {
    "TLSv1.1" 10k;
    "TLSv1.2" 100k;
    "TLSv1.3" 1000k;
}

server {
    listen 443 ssl;
    ssl_protocols       TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_certificate     www.example.com.crt;
    ssl_certificate_key www.example.com.key;

    location / {
        limit_rate       $response_rate; # 根据 TLS 版本限制带宽
        limit_rate_after 512;      # 发送表头后应用带宽限制
        proxy_pass       http://my_backend;
    }
}
```

参见：「[使用 NGINX 和 NGINX Plus 进行速率限制](https://docs.nginx.com/nginx/admin-guide/security-controls/controlling-access-proxied-http/#rate-limiting-with-nginx-and-nginx-plus)」。