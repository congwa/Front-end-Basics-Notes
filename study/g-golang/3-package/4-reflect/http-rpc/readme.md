# 简单的基于 HTTP 的 RPC 调用

这个示例代码使用了 Golang 来实现一个简单的基于 HTTP 的 RPC（远程过程调用）功能。它允许用户通过 HTTP 请求调用预定义的方法，并返回结果。

## 实现步骤

1. 定义了两个结构体 `StringObject` 和 `MathObject`，并为它们定义了可以被远程调用的方法。
2. 定义了一个结构 `RpcMethod` 用于表示可调用的 RPC 方法。
3. 定义了一个 `mapObjMethods` 变量来保存对象和方法的映射关系。
4. 使用 `registerMethods` 函数将可导出的方法注册为 RPC 方法，并保存在 `mapObjMethods` 中。
5. 定义了一个 HTTP 处理器函数 `handler`，将请求的路径解析为对象名、方法名和参数，并调用对应的方法。
6. 实例化一个 HTTP 服务器，注册处理器，并监听指定端口。
7. 运行服务器，等待请求的到来。

## 使用示例

1. 启动服务器：`go run main.go`。
2. 使用 curl 或其他工具发送 HTTP 请求，调用注册的方法并获取结果。

## 示例请求和响应

1. 调用 MathObject 的 Add 方法：`curl localhost:8080/math/Add/1/2`，响应：`{"data":3}`。
2. 调用 MathObject 的 Sub 方法：`curl localhost:8080/math/Sub/10/2`，响应：`{"data":8}`。
3. 调用 MathObject 的 Div 方法：`curl localhost:8080/math/Div/10/2`，响应：`{"data":5}`。
4. 调用 MathObject 的 Div 方法并传入除数为 0：`curl localhost:8080/math/Div/10/0`，响应：`{"error":"divided by zero"}`。
5. 调用 StringObject 的 Concat 方法：`curl localhost:8080/string/Concat/abc/def`，响应：`{"data":"abcdef"}`。

```bash
$ curl localhost:8080/math/Add/1/2
{"data":3}
$ curl localhost:8080/math/Sub/10/2
{"data":8}
$ curl localhost:8080/math/Div/10/2
{"data":5}
$ curl localhost:8080/math/Div/10/0
{"error":"divided by zero"}
$ curl localhost:8080/string/Concat/abc/def
{"data":"abcdef"}
```


