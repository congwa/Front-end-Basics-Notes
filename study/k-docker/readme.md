# docker

Docker是一个用于开发、发布和运行应用程序的开放平台。也可以简单的理解为 Docker 是一个可以部署、运行项目的容器。

## 命令

```Dockerfile

FROM          # 基础镜像
MAINTAINER    # 镜像作者信息 姓名+邮箱
RUN           # 镜像构建的时候运行的命令
ADD           # copy内容到容器（压缩包，自动解压）
COPY          # 类似ADD 将文件copy到容器中
WORKDIR       # 指定镜像工作目录
VOLUME        # 设置容器卷
EXPOSE        # 指定暴露端口
ONBUILD       # 当构一个被继承的容器 dockerfile这个时候会运行ONBUILD 的指令 ，触发指定。
ENV           # 构建时设置环境变量
ENTRYPOINT    # 指定这个容器启动的时候要运行的命令（可以追加命令）
CMD           # 指定这个容器启动的时候要运行的命令（只有最后一个会生效，可被代替）
LABEL         # 指令用来给镜像添加一些元数据
HEALTHCHECK   # 用于指定某个程序或者指令来监控 docker 容器服务的运行状态
ARG           # ARG设置环境变量仅对 Dockerfile 内有效

```

```sh
docker  build -t 镜像名称:版本  -f Dockefile文件  .
# -t  指定镜像名字:版本
# -f  指定Dockerfile文件   
# .  代表在当前目录下
```

```sh
docker run --name nginx-test2 -p 80:80 -v /tmp/aaa:/usr/share/nginx/html -e KEY1=VALUE1 -d nginx:latest 

# -p 是端口映射
# -v 是指定数据卷挂载目录
# -e 是指定环境变量
# -d 是后台运行
```

```sh
docker cp ...
```

```sh
# docker-compose

# 该参数指定Dockerfile文件的路径，Docker Compose会通过Dockerfile构建并生成镜像，然后使用该镜像
build

# 指定启动容器的镜像，可以是镜像仓库/标签或者镜像id(或者id的前一部分)
#  　如果镜像不存在，Compose将尝试从官方镜像仓库将其pull下来，如果你还指定了build，在这种情况下，它将使用指定的build选项构建它，并使用image指定的名字和标记对其进行标记
image

# 指定一个自定义容器名称，而不是生成的默认名称
# 由于Docker容器名称必须是唯一的，因此如果指定了自定义名称，则无法将服务扩展到多个容器
container_name

# 卷挂载路径设置。可以设置宿主机路径 (HOST:CONTAINER) 或加上访问模式 (HOST:CONTAINER:ro),挂载数据卷的默认权限是读写(rw)，可以通过ro指定为只读
volumes

# 暴露端口，但不映射到宿主机，只被连接的服务访问仅可以指定内部端口为参数
expose

# 暴露端口信息常用的简单格式：使用宿主：容器 (HOST:CONTAINER)格式或者仅仅指定容器的端口(宿主将会随机选择端口)都可以
ports

# 重启策略
restart

# environment

environment


# link关键字用于在不同的容器之间创建网络链接， 它允许一个容器能够访问另一个容器的网络连接信息（如IP地址和端口）。
links

# web容器与db容器建立了链接，使得web容器可以通过db主机名访问到db容器。
# services:
#   web:
#     build: .
#     links:
#       - db
#   db:
#     image: postgres


# 新版本中建议使用 自定义网络 来代替 links
# services:
#   web:
#     build: .
#     depends_on:
#       - db
#     networks:
#       - mynet
#   db:
#     image: postgres
#     networks:
#       - mynet

# networks:
#   mynet:
#     driver: bridge


# depends_on关键字用于定义服务之间的依赖关系， 影响启动顺序
depends_on

# web服务依赖于db服务， 当使用docker-compose up启动时，Docker Compose会首先启动db容器，然后再启动web容器
# services:
#   web:
#     build: .
#     depends_on:
#       - db
#   db:
#     image: postgres
```

## 容器、操作系统级虚拟化

Docker 是基于 Linux 的高效、敏捷、轻量级的容器（轻量虚拟）方案。它的特点：高效的利用系统资源、快速的启动时间、一致的运行环境、持续交付和部署、更轻松的迁移。

