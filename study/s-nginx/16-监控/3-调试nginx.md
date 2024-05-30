# 调试NGINX

通过调试二进制文件、调试日志和核心转储文件来排查NGINX或NGINX Plus部署中的问题和错误。

## 介绍

调试可以帮助识别程序代码中的错误和问题，通常在开发或测试第三方或实验性模块时使用。

NGINX调试特性包括调试日志和创建核心转储文件及其进一步回溯。

## 配置NGINX二进制文件以进行调试

首先需要在NGINX二进制文件中启用调试。NGINX Plus已经提供了nginx-debug二进制文件，而NGINX Open Source则需要重新编译。

### 配置NGINX Plus二进制文件

从版本8开始，NGINX Plus与标准二进制文件一起提供nginx-debug二进制文件。要启用NGINX Plus中的调试，您需要切换到nginx-debug二进制文件。打开终端并运行命令：

```bash
service nginx stop && service nginx-debug start
```

完成后，在配置文件中启用调试日志。

### 编译NGINX Open Source二进制文件

要启用NGINX Open Source中的调试，您需要在configure脚本中指定--with-debug标志对其进行重新编译。

要使用调试支持编译NGINX Open Source：

- 下载并解压缩NGINX源文件，进入源文件目录。请参见下载源文件。
- 获取NGINX配置参数列表。运行以下命令：

  ```bash
  nginx -V 2>&1 | grep arguments
  ```

- 将--with-debug选项添加到configure命令列表中并运行configure脚本：

  ```bash
  ./configure --with-debug <other configure arguments>
  ```

- 编译并安装NGINX：

  ```bash
  sudo make
  sudo make install
  ```

- 重启NGINX。

## NGINX和调试符号

调试符号有助于获取调试的附加信息，例如函数、变量、数据结构、源文件和行号信息。

默认情况下，NGINX是使用"-g"标志编译的，包括调试符号。

但是，如果在运行回溯时出现"没有可用的符号表信息"错误，则缺少调试符号，您需要重新编译NGINX以支持调试符号。

确切的编译器标志集取决于编译器。例如，对于GCC编译器系统：

- 使用"-g"标志包含调试符号
- 使用"-O0"标志禁用编译器优化，使调试器输出更易于理解：

  ```bash
  ./configure --with-debug --with-cc-opt='-O0 -g' ...
  ```

## 在NGINX配置中启用调试日志

调试日志记录错误和任何与调试相关的信息，默认情况下处于禁用状态。要启用它，请确保NGINX已编译以支持调试（请参见配置NGINX二进制文件以进行调试），然后在NGINX配置文件中使用error_log指令的debug参数启用它。调试日志可以写入文件、内存中分配的缓冲区、stderr输出或syslog。

建议在NGINX配置的"main"级别上启用调试日志，以获得完整的运行状况。

### 将调试日志写入文件

将调试日志写入文件可能会减慢高负载下的性能。还要注意，文件可能会变得非常大，并很快吃掉磁盘空间。为了减少负面影响，可以将调试日志配置为写入内存缓冲区，或为特定IP地址设置调试日志。有关详细信息，请参见将调试日志写入内存和为选定的IP启用调试日志。

要启用将调试日志写入文件：

- 确保您的NGINX已配置--with-debug配置选项。运行以下命令并检查输出是否包含--with-debug行：

  ```bash
  nginx -V 2>&1 | grep -- '--with-debug'
  ```

- 打开NGINX配置文件：

  ```bash
  sudo vi /etc/nginx/nginx.conf
  ```

- 查找error_log指令，该指令默认位于主上下文中，并将日志级别更改为debug。如有必要，请更改日志文件路径：

  ```nginx
  error_log  /var/log/nginx/error.log debug;
  ```

- 保存配置并退出配置文件。

### 将调试日志写入内存

调试日志可以使用循环缓冲区写入内存。优点是，在高负载下记录调试级别不会对性能产生显着影响。

要启用将调试日志写入内存：

