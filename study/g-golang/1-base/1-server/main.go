package main

import (
	"fmt"
	"io"
	"net"
	"sync"
	"time"
)

type Server struct {
	Ip   string
	Port int

	OnlineMap map[string]*User

	// sync.RWMutex 一个读写锁
	// 多个 goroutine 同时访问一个 map 变量时可能会引发并发访问和写冲突的问题，为了避免这种情况，可以使用读写锁（RWMutex）进行保护
	// 多个 goroutine 可以同时持有读锁进行读操作，但只有一个 goroutine 可以持有写锁进行写操作，当一个 goroutine 持有写锁时，所有的其他 goroutine 都无法获得任何读写锁。通过使用读写锁，可以提高程序的效率和并发能力。
	// mapLock 变量是一个读写锁，可以用于对某个 map 变量进行并发的读写操作,使用 mapLock.Lock() 和 mapLock.Unlock() 方法进行写锁的加锁和解锁,使用 mapLock.RLock() 和 mapLock.RUnlock() 方法进行读锁的加锁和解锁
	mapLock sync.RWMutex

	// 消息的广播channel
	Message chan string
}

// 创建一个server的接口
func NewServer(ip string, port int) *Server {
	server := &Server{
		Ip:        ip,
		Port:      port,
		OnlineMap: make(map[string]*User),
		Message:   make(chan string),
	}

	return server
}

// 监听Message广播消息channel的goroutine, 一旦有消息就发送给全部在线的User
func (s *Server) ListenMessager() {
	for {
		msg := <-s.Message

		//将msg发送给全部的在线User
		s.mapLock.Lock()
		for _, user := range s.OnlineMap {
			user.C <- msg
		}
		s.mapLock.Unlock()
	}
}

func (s *Server) Handler(conn net.Conn) {
	// 当前的链接
	fmt.Println("链接建立成功")
	// 创建一个user实例
	user := NewUser(conn, s)
	user.Online()

	// 监听用户是否活跃的channel
	isLive := make(chan bool)

	// 接收客户端发送的消息
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := conn.Read(buf)
			if n == 0 {
				user.Offline()
				return
			}
			// io.EOF是一个预定义的错误变量，表示输入/输出操作已到达文件的结尾（end of file）
			// 如果读取已经结束
			if err != nil && err != io.EOF {
				fmt.Println("read err:", err)
				return
			}

			// 提取用户的消息(去除'\n')
			msg := string(buf[:n-1])

			// 用户针对msg进行消息处理
			user.DoMessage(msg)

			// 用户的任意消息，代表当前用户是一个活跃的用户
			isLive <- true
		}
	}()
	// 当前handler阻塞，for循环是为了重置定时器
	for {
		select {
		case <-isLive:
			// 当前用户是活跃的,应该重置定时器
			// 不做任何事情，为了激活select，更新下面的定时器
		case <-time.After(time.Second * 60): //time.After(time.Second * 60) 是 Go 语言中的一个方法，用于创建一个定时器（timer），表示在指定的时间段之后发送当前时间到一个通道（channel）中。
			// 定时器到期了,关闭连接 超时了
			user.SendMsg("你已经超时了,把你释放掉")

			// 销毁用的资源,关闭这个通道
			// 通道的关闭是一种广播机制，即关闭通道会同时通知所有正在等待该通道的代码。如果我们在一个已经关闭的通道上进行接收操作，会得到一个默认值（如 0、"" 或者 nil），而不会因为通道已经关闭而发生阻塞。
			close(user.C)

			//关闭连接
			conn.Close()

			// 这里区分下return 和 runtime.Goexit()
			// 退出当前handler
			// runtime.Goexit()
			return
			// runtime.Goexit() 会立即终止当前 goroutine 的执行，但不会影响其他的 goroutine。runtime.Goexit() 会直接终止当前的 goroutine，其后的代码都不会执行。与 return 不同的是，runtime.Goexit() 并不会返回到调用它的上级函数中，而是直接结束当前 goroutine。这意味着在这个函数中还有一些操作未完成，比如 defer 函数等，它们会被执行。
			// return 会导致当前函数的退出，如果在 main() 函数中使用 return，会导致整个程序的退出。return 会终止 Handler 函数并返回到调用该函数的地方。也就是说，执行 return 后，Handler 函数结束，控制权回到了调用它的上级函数中。
		}
	}
}

func (s *Server) Start() {
	// socket listen
	listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", s.Ip, s.Port))
	if err != nil {
		fmt.Println("net.listen err:", err)
	}
	// close listen socket
	defer listener.Close()

	go s.ListenMessager()

	for {
		// accept
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("listener accept err:", err)
			continue
		}

		// do handler
		go s.Handler(conn)
	}
}

// 对用户消息进行广播
func (s *Server) BroadCast(user *User, msg string) {
	sendMsg := "[" + user.Addr + "]" + user.Name + ":" + msg
	s.Message <- sendMsg
}

func main() {
	fmt.Println("服务启动成功!127.0.0.1:8888")
	server := NewServer("127.0.0.1", 8888)
	server.Start()

}
