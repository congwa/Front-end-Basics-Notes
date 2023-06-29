# os/exec

```go
func main() {
  cmd := exec.Command("cal")
  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }
}
```

1. 调用exec.Command传入命令名，创建一个命令对象exec.Cmd
2. 接着调用该命令对象的Run()方法运行它


## 显示输出

将exec.Cmd对象的Stdout和Stderr这两个字段都设置为os.Stdout，那么输出内容都将显示到标准输出

```go
func main() {
  cmd := exec.Command("cal")
  cmd.Stdout = os.Stdout
  cmd.Stderr = os.Stderr
  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }
}
```

## 输出到文件

```go
func main() {
  f, err := os.OpenFile("out.txt", os.O_WRONLY|os.O_CREATE, os.ModePerm)
  if err != nil {
    log.Fatalf("os.OpenFile() failed: %v\n", err)
  }

  cmd := exec.Command("cal")
  // *os.File实现了io.Writer接口
  cmd.Stdout = f
  cmd.Stderr = f
  err = cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }
}

// $ cat out.txt
//     November 2022   
// Su Mo Tu We Th Fr Sa
//        1  2  3  4  5
//  6  7  8  9 10 11 12
// 13 14 15 16 17 18 19
// 20 21 22 23 24 25 26
// 27 28 29 30
```

打开或创建文件，然后将文件句柄赋给exec.Cmd对象的Stdout和Stderr这两个字段即可实现输出到文件的功能

os.OpenFile打开一个文件，指定os.O_CREATE标志让操作系统在文件不存在时自动创建一个，返回该文件对象*os.File。*os.File实现了io.Writer接口


## 发送到网络

```go
// http.ResponseWriter 接口继承了 io.Writer 接口的方法，并且可以将 http.ResponseWriter 视为 io.Writer 的具体实现
func cal(w http.ResponseWriter, r *http.Request) {
  year := r.URL.Query().Get("year")
  month := r.URL.Query().Get("month")

  cmd := exec.Command("cal", month, year)
  cmd.Stdout = w
  cmd.Stderr = w

  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }
}

func main() {
  http.HandleFunc("/cal", cal)
  http.ListenAndServe(":8080", nil)
}
```

exec.Command函数接收一个字符串类型的可变参数作为命令的参数：

```go
func Command(name string, arg ...string) *Cmd
```


## 保存到内存对象中

`*bytes.Buffer`同样也实现了io.Writer接口

```go
func main() {
  // *bytes.Buffer同样也实现了io.Writer接口
  buf := bytes.NewBuffer(nil)
  cmd := exec.Command("cal")

  // buf := bytes.NewBuffer(nil) 已经实现了io.Writer接口
  cmd.Stdout = buf
  cmd.Stderr = buf
  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }

  fmt.Println(buf.String())
}
//     November 2022   
// Su Mo Tu We Th Fr Sa
//        1  2  3  4  5
//  6  7  8  9 10 11 12
// 13 14 15 16 17 18 19
// 20 21 22 23 24 25 26
// 27 28 29 30
```

输出的字符串或字节切片这种模式是如此的普遍，并且使用便利，os/exec包提供了一个便捷方法：`CombinedOutput`


## 输出到多个目的地

输出到文件和网络，同时保存到内存对象

使用go提供的io.MultiWriter可以很容易实现这个需求。io.MultiWriter很方便地将多个io.Writer转为一个io.Writer


```go
func cal(w http.ResponseWriter, r *http.Request) {
  year := r.URL.Query().Get("year")
  month := r.URL.Query().Get("month")

  f, _ := os.OpenFile("out.txt", os.O_CREATE|os.O_WRONLY, os.ModePerm)
  buf := bytes.NewBuffer(nil)
  mw := io.MultiWriter(w, f, buf)

  cmd := exec.Command("cal", month, year)
  cmd.Stdout = mw
  cmd.Stderr = mw

  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }

  fmt.Println(buf.String())
}
```

调用io.MultiWriter将多个io.Writer整合成一个io.Writer，然后将cmd对象的Stdout和Stderr都赋值为这个io.Writer。这样，命令运行时产出的输出会分别送往http.ResponseWriter、*os.File以及*bytes.Buffer


## 运行命令，获取输出

运行命令，返回输出

exec.Cmd对象提供了一个便捷方法：CombinedOutput()。**该方法运行命令，将输出内容以一个字节切片返回便于后续处理**。