- 确保您的NGINX已配置--with-debug配置选项。运行以下命令并检查输出是否包含--with-debug行：

  ```bash
  nginx -V 2>&1 | grep -- '--with-debug'
  ```

- 在NGINX配置文件中，使用指定的error_log指令在主上下文中启用调试日志的内存缓冲区：

  ```nginx
  error_log memory:32m debug;
  ...
  http {
      ...
  }
  ```

### 从内存中提取调试日志

可以使用GDB调试器中执行的脚本从内存缓冲区提取日志。

要从内存缓冲区提取调试日志：

- 获取NGINX worker进程的PID：

  ```bash
  ps axu |grep nginx
  ```

- 启动GDB调试器：

  ```bash
  sudo gdb -p <nginx PID obtained at the previous step>
  ```

- 复制脚本，将其粘贴到GDB中并按"Enter"键。脚本将以当前目录中的debug_log.txt文件中保存日志：

  ```bash
  set $log = ngx_cycle->log
  while $log->writer != ngx_log_memory_writer
      set $log = $log->next
  end
  set $buf = (ngx_log_memory_buf_t *) $log->wdata
  dump binary memory debug_log.txt $buf->start $buf->end
  ```

- 通过按CTRL+D退出GDB。

- 打开当前目录中的文件"debug_log.txt"：

  ```bash
  sudo less debug_log.txt
  ```

### 为选定的IP启用调试日志

可以为特定的IP地址或IP地址范围启用调试日志。记录特定的IP地址可能在生产环境中非常有用，因为它不会对性能产生负面影响。IP地址在events块内的debug_connection指令中指定；该指令可以定义多次：

```nginx
error_log /path/to/log;
...
events {
    debug_connection 192.168.1.1;
    debug_connection 192.168.10.0/24;
}
```

## 为每个虚拟主机启用调试日志

通常情况下，error_log指令在主上下文中指定并应用于所有其他上下文，包括server和location。但是，如果特定的server或location块内另外指定了error_log指令，则全局设置将被覆盖，并且此类error_log指令将设置其自己的日志文件路径和日志级别。

要为特定虚拟主机设置调试日志，请在特定server块内添加error_log指令，并在其中设置新的日志文件路径和调试日志级别：

```nginx
error_log /path1/to/log debug;
...
http {
    ...
    server {
    error_log /path2/to/log debug;
    ...
    }
}
```

要为特定虚拟主机禁用调试日志，请在特定server块内指定error_log指令，并仅指定日志文件路径：

```nginx
error_log /path/to/log debug;
...
http {
    ...
    server {
    error_log /path/to/log;
    ...
    }
}
```


## 启用核心转储

核心转储文件可以帮助识别和修复导致NGINX崩溃的问题。核心转储文件可能包含敏感信息，例如密码和私有键，因此请确保它们受到安全处理。

要创建核心转储文件，必须在操作系统和NGINX配置文件中都启用它们。

### 在操作系统中启用核心转储

按照以下步骤在操作系统中执行：

1. 指定工作目录，用于保存核心转储文件，例如"/tmp/cores"：

   ```bash
   mkdir /tmp/cores
   ```

2. 确保该目录可由NGINX worker进程写入：

   ```bash
   sudo chown root:root /tmp/cores
   sudo chmod 1777 /tmp/cores
   ```

3. 禁用核心转储文件的最大大小限制：

   ```bash
   ulimit -c unlimited
   ```

   如果操作无法进行并出现"无法修改限制：操作不允许"的情况，请运行以下命令：

   ```bash
   sudo sh -c "ulimit -c unlimited && exec su $LOGNAME"
   ```

4. 为setuid和setgid进程启用核心转储。

   对于CentOS 7.0、Debian 8.2、Ubuntu 14.04，请运行以下命令：

   ```bash
    echo "/tmp/cores/core.%e.%p" | sudo tee /proc/sys/kernel/core_pattern
    sudo sysctl -w fs.suid_dumpable=2
    # 使新的内核参数生效，以达到调整系统性能、优化网络连接等目的
    sysctl -p
   ```

   对于FreeBSD，请运行以下命令：

   ```bash
   sudo sysctl kern.sugid_coredump=1
   sudo sysctl kern.corefile=/tmp/cores/%N.core.%P
   ```

