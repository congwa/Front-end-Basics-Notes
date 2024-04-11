# 基于tcp聊天室

本项目是一个简单的聊天室 demo，使用 Node.js 和 TypeScript 实现。通过 TCP 协议实现多人在线聊天功能。用户可以实时收到其他用户的消息，并且支持给指定用户发送私信。

## go版本

- [go版本](/study/g-golang/1-base/1-server)

## 功能特点

- 多人在线聊天
- 发送文本消息及私信
- 更改用户名
- 查看在线用户列表
- 自动提醒上线及下线状态

## 环境要求

- Node.js 14+

## 安装步骤

1. 安装依赖

    ```bash
    pnpm install
    ```

2. 启动服务

    ```bash
    pnpm start
    ```

3. 使用任意 TCP 客户端连接聊天室
    
    使用go的可执行客户端文件在[文件位置](/study/g-golang/1-base/1-server) 

    ```bash

    ./client
    ```


## 使用方式

- 使用任意 TCP 客户端连接聊天室

- 支持的命令：

  - `/rename|new_name`: 更改自己的用户名为 `new_name`
  
  - `/to|remote_name|content`: 给指定用户 `remote_name` 发送私信 `content`
  
  - `/who`: 查看当前在线用户列表
  
## 注意事项

- 消息默认编码格式为 UTF-8
  
- 消息以 `\n` 结尾
  
- 程序默认监听 127.0.0.1 的 8888 端口，如果需要更改，请修改代码中的端口号



## License

本项目基于 MIT 许可证发布。查看具体信息请参阅 [LICENSE](./LICENSE) 文件。