|  虚拟化技术   | 代表  |
|  ----  | ----  |
| 完全虚拟化  | VMware Workstation、VirtualBox |
| 硬件辅助虚拟化  | 	InterVT AMD-V |
| 超虚拟化  | 	InterVT AMD-V |
| 操作系统级  | 	Docker LXC容器 |

Docker 对比传统虚拟机

| 特性 | 容器 | 虚拟机 |
| :-----| ----: | :----: |
| 启动 | 秒级 | 分钟级 |
| 硬盘使用 | 一般为 MB | 一般为 GB |
| 性能 | 接近原生 | 弱于原生 |
| 系统支持量 | 单机支持上千个容器 | 一般几十个 |

---

## docker常用的几个命令

```sh
# docker的守护进程查看
systemctl status docker

# docker 镜像查看
docker image ls

#docker 容器查看
docker ps

# Docker Registry配置和查看
cat /etc/docker/daemon.json
```


---
## 安装

这里主要介绍两种安装方式，一种是本地开发电脑 Mac 上的安装，一种是服务器 Ubuntu 上的安装

### mac

brew进行安装即可

### Ubuntu服务器安装

```sh

# 登录到远程服务器，我这里默认的用户是 unbuntu
# 如果是 root 用户
ssh root@xx.xx.xx.xx    
# unbuntu 用户，执行命令时需要 sudo
ssh unbuntu@xx.xx.xx.xx 

# apt升级
sudo apt-get update
# 添加相关软件包
sudo apt-get install \
apt-transport-https \
ca-certificates \
curl \
software-properties-common
# 下载软件包的合法性，需要添加软件源的 GPG 密钥
curl -fsSL https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
# source.list 中添加 Docker 软件源
sudo add-apt-repository \
"deb [arch=amd64] https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu \
$(lsb_release -cs) \
stable"
# 安装 Docker CE
sudo apt-get update
sudo apt-get install docker-ce
# 启动 Docker CE
sudo systemctl enable docker  # 添加docker服务
sudo systemctl start docker # 启动docker
# 建立 docker 用户组(可选，如果只有root用户，可以加一个) 
sudo groupadd docker
sudo usermod -aG docker $USER
# 测试命令是否生效
docker

```

### 镜像加速

为了加快镜像下载速度，可以使用第三方镜像

- 阿里云加速器(需登录账号获取) 暂不推荐
- Azure 中国镜像 <https://dockerhub.azk8s.cn>
- 七牛云加速器 <https://reg-mirror.qiniu.com>

```sh
# sudo vi /etc/docker/daemon.json 
{ 
  "registry-mirrors": [ 
    "https://dockerhub.azk8s.cn",
    "https://reg-mirror.qiniu.com" 
  ] 
}

# 重启docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 运行服务

```sh
# 拉取官方镜像 - 面向docker的只读模板
docker pull nginx   # 可能会等很久，下载慢
# 查看镜像
docker images nginx
# 启动镜像
mkdir www
echo 'hello docker!!' >> www/index.html
# 启动
# www目录里面放一个index.html
# -p 端口映射 8000:80 ，将服务器的8000端口，映射到docker虚拟机里nginx服务的80端口
# $PWD/www 当前目录下的www，: 映射到 nginx 默认的路径下，使用镜像名字为 nginx
docker run -p 8000:80 -v $PWD/www:/usr/share/nginx/html nginx  
# 后台启动
# -d 以 daemon 后台守护进程执行，返回 uuid
docker run -p 80:80 -v $PWD/www:/usr/share/nginx/html -d nginx 
# 查看运行中的容器，如果要查看全部加 -a，容器id的前3位就可以操作该容器。
# List containers，-a Show all containers (default shows just running)
docker ps 
# 停止
docker stop ff6
# 开启
docker start ff6
# 进入docker内部伪终端，可以看容器内部文件系统
docker exec -it ff6 /bin/bash
# 删除镜像
docker rm ff6

