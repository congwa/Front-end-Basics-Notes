# gorilla Web 开发包之安全 cookie 库

## 安全cookie之防止篡改

有些人比较"混蛋"，他们会尝试查看设置好的 cookie，让后改变其值

## 对数据进行数字签名

数字签名是对数据添加一个签名，以便验证其真实性。终端用户无需对数据进行加密或做掩码，但是我们需要向 cookie 添加足够的数据，这样如果用户更改了数据的话，我们能够检测出来

通过哈希来实现这个方案——会对数据进行 hash，然后将数据和数据的哈希值都存到 cookie 中。之后当用户发送 cookie 给我们，我们会对数据再次做哈希，验证是否和之前的哈希值匹配。

我们也**不希望用户创建新的哈希值，所以你通常会看到使用 HMAC 这类哈希算法**，通过一个密钥对数据做哈希。防止用户同时修改数据以及数字签名（哈希值）。

> json web token内置了数字签名功能

gorilla/securecookie提供了一种安全的 cookie，通过在服务端给 cookie 加密，让其内容不可读，也不可伪造。当然，敏感信息还是强烈建议不要放在 cookie 中


### securecookie对数据进行编码

```go
// 创建 SecureCookie 的时候提供一个哈希 key，利用该对象确保 cookie 的安全性
// It is recommended to use a key with 32 or 64 bytes, but
// this key is Less for simplicity.
var hashKey = []byte("very-secret")
var s = securecookie.New(hashKey,nil)

func SetCookieHandler(w http.ResponseWriter,r *http.Request){
    encoded,err:=s.Encode("cookie-name","cookie-value")
    if err == nil{
        cookie := &http.Cookie{
            Name: "cookie-name",
            Value: encoded,
            Path:"/",
        }
        http.SetCookie(w,cookie)
        fmt.Fprintln(w,encoded)
    }
}
```

```go
// 获取
func ReadCookieHandler(w http.ResponseWriter, r *http.Request) {
    if cookie, err := r.Cookie("cookie-name"); err == nil {
        var value string
        if err = s.Decode("cookie-name", cookie.Value, &value); err == nil {
            fmt.Fprintln(w, value)
        }
    }
}

```

**注意**：对于同时往数字签名的数据中添加用户信息和过期时间的情况，如果用上述方法保证可靠性，你必须非常小心，严格遵守 JWT 的使用模式。不能单单依赖 cookie 的过期时间，因为该日期未被加密，用户可以创建一个新的没有过期时间的 cookie，然后把 cookie 签名的部分拷贝过去，基本上就是创建了一个保证他们永久在线的 cookie。


如果想要同时进行加密，在初始化实例的时候传入第二个参数 `block key`

```go
// 第二个参数blockKey
var s = securecookie.New(hashKey,blockKey)
```


## 防止数据篡改还有一种方式，就是**混淆数据**，对数据做掩码

