# gorilla Web 开发包之安全 cookie 库

## 安全cookie之防止篡改

有些人比较"混蛋"，他们会尝试查看设置好的 cookie，让后改变其值

## 对数据进行数字签名

数字签名是对数据添加一个签名，以便验证其真实性。终端用户无需对数据进行加密或做掩码，但是我们需要向 cookie 添加足够的数据，这样如果用户更改了数据的话，我们能够检测出来

通过哈希来实现这个方案——会对数据进行 hash，然后将数据和数据的哈希值都存到 cookie 中。之后当用户发送 cookie 给我们，我们会对数据再次做哈希，验证是否和之前的哈希值匹配。

我们也**不希望用户创建新的哈希值，所以你通常会看到使用 HMAC 这类哈希算法**，通过一个密钥对数据做哈希。防止用户同时修改数据以及数字签名（哈希值）。

> json web token内置了数字签名功能，但是无法还原真实的

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

就是按照规则在原始数据上加上一些数据，再通过规则解密，增加破密难度


## 实现原理

![反作弊流程-编码流程](/study/imgs/%E5%8F%8D%E4%BD%9C%E5%BC%8A%E7%BC%96%E7%A0%81%E6%B5%81%E7%A8%8B.png)

1. 序列化
    - value的值可能是结构体或者切片等任何类型，但是加密的时候需要使用字符串
    - 这时候比较有意思的是对cookie中的单行进行加密或者整个cookie放在一起进行加密

    序列化有两种方式，别是内建的包`encoding/json`和`encoding/gob`,securecookie包默认使用gob包进行序列化

    > `encoding/json`和`encoding/gob`的区别：gob包比json包生成的序列化数据体积更小、性能更高。但gob序列化的数据只适用于go语言编写的程序之间传递（编码/解码）。而json包适用于任何语言程序之间的通信

    ```go
      var (
        hashKey = securecookie.GenerateRandomKey(16)
        blockKey = securecookie.GenerateRandomKey(16)
        s = securecookie.New(hashKey, blockKey)
      )

      func init() {
        s.SetSerializer(securecookie.JSONEncoder{})
      }
    ```

2. 加密
    加密是可选的 ，如果在调用securecookie.New的时候指定了第2个参数，那么就会对序列化后的数据加密操作

    加密使用的AES对称加密。在Go的内建包crypto/aes中。该包有5种加密模式，5种模式之间采用的分块算法不同。有兴趣的同学可以自行深入研究。而securecookie包采用的是CTR模式

    该对称加密算法其实还可以应用其他具有敏感信息的传输中，比如价格信息、密码

3. base64编码
    经过上述编码（或加密）后的数据实际上是一串字节序列。如果转换成字符串大家可以看到会有乱码的出现。这里的乱码实际上是不可见字符。如果想让不可见字符变成可见字符，最常用的就是使用base64编码。

4. 使用hmac做hash
    简单来讲就是对字符串做了加密的hash转换

    在上文中我们提到，加密是可选的，hmac才是必需的。如果没有使用加密，那么经过上述序列化、base64编码后的字符串依然是明文的。所以无论有没有加密，都要做一次hash。这里使用的是内建包`crypto/hmac`

    做hmac操作时，不是只对value值进行hash，而是经过了字符串的拼接。实际上是对cookie名、日期、value值三部分进行拼接，并用 "|"隔开进行的
    
    这里将name值拼接进字符串是因为在加码验证的时候可以对key-value对进行验证，说明该value是属于该name值的。 将时间戳拼接进去，主要是为了对cookie的有效期做验证。在解密后，用当前时间和字符串中的时间做比较，就能知道该cookie值是否已经过期了

    最后，将经过hmac的hash值除去name值后再和b进行拼接。拼接完，为了在url中传输，所以再做一次base64的编码

    ![hmac的字符串组成](/study/imgs/hmac%E7%9A%84%E5%AD%97%E7%AC%A6%E4%B8%B2%E7%BB%84%E6%88%90.png)


## 序列化

序列化如上原理篇

## 自定义编解码

以定义一个类型实现Serializer接口，那么该类型的对象可以用作securecookie的编解码器。我们实现一个简单的 XML 编解码器

```go
package main

type XMLEncoder struct{}

func (x XMLEncoder) Serialize(src interface{}) ([]byte, error) {
  buf := &bytes.Buffer{}
  encoder := xml.NewEncoder(buf)
  if err := encoder.Encode(buf); err != nil {
    return nil, err
  }
  return buf.Bytes(), nil
}

func (x XMLEncoder) Deserialize(src []byte, dst interface{}) error {
  dec := xml.NewDecoder(bytes.NewBuffer(src))
  if err := dec.Decode(dst); err != nil {
    return err
  }
  return nil
}

func init() {
  s.SetSerializer(XMLEncoder{})
}
```