```

## docker运行过程

### 基本概念

- 镜像（Image），面向Docker的只读模板，其中包含创建Docker容器的说明。An image is a read-only template with instructions for creating a Docker container.
- 容器（Container），镜像的运行实例。A container is a runnable instance of an image.
- 仓库 (Registry)，存储镜像的服务器

命令运行过程.如下图

- 运行 docker pull，从镜像服务器拉取镜像到本地
- 运行 docker run，将镜像实例化，放到容器列表列执行
- 运行 docker build，创建一个镜像

![docker](/study/imgs/docker_architecture.svg)


## Dockerfile 定制镜像

要构建自己的镜像，您可以使用简单的语法创建一个 **Dockerfile** 文件，用于定义创建镜像并运行它所需的步骤。 Dockerfile中的每条指令都会在映像中创建一个层。 当您更改 Dockerfile 并重新构建镜像时，**仅重建那些已更改的层**。 与其他虚拟化技术相比，这是使镜像如此轻量，小和快速的部分原因。

定制自己web服务镜像

```sh
# 创建一个测试的文件夹
mkdir my_nginx
# 在 myNginx 下创建 Dockerfile 文件，并写入内容
vi my_nginx/Dockerfile
# Dockerfile 内容，从 nginx 镜像开始，在nginx目录下新增一个页面
FROM nginx:latest
RUN echo '<h1>Hello, my_nginx!</h1>' > /usr/share/nginx/html/index.html

# 进入 myNginx
cd my_nginx
# 定制镜像
# -t tag list，Name and optionally a tag in the 'name:tag' format
docker build -t my_nginx:v1 .  # nginx定义镜像名，v1版本
# 运行镜像
docker run -p 80:80 my_nginx:v1
```

这样访问 127.0.0.1 就可以看到 Hello, my_nginx! 


## 定制node.js镜像


## 定制pm2镜像

PM2 - 利用多核资源

```sh
# .dockerignore
node_modules
```

pm2配置文件

```js

// process.yml
apps:
  script: app.js
  instances: 2
  watch: true
  env:
    NODE_ENV: production
```

Dockerfile

```sh
# Dockerfile  
# pm2在docker中使用命令为pm2-runtime
FROM keymetrics/pm2:latest-alpine
WORKDIR /usr/src/app
ADD . /usr/src/app
RUN npm config set registry https://registry.npm.taobao.org/ && \
npm i
EXPOSE 3000
CMD ["pm2-runtime", "start", "process.yml"]
```

定制镜像

```sh
# 定制镜像
docker build -t mypm2 .
# 运行
docker run -p 3000:3000 -d mypm2
```

## docker-compose

Compose项目是 Docker 官方的开源项目，负责实现对 Docker 容器集群的快速编排，一次性可以启动多个镜像。

docker-compose：使用 Docker 定义或运行多个容器应用。


安装

```sh
# ubuntu需要安装，Mac不需要
apt install docker-compose

```

测试

```sh
mkdir helloworld
cd helloworld
vi docker-compose.yml
# docker-compose.yml 文件内容
version: '3.1'
services:
 hello-world:
  image: hello-world

# 运行 docker-compose  Create and start containers
docker-compose up 
```

注意，如果是 ubuntu 服务器，会报 Couldn't connect to Docker daemon at http+docker://localunixsocket - is it running? 的错误，解决方法如下：

```sh
docker-compose up
# ERROR: Couldn't connect to Docker daemon at http+docker://localunixsocket - is it running?
# If it's at a non-standard location, specify the URL with the DOCKER_HOST environment variable.
# 将当前用户加入docker组
sudo gpasswd -a ${USER} docker
# Adding user ubuntu to group docker
sudo su # 切换到 root
su ubuntu # 切回 ubuntu 再次执行即可
docker-compose up
```

参考:[解决 ERROR: Couldn't connect to Docker daemon at http+docker://localunixsocket - is it running? | CSDN](https://blog.csdn.net/xiojing825/article/details/79494408)


同时启用mongo、mongo-express两个镜像服务

```sh

# 新建一个项目
mkdir mongo
cd mongo
vi docker-compose.yml

# docker-compose.yml
version: '3.1'
services:
  mongo:
    image: mongo
    restart: always
    ports:
      - 27017:27017
  mongo-express:
    image: mongo-express
    restart: always
    ports:
      - 8000:8081

