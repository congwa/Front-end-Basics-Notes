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