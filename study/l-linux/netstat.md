# netstat

netstat常用于查看端口占用的情况

netstat 命令用于显示与 IP、TCP、UDP 和 ICMP 协议相关的统计数据以及当前的网络连接状态。下面是 netstat 命令的常用选项：

1. `-a`：显示所有的连接（包括监听连接）。

2. `-p`：显示创建相关连接的程序名。

3. `-n`：以数字形式显示地址和端口号。

4. `-t`：仅显示 TCP 协议的连接。

5. `-u`：仅显示 UDP 协议的连接。

6. `-l`：仅显示监听连接。

7. `-s`：以统计信息的方式显示连接信息。

8. `-r`：显示路由表。

下面是一些示例：

1. 显示所有连接：

   ```sh
   netstat -a
   ```

2. 显示所有 TCP 连接：

   ```sh
   netstat -at
   ```

3. 显示所有监听连接：

   ```sh
   netstat -l
   ```

4. 显示所有 UDP 连接：

   ```sh
   netstat -au
   ```

5. 显示所有连接及其对应的程序名：

   ```sh
   netstat -ap
   ```

6. 显示 TCP 连接的统计信息：

   ```sh
   netstat -st
   ```

7. 显示路由表：

   ```sh
   netstat -r
   ```


```sh
sudo netstat -tuln | grep <port_number>
```