# 运行
docker-compose up
```

在浏览器打开 http://127.0.0.1:8000/ 就可以看到 mongo 客户端了


### docker-compose up运行的都是旧代码，有缓存的问题

当包含有 Dockfile 需要 build 的情况，比如 node 项目。如果代码有改动，重新运行 docker-compose up，那么他还会是旧的代码，并没有刷新。

算不使用 docker-compose up --force-recreate 也不管用，还要加 --build，才会将修改后的代码重新build

```sh
# 重新创建容器，重新build
docker-compose up --force-recreate --build
```

参考: [2019-11-07 史上大坑：使用docker-compose自动更新代码到容器 | 简书](https://www.jianshu.com/p/18cb318445f4)

### 前后端分离与数据库的docker-compose示例

使用 docker-compose 运行部署多个镜像，一次性部署前端后代码以及mysql

- nginx 用于部署前端构建后的 dist 目录
- mysql-db 用于启动 mysql 服务
- app-pm2 用于部署 backend 目录下的 node 服务端项目

```sh
# docker-compose.yml
version: '3.1'
services:
  nginx:
    restart: always
    image: nginx
    ports:
      - 80:80
    volumes:
      - ./nginx/conf.d/:/etc/nginx/conf.d
      - ./dist:/var/www/html/
  mysql-db:
    container_name: mysql
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: 'you passowrd'
    restart: always
    ports:
      - 3306:3306
    expose:
      - 3306
    volumes:
      - ./backend/dao:/docker-entrypoint-initdb.d/ # 挂载数据初始化sql脚本
  app-pm2:
    container_name: app-pm2
    # 构建容器
    build: ./backend
    ports:
      - 8700:8700
    depends_on:
      - mysql-db
```


## nginx部署前端项目

使用 nginx 镜像

1. 自定义 nginx 配置，将前端目录下的 nginx/conf.d/docker.conf 映射到 docker 容器的 nginx 默认配置目录
2. 将当前目录下的 dist 目录，映射到 nginx 默认目录

```sh
  # docker-compose.yml nginx 部分
  nginx:
    restart: always
    image: nginx
    ports:
      - 80:80
    volumes:
      - ./nginx/conf.d/:/etc/nginx/conf.d
      - ./dist:/var/www/html/

```

```js
//./nginx/conf.d/docker.conf
server {
  listen 80;
  location / {
    root /var/www/html;
    index index.html index.htm;
  }
}
```

## mysql镜像

开启 mysql 服务，设置一个连接密码，用于本地 mac、以及 docker 里的其他镜像实例去连接该数据库

```sh

# docker-compose.yml mysql 部分
  mysql-db:
    container_name: mysql
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: 'you passowrd' # 密码
    restart: always
    ports:
      - 3306:3306
    expose:
      - 3306
    volumes:
      - ./backend/dao:/docker-entrypoint-initdb.d/ # 挂载数据初始化sql脚本
