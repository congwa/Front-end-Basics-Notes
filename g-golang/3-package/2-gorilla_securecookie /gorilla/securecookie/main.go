package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"          // 导入 gorilla/mux 包，用于 HTTP 路由处理
	"github.com/gorilla/securecookie" // 导入 gorilla/securecookie 包，用于 cookie 编解码
)

// 创建用户结构体
type User struct {
	Name string // 姓名属性
	Age  int    // 年龄属性
}

var (
	hashKey  = securecookie.GenerateRandomKey(16)  // 随机生成用于哈希的密钥
	blockKey = securecookie.GenerateRandomKey(16)  // 随机生成用于加密的密钥
	s        = securecookie.New(hashKey, blockKey) // 创建一个新的 securecookie 实例
)

// 设置 Cookie 的处理函数
func SetCookieHandler(w http.ResponseWriter, r *http.Request) {
	u := &User{ // 创建一个 User 实例，设置用户名和年龄
		Name: "dj",
		Age:  18,
	}
	if encoded, err := s.Encode("user", u); err == nil { // 使用 securecookie 的 Encode 方法将 User 结构体编码为字符串
		cookie := &http.Cookie{ // 创建一个名为 user 的 cookie
			Name:     "user",
			Value:    encoded, // 将编码后的字符串作为 cookie 的值附加到 cookie 中
			Path:     "/",     // 将 cookie 的路径设置为根目录
			Secure:   true,    // 启用安全标志，代表只有在 HTTPS 连接下才能传递该 cookie
			HttpOnly: true,    // 启用 HttpOnly 标志，禁止 JavaScript 访问该 cookie
		}
		http.SetCookie(w, cookie) // 将该 cookie 设置到响应的头部中并发送到客户端浏览器
	}
	fmt.Fprintln(w, "Hello World") // 输出 "Hello World" 到响应体中
}

// 读取 Cookie 的处理函数
func ReadCookieHandler(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("user"); err == nil { // 使用 r.Cookie 方法读取名为 user 的 Cookie
		u := &User{}                                             // 创建一个 User 实例
		if err = s.Decode("user", cookie.Value, u); err == nil { // 使用 securecookie 的 Decode 方法将字符串解码为 User 结构体
			fmt.Fprintf(w, "name:%s age:%d", u.Name, u.Age) // 将 User 实例的名称和年龄输出到响应体中
		}
	}
}

func main() {
	r := mux.NewRouter()                            // 创建一个新的路由器
	r.HandleFunc("/set_cookie", SetCookieHandler)   // 将 /set_cookie 路径映射到 SetCookieHandler 函数
	r.HandleFunc("/read_cookie", ReadCookieHandler) // 将 /read_cookie 路径映射到 ReadCookieHandler 函数
	http.Handle("/", r)                             // 设置根路径的路由处理器为 r
	log.Fatal(http.ListenAndServe(":8080", nil))    // 监听本地 8080 端口并启动 HTTP 服务，如果监听失败，则记录错误并退出
}
