# 字符串和byte

## 字符串转 []byte

```go
s := "hello"
b := []byte(s) // 将字符串转换为 []byte
b[0] = 'H'
fmt.Println(string(b)) // 输出："Hello"
```

## []byte 转字符串

```go
b := []byte{104, 101, 108, 108, 111}
s := string(b) // 将 []byte 转换为 string
fmt.Println(s) // 输出："hello"
```

字符串：用于表示和处理不可变的文本数据（例如日志信息、文件路径、网络地址等）。
字节切片（[]byte）：用于需要对数据进行修改的场景，比如网络通信、数据加密、或高效的字节级操作。