```

注意几个坑的问题

1. 允许外部 Host 连接，进入 mysql 镜像内部做修改，ubuntu默认ok，mac本地不可以，需要做如下修改
   
    ```sh
      # docker ps 查看到 mysql 镜像id 为 46e4xxx 后，进入该镜像
      docker exec -it 46e4 /bin/bash
      # 连接到 mysql
      mysql -uroot -p
      # 操作
      mysql> use mysql
      mysql> select Host,User from user;
      +-----------+------------------+
      | Host      | User             |
      +-----------+------------------+
      | %         | root             | # Host为 % 比是正常的
      | localhost | mysql.infoschema |
      | localhost | mysql.session    |
      | localhost | mysql.sys        |
      | localhost | root             |
      +-----------+------------------+
      5 rows in set (0.00 sec)
      # mac系统下，如果有则修改
      mysql> update user set host='%' where user='root' and host='localhost';
    ```

2. 无法使用socket方式连接到数据库，提示：ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/tmp/mysql.sock'
    一般 mysql 连接方式有两种，使用过 mac Sequel Pro app 的应该都知道
    - mysql -uroot -p 属于 Socket 连接
    - mysql -uroot -p -h127.0.0.1 加了-h参数，属于TCP/IP连接

    可能是由于 docker 端口映射的问题，我们无法使用 Socket 方式连接，会一直报上面的错误。这种情况下，我们加上 -h127.0.0.1 参数即可正常访问，暂时没找到其他解决方法。
3. 其他 docker 镜像(node项目)连接该 mysql 镜像连接不上
    - mac环境下报错 Error: connect ECONNREFUSED 127.0.0.1:3306
    - ubuntu服务器环境报错 ConnectionError [SequelizeConnectionError]: connect ETIMEDOUT

    主要是因为 node服务的镜像实例与mysql镜像实例之间相互独立，node镜像实例里代码连接 127.0.0.1:3306 是无法访问到 mysql 镜像实例的，需要相关联

    这里有个临时解决方法，就是先后台运行，然后通过 docker ps 查看对应的 镜像ID，再根据镜像ID，使用 docker inspect 镜像ID 查看 mysql 镜像对应的 IP ，然后将代码里的 host 改为该 IP 即可。这个IP可能是动态的，比如从mac到Ubuntu系统，是不一样的。所以它只是临时解决方案，如果IP变更了，代码也要修改 ，具体步骤如下

    ```sh
        # 后台运行
        docker-compose up --force-recreate --build -d
        docker ps
        # CONTAINER ID        IMAGE  
        # 4248f7c1d71b        nginx 
        # 6a6b527f3193        zuo11com_app-pm2 
        # 46e47b6cc227        mysql 
        docker inspect 46e4
        #  "Gateway": "172.18.0.1",
        #  "IPAddress": "172.18.0.2",
    ```

    修改 node 中修改 mysql 连接，重新运行 docker-compose up --force-recreate --build -d

    ```js
    this.sequelize = new Sequelize('ibd', 'root', '1234567Abc,.', {
      host: '172.18.0.1', // Gateway IP, docker从一个镜像访问里另一个镜像(mysql)
      // host: 'localhost', // 默认情况
      dialect: 'mysql', // 'mysql' | 'mariadb' | 'postgres' | 'mssql' 之一 
    })
    ```
    
    一劳永逸解决方法：host 直接写mysql对应的镜像名 "mysql-db" 即可。由于都是运行在一个docker环境里，即使不使用 links，使用 mysql-db 也会映射到对应 mysql 镜像的 IPAddress。

    这里又会有另外一个问题，original: Error: connect ECONNREFUSED 172.26.0.3:3306，可以看到 mysql-db 这个 host 名并不是解析到 mysql 镜像的 Gateway 网关地址，而是镜像的 IPAddress。

    这个问题的原因在于，node服务 depends_on mysql服务，但并不一定是等 mysql 镜像完全加载好才开始连接。所以 node 的 mysql 连接程序需要有错误重试的逻辑。如果出错，每隔2秒再重新连接。过个 5-10 秒，mysql 镜像完全初始化好，重连就正常了。
    
    ```js
      // mysql 重连逻辑
      // 初始化数据库
      async init() {
        try {
          // 建立连接
          // 参数分别为: database, username, password, config
          this.sequelize = new Sequelize('数据库名', 'root', '密码', {
            host: 'mysql-db', // docker从一个镜像访问里另一个镜像(mysql)
            dialect: 'mysql', // 'mysql' | 'mariadb' | 'postgres' | 'mssql' 之一 
          })
          // 测试连接，使用 .authenticate() 函数来测试连接
          await this.sequelize.authenticate() // 如果连接异常，会走catch的逻辑

          this.createConfigModel()
        } catch (e) {
          console.log(e)
          // 失败重连，fix dcoker-compose 连不上mysql容器
          // original: Error: connect ECONNREFUSED 172.26.0.3:3306
          // depends_on 并不代表 mysql 数据库完全初始化好再启动当前服务
          setTimeout(()=> {
            this.init()
          },2000)
        }
      }
    ```

    总结： 

    1. 使用ip网络进行通讯
    2. 使用网桥进行通讯
    参考：[10分钟带你了解docker网络详解](https://blog.csdn.net/weixin_40483369/article/details/123224292)
4. 在 mysql 镜像执行 当前目录下的 .sql 文件

    ```sh
      # 后台运行
      # docker-compose up --force-recreate --build -d
      # 可以使用 docker-compose logs 查看日志
      # docker ps 查看mysql镜像id
      # 在 mysql 镜像里，批量执行当前目录下的 .sql 文件
      docker exec -i mysql镜像id sh -c 'exec mysql -h127.0.0.1 -uroot -p数据库密码' < ./xxx.sql
    ```

    参考: [mysql | Docker Hub](https://hub.docker.com/_/mysql)


## node pm2服务端部署

部署并运行 backend 下的镜像，会 build 执行该项目下的 Dockfile

```sh
  # docker-compose.yml node pm2 部分
  app-pm2:
    container_name: app-pm2
    # 构建容器
    build: ./backend
    ports:
      - 3000:3000
    depends_on:
      - mysql-db
