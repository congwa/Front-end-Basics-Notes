package main

import (
	"flag"
	"fmt"
	"io"
	"net"
	"os"
)

// flag包
// flag 包提供了命令行参数解析功能，它可以帮助我们轻松地将命令行中传入的参数进行解析，并把解析结果存储到变量中。
// flag.StringVar()  用于注册一个字符串参数，方法注册命令行参数的名称、默认值和用途说明等信息
// flag.IntVar()  用于注册一个数字型的命令行参数，方法注册命令行参数的名称、默认值和用途说明等信息
// flag.BoolVar() 用于注册一个布尔型的命令行参数，，方法注册命令行参数的名称、默认值和用途说明等信息
// flag.Parse() 方法来解析命令行参数。这个方法会尝试解析所有命令行参数，并存储到对应的变量中。

type Client struct {
	ServerIp   string
	ServerPort int
	Name       string
	conn       net.Conn
	flag       int //当前client的模式
}

func NewClient(serverIp string, serverPort int) *Client {
	client := &Client{
		ServerIp:   serverIp,
		ServerPort: serverPort,
		flag:       999,
	}

	// 创建连接
	// net.Dial() 是一个用于创建网络连接的函数。它可以创建 TCP、UDP、ICMP 等协议的网络连接，并返回一个连接对象。
	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", serverIp, serverPort))

	if err != nil {
		fmt.Println(">>>> 连接服务器失败")
		return nil
	}
	client.conn = conn

	return client
}

func (c *Client) DealResponse() {
	io.Copy(os.Stdout, c.conn)
}

func (c *Client) SelectUsers() {
	fmt.Println(">>>> 选择用户")
	sendMsg := "who\n"
	_, err := c.conn.Write([]byte(sendMsg))
	if err != nil {
		fmt.Println(">>>> 发送消息失败", err)
		return
	}
}

func (c *Client) menu() bool {
	var flag int
	fmt.Println("1. 公聊模式")
	fmt.Println("2. 私聊模式")
	fmt.Println("3. 更新用户名")

	fmt.Scanln(&flag)
	if flag >= 1 && flag <= 3 {
		c.flag = flag
		return true
	} else {
		fmt.Println(">>>> 输入有误,请重新输入")
		return false
	}
}

func (c *Client) PublicChat() {
	fmt.Println(">>>> 公聊模式")

	var chatMsg string

	fmt.Println(">>>> 请输入聊天内容:,exit退出:")
	fmt.Scanln(&chatMsg)

	for chatMsg != "exit" {
		// 发送给服务器

		// 消息不为空则发送
		if len(chatMsg) != 0 {
			sendMsg := chatMsg + "\n"
			_, err := c.conn.Write([]byte(sendMsg))
			if err != nil {
				fmt.Println(">>>> 发送消息失败", err)
				break
			}
		}
		chatMsg = ""
		fmt.Println(">>>> 请输入聊天内容:,exit退出:")
		fmt.Scanln(&chatMsg)
	}
}
func (c *Client) PrivateChat() {
	fmt.Println(">>>> 私聊模式")

	var remoteName string
	var chatMsg string

	c.SelectUsers()

	fmt.Println(">>>> 请输入聊天对象的名称[用户名],exit退出:")
	fmt.Scanln(&remoteName)

	for remoteName != "exit" {
		fmt.Println(">>>> 请输入聊天内容:")
		fmt.Scanln(&chatMsg)

		for chatMsg != "exit" {
			if len(chatMsg) != 0 {
				fmt.Println(">>>> 发送到", remoteName, "的消息:", chatMsg)
				sendMsg := "to|" + remoteName + "|" + chatMsg + "\n"
				_, err := c.conn.Write([]byte(sendMsg))
				if err != nil {
					fmt.Println(">>>> 发送消息失败", err)
					break
				}
			}

			chatMsg = ""
			fmt.Println(">>>> 请输入聊天内容:,exit退出:")
			fmt.Scanln(&chatMsg)
		}
		c.SelectUsers()
		fmt.Println(">>>> 请输入聊天对象的名称[用户名],exit退出:")
		fmt.Scanln(&remoteName)
	}
}

func (c *Client) UpdateName() bool {
	fmt.Println(">>>> 更新用户名")

	fmt.Println(">>>> 请输入用户名:")
	fmt.Scanln(&c.Name)

	sendMsg := "rename|" + c.Name + "\n"
	_, err := c.conn.Write([]byte(sendMsg))
	if err != nil {
		fmt.Println(">>>> 更新用户名失败", err)
		return false
	}
	return true
}
func (c *Client) Run() {
	for c.flag != 0 {
		//c.menu() != true
		for !c.menu() {
		}

		switch c.flag {
		case 1:
			c.PublicChat()
			break
		case 2:
			c.PrivateChat()
			break
		case 3:
			c.UpdateName()
			break
		}

	}
}

var serverIp string
var serverPort int

func init() {
	flag.StringVar(&serverIp, "ip", "127.0.0.1", "设置服务器IP地址(默认是127.0.0.1)")
	flag.IntVar(&serverPort, "prot", 8888, "设置服务器端口(默认是8888)")
}

func main() {
	flag.Parse()
	client := NewClient("127.0.0.1", 8888)
	if client == nil {
		fmt.Println(">>>> 连接服务器失败")
		return
	}
	//单独开启一个goroutine去处理server的回执消息
	go client.DealResponse()

	fmt.Println(">>>> 链接服务器成功")
	client.Run()
}
