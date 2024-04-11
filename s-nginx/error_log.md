# 错误日志

## 语法

```bash
Syntax:	error_log file [level];
Default:	
error_log logs/error.log error;

Context:	main, http, mail, stream, server, location
```

配置日志记录。可以在同一配置级别 (1.5.2) 上指定多个日志。如果在 main 配置级别上未明确定义将日志写入文件，则将使用默认文件。


第一个参数定义将存储日志的 file 。特殊值 stderr 选择标准错误文件。可以通过指定" syslog: "前缀来配置记录到 syslog。可以通过指定" memory: "前缀和缓冲区 size 来配置记录到循环内存缓冲区，通常用于调试（1.7.11）

第二个参数决定日志记录的 level ，可以是以下之一： debug 、 info 、 notice 、 warn 、 error 、 crit 、 alert 或 emerg 。

以上日志级别按严重性递增的顺序列出。设置特定的日志级别将导致记录指定的和更严重的日志级别的所有消息。例如，默认级别 error 将导致记录 error 、 crit 、 alert 和 emerg 消息。如果省略此参数，则使用 error 。

要使 debug 日志记录工作，nginx 需要使用 --with-debug 构建，请参阅"调试日志"。



