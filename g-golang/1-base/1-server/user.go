package main

import (
	"fmt"
	"net"
	"strings"
)

// strings包是Go语言内置的一个标准库，提供了一系列用于操作字符串的函数。使用这些函数可以对字符串进行切割、分隔、查找、替换等常见操作。
// strings.Split：按照指定分隔符对字符串进行切割，返回一个字符串数组。
// strings.Join：将字符串数组按照指定分隔符拼接成一个字符串。
// strings.Replace：将字符串中的旧子串替换为新子串。
// strings.HasPrefix：判断字符串是否以指定前缀开头。
// strings.HasSuffix：判断字符串是否以指定后缀结尾。
// strings.Contains：判断字符串是否包含指定子串。
// strings.Index：查找子串在字符串中第一次出现的位置。
// strings.LastIndex：查找子串在字符串中最后一次出现的位置。

type User struct {
	Name string
	Addr string
	C    chan string

	// conn net.Conn接口类型，我们可以创建一个网络连接对象，然后使用该对象进行数据的读写等操作。Conn接口包含了一些常用的方法，如Read()、Write()、Close()等，可以让程序员在开发网络应用时更加方便地操作数据
	conn net.Conn

	server *Server
}

func NewUser(conn net.Conn, server *Server) *User {
	userAddr := conn.RemoteAddr().String()

	fmt.Println("上线用户名为:", userAddr)

	user := &User{
		Name: userAddr,
		Addr: userAddr,
		C:    make(chan string),
		conn: conn,

		server: server,
	}

	go user.ListenMessage()

	return user
}

// 用户上线
func (u *User) Online() {
	fmt.Println("储存在线用户:", u.Name)
	u.server.mapLock.Lock()
	u.server.OnlineMap[u.Name] = u
	u.server.mapLock.Unlock()
	u.server.BroadCast(u, "已上线")
}

// 用户下线
func (u *User) Offline() {
	u.server.mapLock.Lock()
	delete(u.server.OnlineMap, u.Name)
	u.server.mapLock.Unlock()

	u.server.BroadCast(u, "已经下线")
}

func (u *User) DoMessage(msg string) {
	if msg == "who" {
		// 查询当前用户有哪些

		u.server.mapLock.Lock()
		for _, user := range u.server.OnlineMap {
			onlineMsg := "[" + user.Addr + "]" + user.Name + ":" + "在线"
			u.SendMsg(onlineMsg)
		}
		u.server.mapLock.Unlock()
	} else if len(msg) > 7 && msg[:7] == "rename|" {
		// 改名
		newName := strings.Split(msg, "|")[1]

		// 判断当前用户是否存在
		_, ok := u.server.OnlineMap[newName]
		if ok {
			u.SendMsg("当前用户名已经存在\n")
		} else {
			u.server.mapLock.Lock()
			delete(u.server.OnlineMap, u.Name)
			u.server.OnlineMap[newName] = u
			u.server.mapLock.Unlock()

			u.Name = newName
			u.SendMsg("您已经更新用户名:" + u.Name + "\n")
		}
	} else if len(msg) > 4 && msg[:3] == "to|" {
		// 消息格式: to|张三|消息内容
		// 1 获取对方用户名
		remoteName := strings.Split(msg, "|")[1]
		if remoteName == "" {
			u.SendMsg("消息格式不正确请使用 \"to|张三|你好啊\"格式。\n")
			return
		}

		//2 根据用户名 得到对方的User对象
		remoteUser, ok := u.server.OnlineMap[remoteName]
		if !ok {
			u.SendMsg("该用户名不存在\n")
			return
		}

		// 获取消息内容， 通过对方的User对象将消息发送给对方
		content := strings.Split(msg, "|")[2]
		if content == "" {
			u.SendMsg("消息内容不能为空\n")
			return
		}
		remoteUser.SendMsg(u.Name + "对你说:" + content)
	} else {
		u.server.BroadCast(u, msg)
	}
}

func (u *User) SendMsg(msg string) {
	u.conn.Write([]byte(msg + "\n"))
}

// 监听当前User channel的方法，一旦有消息，就直接法功给对端客户端
func (u *User) ListenMessage() {
	for {
		msg := <-u.C

		u.conn.Write([]byte(msg + "\n"))
	}
}