由于securecookie.cookieError未导出，XMLEncoder与GobEncoder/JSONEncoder返回的错误有些不一致，不过不影响使用。

## Hash/Block 函数自定义

securecookie默认使用sha256.New作为 Hash 函数（用于 HMAC 算法），使用aes.NewCipher作为 Block 函数（用于加解密）


可以通过securecookie.HashFunc()修改 Hash 函数，传入一个func () hash.Hash类型

通过securecookie.BlockFunc()修改 Block 函数，传入一个f func([]byte) (cipher.Block, error)

```go
func (s *SecureCookie) HashFunc(f func() hash.Hash) *SecureCookie {
  s.hashFunc = f
  return s
}

func (s *SecureCookie) BlockFunc(f func([]byte) (cipher.Block, error)) *SecureCookie {
  if s.blockKey == nil {
    s.err = errBlockKeyNotSet
  } else if block, err := f(s.blockKey); err == nil {
    s.block = block
  } else {
    s.err = cookieError{cause: err, typ: usageError}
  }
  return s
}

```

## 定期更换key

定期更换 Key. 防止泄露造成的风险

更换 Key，让之前获得的 cookie 失效。

对应securecookie库，就是更换SecureCookie对象

```go
var (
  prevCookie    unsafe.Pointer
  currentCookie unsafe.Pointer
)

func init() {
  prevCookie = unsafe.Pointer(securecookie.New(
    securecookie.GenerateRandomKey(64),
    securecookie.GenerateRandomKey(32),
  ))
  currentCookie = unsafe.Pointer(securecookie.New(
    securecookie.GenerateRandomKey(64),
    securecookie.GenerateRandomKey(32),
  ))
}
```

程序启动时，我们先生成两个SecureCookie对象，然后每隔一段时间就生成一个新的对象替换旧的


由于每个请求都是在一个独立的 goroutine 中处理的（读），更换 key 也是在一个单独的 goroutine（写）。为了并发安全，我们必须增加同步措施。但是这种情况下使用锁又太重了，毕竟这里更新的频率很低。我这里将securecookie.SecureCookie对象存储为unsafe.Pointer类型，然后就可以使用atomic原子操作来同步读取和更新了

```go

func rotateKey() {
  newcookie := securecookie.New(
    securecookie.GenerateRandomKey(64),
    securecookie.GenerateRandomKey(32),
  )

  atomic.StorePointer(&prevCookie, currentCookie)
  atomic.StorePointer(&currentCookie, unsafe.Pointer(newcookie))
}

```


rotateKey()需要在一个新的 goroutine 中定期调用，我们在main函数中启动这个 goroutine


```go
func main() {
  ctx, cancel := context.WithCancel(context.Background())
  defer cancel()
  go RotateKey(ctx)
}

func RotateKey(ctx context.Context) {
  ticker := time.NewTicker(30 * time.Second)
  defer ticker.Stop()

  for {
    select {
    case <-ctx.Done():
      break
    case <-ticker.C:
    }

    rotateKey()
  }
}
```


这里为了方便测试，我设置每隔 30s 就轮换一次。同时为了防止 goroutine 泄漏，我们传入了一个可取消的Context。

还需要注意time.NewTicker()创建的*time.Ticker对象不使用时需要手动调用Stop()关闭，否则会造成资源泄漏。

使用两个SecureCookie对象之后，我们编解码可以调用EncodeMulti/DecodeMulti这组方法，它们可以接受多个SecureCookie对象

```go
unc SetCookieHandler(w http.ResponseWriter, r *http.Request) {
  u := &User{
    Name: "dj",
    Age:  18,
  }

  if encoded, err := securecookie.EncodeMulti(
    "user", u,
    // 看这里 🐒
    (*securecookie.SecureCookie)(atomic.LoadPointer(&currentCookie)),
  ); err == nil {
    cookie := &http.Cookie{
      Name:     "user",
      Value:    encoded,
      Path:     "/",
      Secure:   true,
      HttpOnly: true,
    }
    http.SetCookie(w, cookie)
  }
  fmt.Fprintln(w, "Hello World")
}
```

使用unsafe.Pointer保存SecureCookie对象后，使用时需要类型转换。并且由于并发问题，需要使用atomic.LoadPointer()访问