```

./backend/Dockfile

```sh
FROM keymetrics/pm2:latest-alpine
WORKDIR /usr/src/app
ADD . /usr/src/app
RUN npm config set registry https://registry.npm.taobao.org/ && \
npm i
EXPOSE 3000
CMD ["pm2-runtime", "start", "process.yml"]
```

## 使用vscode Deploy插件部署项目到Ubuntu

假设项目名为 test_demo，目录结构如下

```sh

backend
frontend
nginx
docker-compose.yml
```

在 test_demo 当前目录下创建一个 .vscode/settings.json 文件



```json

{
  "deploy": {
      "packages": [{
          "files": [
              "**/*",
          ],

          "exclude": [
              "node_modules/**",
              ".git/**",
              ".vscode/**",
              "**/node_modules/**",
          ],
          "deployOnSave": false
      }],
      "targets": [{
          "type": "sftp",
          "name": "TencentServer",
          // 服务器地址，注意我这里是ubuntu用户名，还可能是root
          "dir": "/home/ubuntu/root",
          "host": "服务器ip地址",
          "port": 22,
          "user": "ubuntu",
          // 也可以使用 ssh key登录
          // "privateKey": "/Users/{username}/.ssh/id_rsa",
          "password": "服务器密码",
      }],
  },
}
```

这样，假设你的服务器ip密码都是正确的。那么在 vscode 里右键对应的目录，选择 Deploy current file /folder 就可以部署到服务器了。

把 frontend、backend、nginx、docker-compose.yml 等必须要的文件部署到 服务器后，在服务器执行对应的 docker-compose up 命令即可。

注意，**腾讯云/阿里云等服务器一般有配置安全组，一般访问服务器的 3000端口，80端口等可能会被限制，需要在入规则里，开放对应的端口**


## 使用github Webhooks做持续集成，自动化部署

[使用github Webhooks做持续集成，自动化部署](/study/e-github-cli/)


## 常见错误

1. Is the docker daemon running?

    运行 docker 命令时，如果出现提示 Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?。

    一般是 docker 没有启动，如果是 mac，打开 docker app 即可启动 docker 服务。对于 linux 系统，使用 systemctl start docker 即可开启 docker 守护进程。
    - 参考  [Is the docker daemon running? Stack Overflow(opens new window)](https://stackoverflow.com/questions/44678725/cannot-connect-to-the-docker-daemon-at-unix-var-run-docker-sock-is-the-docker)

2. failed to solve with frontend dockerfile

    运行 docker build -t 镜像名 . 使用当前目录的 Dockerfile 创建定制的镜像时，如果出现以下错误

    failed to solve with frontend dockerfile.v0: failed to read dockerfile: open /var/lib/docker/tmp/buildkit-mount477390958/Dockerfile: no such file or directory

    一般是 Dockerfile 命名错误，注意大小写，不能是 DockerFile、dockerfile


## 参考资料

[docker使用技巧](https://mp.weixin.qq.com/s?__biz=Mzg3OTYzMDkzMg==&mid=2247496612&idx=1&sn=04c955cf8e565e9fd91d9485263b6b5b&chksm=cf033c9ff874b589a328840ee6e77582009db071b994ea2ebef6489b3936deb1caf810694fe1&scene=132#wechat_redirect)
> alpine的使用、分层缓存的使用、多阶段构建、ARG 是构建时的参数，ENV 时运行时的变量、CMD 结合 ENTRYPOINT、COPY vs ADD