### 在NGINX配置中启用核心转储

要在NGINX配置文件中启用核心转储，请执行以下操作：

1. 打开NGINX配置文件：

   ```bash
   sudo vi /usr/local/etc/nginx/nginx.conf
   ```

2. 使用working_directory指令定义一个目录，用于保存核心转储文件。该指令在主配置级别上指定：

   ```bash
   working_directory /tmp/cores/;
   ```

3. 确保目录存在且可由NGINX worker进程写入。打开终端并运行以下命令：

   ```bash
   sudo chown root:root /tmp/cores
   sudo chmod 1777 /tmp/cores
   ```

4. 使用worker_rlimit_core指令指定核心转储文件的最大可能大小。该指令也在主配置级别上指定。如果核心转储文件的大小超过该值，则不会创建核心转储文件。

   ```nginx
   worker_rlimit_core 500M;
   ```

   示例：

   ```nginx
   worker_processes   auto;
   error_log          /var/log/nginx/error.log debug;
   working_directory  /tmp/cores/;
   worker_rlimit_core 500M;

   events {
       ...
   }

   http {
       ...
   }
   ```

   使用这些设置，将在"/tmp/cores/"目录中创建核心转储文件，仅当其大小不超过500兆字节时才会创建。


## 从核心转储文件获取回溯信息

回溯提供了有关程序崩溃时出了什么问题的核心转储文件的信息。

要从核心转储文件获取回溯，请执行以下操作：

1. 使用以下模式使用GDB调试器打开核心转储文件：`sudo gdb <nginx_executable_path> <coredump_file_path>`

2. 输入"backtrace"命令以从崩溃时获取堆栈跟踪：`(gdb) backtrace`

如果"backtrace"命令导致"没有可用的符号表信息"消息，则需要重新编译NGINX二进制文件以包含调试符号。请参见NGINX和调试符号。

## 从运行中的进程中转储NGINX配置

您可以从主进程中提取当前的NGINX配置。当需要验证已加载哪个配置、如果在磁盘上意外删除或覆盖了先前的配置文件时需要恢复先前的配置时，这将很有用。

如果您的NGINX具有调试支持，则可以使用GDB脚本获取配置转储。

请确保您的NGINX构建了调试支持（--with-debug configure选项在configure参数列表中）。运行以下命令并检查输出结果是否包含--with-debug行：

```bash
# 输出 Nginx 的版本号以及它是如何编译的，包括使用的模块、编译选项等详细信息
nginx -V 2>&1 | grep -- '--with-debug'
```

获取NGINX工作进程的PID：

```bash
# ps axu 命令可用于查看当前系统上所有进程的信息
ps axu | grep nginx
```

启动GDB调试器：

```bash
sudo gdb -p <nginx PID obtained at the previous step>
```

将脚本复制并粘贴到GDB中，然后按"Enter"。脚本将在当前目录中将配置保存在nginx_conf.txt文件中：

```bash
set $cd = ngx_cycle->config_dump
set $nelts = $cd.nelts
set $elts = (ngx_conf_dump_t*)($cd.elts)
while ($nelts-- > 0) 
set $name = $elts[$nelts]->name.data
printf "Dumping %s to nginx_conf.txt\n", $name
append memory nginx_conf.txt \
      $elts[$nelts]->buffer.start $elts[$nelts]->buffer.end
end
```

通过按CTRL + D退出GDB。

打开位于当前目录中的nginx_conf.txt文件：

```bash
sudo vi nginx.conf.txt
```

请求帮助

在请求调试帮助时，请提供以下信息：

- NGINX版本、编译器版本和配置参数。运行命令：`nginx -V`
- 当前完整的NGINX配置。请参见从运行中的进程中转储NGINX配置
- 调试日志。请参见在NGINX配置中启用调试日志
- 获取的回溯。请参见启用核心转储，获取回溯