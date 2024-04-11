# 调试日志


## 启用

要启用调试日志，需要将 nginx 配置为在构建期间支持调试

```bash
./configure --with-debug ...
```

然后应该使用 error_log 指令设置 debug 级别：

```bash
error_log /path/to/log debug;
```

要验证 nginx 是否配置为支持调试，请运行 nginx -V 命令：

```bash

configure arguments: --with-debug ...

```

预构建的 Linux 包为使用 nginx-debug 二进制文件 (1.9.8) 的调试日志提供开箱即用的支持，可以使用命令运行

```bash
service nginx stop
service nginx-debug start
```

然后设置 debug 级别。适用于 Windows 的 nginx 二进制版本始终使用调试日志支持构建，因此仅设置 debug 级别就足够了。


请注意，在不指定 debug 级别的情况下重新定义日志将禁用调试日志。

在下面的示例中，重新定义服务器级别的日志会禁用此服务器的调试日志：

```nginx
error_log /path/to/log debug;

http {
    server {
        error_log /path/to/log;
        ...
```

为避免这种情况，应注释掉重新定义日志的行，或者还应添加 debug 级别规范：

```nginx

error_log /path/to/log debug;

http {
    server {
        error_log /path/to/log debug;
        ...

``` 


## 选定客户端的调试日志

也可以仅为选定的客户端地址启用调试日志：

```nginx
error_log /path/to/log;

events {
    debug_connection 192.168.1.1;
    debug_connection 192.168.10.0/24;
}

```

## 记录到循环内存缓冲区

调试日志可以写入循环内存缓冲区：

```nginx
error_log memory:32m debug;
```

即使在高负载下，记录到 debug 级别的内存缓冲区也不会对性能产生重大影响。

在这种情况下，可以使用 gdb 脚本提取日志，如下所示：

```bash

set $log = ngx_cycle->log

while $log->writer != ngx_log_memory_writer
    set $log = $log->next
end

set $buf = (ngx_log_memory_buf_t *) $log->wdata
dump binary memory debug_log.txt $buf->start $buf->end

```

或者使用 lldb 脚本如下：

```bash

expr ngx_log_t *$log = ngx_cycle->log
expr while ($log->writer != ngx_log_memory_writer) { $log = $log->next; }
expr ngx_log_memory_buf_t *$buf = (ngx_log_memory_buf_t *) $log->wdata
memory read --force --outfile debug_log.txt --binary $buf->start $buf->end

```