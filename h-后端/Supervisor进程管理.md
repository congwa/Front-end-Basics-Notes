# Supervisor进程管理

Supervisor是一个用于进程管理的开源工具，通常用于在Unix和类Unix系统上监控和控制进程的运行。它提供了一个简单而强大的方式来管理后台进程，例如Web服务器、任务队列、应用程序等。

Supervisor的主要功能包括：
- 进程监控：Supervisor可以监控指定的进程，并在进程意外终止时自动重新启动它们。这对于确保关键进程的持续运行非常有用，以及防止因进程崩溃而导致的服务中断。
- 进程控制：Supervisor允许您通过命令行或API控制进程的启动、停止、重启等操作。这使得管理和操作进程变得更加便捷，无需手动干预或编写复杂的脚本。
- 日志管理：Supervisor可以捕获和管理进程的输出日志，包括标准输出和标准错误。它提供了对日志文件的轻松访问和旋转，以便有效地跟踪和调试应用程序的运行情况。
- 配置灵活：Supervisor使用简单的配置文件来定义要监控和管理的进程。您可以为每个进程指定启动命令、工作目录、运行用户等信息，并通过配置文件灵活地定义进程之间的依赖关系。
- 扩展性：Supervisor支持通过插件扩展其功能。您可以使用插件来添加额外的监控指标、告警机制、Web界面等，以满足特定需求或增强系统的可视化和可管理性。
  
Supervisor的使用非常广泛，特别适用于服务器环境下的进程管理。它被广泛应用于Web服务器（如Nginx、Apache）、应用程序框架（如Flask）、队列处理（如Celery）等场景，以确保关键进程的稳定运行和自动恢复。

总而言之，Supervisor是一个可靠而灵活的进程管理工具，它简化了在Unix系统上管理和监控后台进程的任务，提供了更好的稳定性和可管理性。

## 安装

因为Supervisor是 Python 开发的，安装前先检查一下系统否安装了 Python2.4 以上版本。

```sh
sudo yum install python-setuptools
sudo easy_install supervisor
```

也可以

```sh
// 由于 Supervisor 是一个 python 的第三方库，所以可以直接使用 pip 进行安装:
pip install supervisor
```

## 生成Supervisor配置文件

安装Supervisor之后可以直接使用内置的命令来生成一个默认的配置文件，这个配置文件也是作为Supervisor的启动文件，具体命令为：

```sh
echo_supervisord_conf > supervisord.conf
```

这样就得到了一个基本的配置文件，不过文件里面大部分内容都是注释，而且很多都是非必需的配置，我们可以直接来一个基础配置，如下：

```ini
[supervisord]
logfile=/var/log/supervisor/supervisord.log
pidfile=/tmp/supervisord.pid

[unix_http_server]
file=/tmp/supervisor.sock

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///tmp/supervisor.sock

[include]
files = /opt/cloud/izone/supervisord.d/*.conf

```

这里有几个地方需要注意，第一个是 pidfile 参数，这个就是进程自动生成的 pid 文件地址，然后是 file 参数和 serverurl 参数的地址应该报错一致，这两个文件会自动生成，所以要保证权限有。

include 里面的 files 就很类似 nginx 配置里面的 conf.d 目录，就是表示配置可以加载其他地方的配置，比如一些进程配置可以放到这里，当然，你也可以直接把配置放到这个主配置文件中。


## 创建服务配置

上面的主配置中 include 的目录中创建服务配置，比如go-demo.conf，放到 /opt/cloud/izone/supervisord.d/ 目录里面就行。

```ini
[program:go-demo]
; go build后的执行文件
command=/opt/Go/bin/go-demo  
directory=/opt/cloud/izone
stdout_logfile=/opt/LogFile/log/demo.log 
stderr_logfile=/opt/LogFile/log/demo.log 
autostart=true
autorestart=true
startsecs=2
stopwaitsecs=2
priority=100

```

这里的参数解释一下：

- command：启动的进程命令，比如这里是用gunicorn来启动go-demo
- directory：启动命令前进入的目录，比如这里是进入go-demo项目根目录
- stdout_logfile 和 stderr_logfile：日志路径
- autostart：跟随supervisor一起启动
- autorestart：进程死掉自动重启
- startsecs：启动几秒后没有异常退出，就表示进程正常启动了
- stopwaitsecs：杀死进程前等待的时间
- priority：进程启动优先级，值小的最先启动，关闭的时候最后关闭




## 启动Supervisor

### 启动命令

```sh
supervisord -c supervisord.conf
```

可以输入命令查看下刚刚启动的 demo 服务是否是成功

```sh
sudo supervisorctl status go-demo
```

查看正在守候的进程

```sh
supervisorctl
```

### 更新配置

涉及配置变动，需要更新。保存并关闭配置文件后，我们需要重新加载Supervisor的配置，使其生效。可以运行以下命令：

```sh
supervisorctl reread
supervisorctl update

```

这将使Supervisor读取新的配置文件并更新应用程序。


### 服务的操作

现在，可以使用Supervisor来启动、停止和管理go应用程序了。可以运行以下命令：

```sh
supervisorctl start go-demo
supervisorctl stop go-demo
supervisorctl restart go-demo

```


## 停止Supervisor

```sh
supervisorctl shutdown

```


## 容器化部署改动

### 修改 Dockerfile

由于更改了部署方式，所以在容器里面也要修改一下，之前是直接使用 gunicorn 来运行，现在改成 supervisord。

```sh
FROM python:3.9
ARG pip_index_url=https://pypi.org/simple
ARG pip_trusted_host=pypi.org
ENV PYTHONUNBUFFERED=1
WORKDIR /opt/cloud/izone

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    mkdir -p /var/log/supervisor
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt --index-url $pip_index_url --trusted-host $pip_trusted_host
COPY . .

CMD ["supervisord", "-n", "-c", "supervisord.conf"]

```

在容器里面必须加上 -n 参数，表示在前台运行，不然容器是无法运行的。


### 修改 docker-compose 文件

由于这次改动直接把 CMD 命令写到镜像构建里面了，所以容器启动的时候就会自动执行这个命令，那原来 docker-compose 文件里面的 command 参数就可以删除，具体要删除的是这里：

```yaml
command: gunicorn izone.wsgi -b 0.0.0.0:8000

```





