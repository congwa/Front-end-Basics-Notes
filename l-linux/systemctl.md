# systemctl命令简介

CentOS 5使用SysV init；CentOS 6使用Upstart，CentOS 7使用Systemd管理守护进程。centos7采用 systemd管理，服务独立的运行在内存中，服务响应速度快，但占用更多内存。

独立服务的服务启动脚本都在目录 /usr/lib/systemd/system里。

- 系统引导时实现服务的并行启动；
- 按需激活进程；
- 系统实现快照；
- 基于依赖关系定义服务的控制逻辑；

systemctl可用于内省和控制“systemd”系统和服务管理器的状态。centos7.x系统环境下我们经常使用此命令启停服务，实际上此命令除了其他独立服务还有很多其他用途。

## 配置文件

systemctl的配置文件位于/etc/systemd/system目录下，文件名以.service、.socket、.target为后缀。每个配置文件包含以下键值：

- [Unit]：配置单元文件的元数据
- [Service]：服务的具体配置信息
- [Install]：安装服务/单元的细节

例如，我们可以编辑/etc/systemd/system/custom.service文件来配置一个自定义的服务单元：


```ini
[Unit]
Description=Custom Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/custom.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

上面的配置文件指定了自定义服务单元的名称和描述，以及服务的启动方式和重启策略。它还定义了服务的启动脚本，并将服务安装到multi-user.target组中

```sh
sudo journalctl -u ssh
```

这会显示一个当前SSH服务的所有活动日志。可以使用Shift+G将光标移到日志文件末尾。


## 日志

systemctl服务在/var/log/syslog和/var/log/journal目录中输出日志。可以使用以下命令来查看系统日志文件中的systemctl服务：


```sh
systemctl --help

# 启动服务
systemctl start ***

# 查看服务状态
systemctl status ***

# 停止某个服务
systemctl stop *** 

# 查看服务是否活跃
systemctl is-active xinetd

# 重新加载
systemctl reload ***

# 列出所有可用单元
systemctl list-unit-files

# 列出所有已加载单元
systemctl list-units

# 查看可用systemctl管理的所有服务

# 注销服务
systemctl mask firewalld

# 取消注销服务
systemctl unmask firewalld

# 设置服务开机自启动
systemctl enable xinetd.service

# 取消服务开机自启动
systemctl disable xinetd.service

# 查看服务是否开机自启动
systemctl is-enabled xinetd.service
# enabled

# 查看机器信息
systemctl list-machines

# 查看系统环境变量
systemctl show-environment

# 重新加载unit文件
systemctl daemon-reload

# 创建一个系统快照

systemctl snapshot wuhs

# 删除指定快照
systemctl delete wuhs


# 杀死服务
systemctl kill xinetd
systemctl is-failed xinetd

# 进入救援模式
systemctl rescue

#救援模式下切换到默认模式
systemctl default

# 关闭系统
systemctl poweroff

# 重启机器
systemctl reboot

# 系统睡眠

systemctl suspend

# 查看系统启动模式
systemctl get-default

# 设置系统为图形界面启动
systemctl set-default graphical.target
```

## 参考文档

[更详细的参考](https://blog.csdn.net/carefree2005/article/details/125886811)