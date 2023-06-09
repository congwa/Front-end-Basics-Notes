# 简易聊天室服务器

这是一个基于TCP协议的简易聊天室服务器，使用Go语言开发。用户可以通过telnet等客户端软件连接到指定的IP地址以及端口，并进行群聊、私聊、改名等操作。

## 其它语言版本

- [node.js、typescript版本](/study/n-nodejs/1-base/1-server)
## 功能介绍

1. 支持多个用户同时在线，在线用户信息储存在服务器的OnlineMap中；
2. 支持用户发送消息后广播给其他在线用户，也支持用户向指定用户进行私聊；
3. 用户可以通过特定命令查询当前有哪些用户在线，以及更改自己的用户名；
4. 为了保证并发读写map变量的稳定性，服务端使用sync.RWMutex进行了保护。

## 开始使用

1. 克隆项目到本地；
2. 在命令行中进入项目目录，执行`go run main.go`命令启动服务器；
3. 使用telnet或其他客户端工具，连接到指定的IP地址以及端口即可开始使用。

## 项目结构

```bash
server
├── main.go    # 服务器的入口代码
├── readme.md  # 项目说明文档
└── user.go    # 实现用户对象和用户方法的代码
```

## 技术栈

- Go语言
- TCP协议
- sync.RWMutex 并发读写锁
- goroutine、channel等Go语言并发编程特性

![tcp聊天室](/study/imgs/go-1-server-tcp%E8%81%8A%E5%A4%A9%E5%AE%A4.png)