```go
func main() {
  cmd := exec.Command("cal")
  output, err := cmd.CombinedOutput()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }

  fmt.Println(string(output))
}
```


CombinedOutput()方法的实现很简单，先将标准输出和标准错误重定向到*bytes.Buffer对象，然后运行程序，最后返回该对象中的字节切片

```go
func (c *Cmd) CombinedOutput() ([]byte, error) {
  if c.Stdout != nil {
    return nil, errors.New("exec: Stdout already set")
  }
  if c.Stderr != nil {
    return nil, errors.New("exec: Stderr already set")
  }
  var b bytes.Buffer
  c.Stdout = &b
  c.Stderr = &b
  err := c.Run()
  return b.Bytes(), err
}
```

## 分别获取标准输出和标准错误

创建两个*bytes.Buffer对象，分别赋给exec.Cmd对象的Stdout和Stderr这两个字段，然后运行命令即可分别获取标准输出和标准错误

```go
func main() {
  cmd := exec.Command("cal", "15", "2012")
  var stdout, stderr bytes.Buffer
  cmd.Stdout = &stdout
  cmd.Stderr = &stderr
  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }

  fmt.Printf("output:\n%s\nerror:\n%s\n", stdout.String(), stderr.String())
}
```


## 标准输入

exec.Cmd对象有一个类型为io.Reader的字段Stdin。命令运行时会从这个io.Reader读取输入。

```go
func main() {
  cmd := exec.Command("cat")
  cmd.Stdin = bytes.NewBufferString("hello\nworld")
  cmd.Stdout = os.Stdout
  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }
}

// hello
// world
```

如果不带参数运行cat命令，则进入交互模式，cat按行读取输入，并且原样发送到输出。


Go标准库中compress/bzip2包只提供解压方法，并没有压缩方法。

利用Linux命令bzip2实现压缩。bzip2从标准输入中读取数据，将其压缩，并发送到标准输出。

```go
// 先压缩"hello world"字符串，然后解压，看看是否能得到原来的字符串
func bzipCompress(d []byte) ([]byte, error) {
  var out bytes.Buffer
  cmd := exec.Command("bzip2", "-c", "-9")
  cmd.Stdin = bytes.NewBuffer(d)
  cmd.Stdout = &out
  err := cmd.Run()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }

  return out.Bytes(), nil
}

func main() {
  data := []byte("hello world")
  compressed, _ := bzipCompress(data)
  r := bzip2.NewReader(bytes.NewBuffer(compressed))
  decompressed, _ := ioutil.ReadAll(r)
  fmt.Println(string(decompressed))
}

// hello world
```


## 环境变量

环境变量可以在一定程度上微调程序的行为，当然这需要程序的支持。


例如，设置ENV=production会抑制调试日志的输出。每个环境变量都是一个键值对。

exec.Cmd对象中有一个类型为[]string的字段Env。我们可以通过修改它来达到控制命令运行时的环境变量的目的。

```go
package main

import (
  "fmt"
  "log"
  "os"
  "os/exec"
)

func main() {
  cmd := exec.Command("bash", "-c", "./test.sh")

  nameEnv := "NAME=darjun"
  ageEnv := "AGE=18"

  newEnv := append(os.Environ(), nameEnv, ageEnv)
  // 环境变量
  cmd.Env = newEnv

  out, err := cmd.CombinedOutput()
  if err != nil {
    log.Fatalf("cmd.Run() failed: %v\n", err)
  }

  fmt.Println(string(out))
}
```


## 检查命令是否存在

一般在运行命令之前，我们通过希望能检查要运行的命令是否存在，如果存在则直接运行，否则提示用户安装此命令。

os/exec包提供了函数LookPath可以获取命令所在目录，如果命令不存在，则返回一个error

```go
func main() {
  path, err := exec.LookPath("ls")
  if err != nil {
    fmt.Printf("no cmd ls: %v\n", err)
  } else {
    fmt.Printf("find ls in path:%s\n", path)
  }

  path, err = exec.LookPath("not-exist")
  if err != nil {
    fmt.Printf("no cmd not-exist: %v\n", err)
  } else {
    fmt.Printf("find not-exist in path:%s\n", path)
  }
}

// find ls in path:C:\Program Files\Git\usr\bin\ls.exe
// no cmd not-exist: exec: "not-exist": executable file not found in %PATH%
```



