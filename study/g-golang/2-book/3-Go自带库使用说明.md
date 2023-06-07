# Go自带库使用说明

## Go 中的时间操作

Golang中与时间有关的操作，主要涉及到 time 包，核心数据结构是 time.Time，如下：

```go
type Time struct {
    wall uint64
    ext  int64
    loc *Location
}
```

### 1、获取时间相关函数

#### 1.1 获取当前时间

```go
// 返回当前时间，注意此时返回的是 time.Time 类型
now := time.Now()
fmt.Println(now)
// 当前时间戳
fmt.Println(now.Unix())
// 纳秒级时间戳
fmt.Println(now.UnixNano())
// 时间戳小数部分 单位：纳秒
fmt.Println(now.Nanosecond())
```

输出：

```go
2021-01-10 14:56:15.930562 +0800 CST m=+0.000124449
1610261775
1610261775930562000
930562000
```

#### 1.2 返回当前年月日时分秒、星期几、一年中的第几天等操作

```go
now := time.Now()
// 返回日期
year, month, day := now.Date()
fmt.Printf("year:%d, month:%d, day:%d\n", year, month, day)
// 年
fmt.Println(now.Year())
// 月
fmt.Println(now.Month())
// 日
fmt.Println(now.Day())
// 时分秒
hour, minute, second := now.Clock()
fmt.Printf("hour:%d, minute:%d, second:%d\n", hour, minute, second)
// 时
fmt.Println(now.Hour())
// 分
fmt.Println(now.Minute())
// 秒
fmt.Println(now.Second())
// 返回星期
fmt.Println(now.Weekday())
//返回一年中对应的第几天
fmt.Println(now.YearDay())
//返回时区
fmt.Println(now.Location())
// 返回一年中第几天
fmt.Println(now.YearDay())
```

#### 1.3 格式化时间

Go 语言提供了时间类型格式化函数 `Format()`，需要注意的是 Go 语言格式化时间模板不是常见的 `Y-m-d H:i:s`，而是 2006-01-02 15:04:05，也很好记忆(2006 1 2 3 4 5)。

```go
now := time.Now()
fmt.Println(now.Format("2006-01-02 15:04:05"))
fmt.Println(now.Format("2006-01-02"))
fmt.Println(now.Format("15:04:05"))
fmt.Println(now.Format("2006/01/02 15:04"))
fmt.Println(now.Format("15:04 2006/01/02"))
```

### 2、时间戳与日期字符串相互转化

时间戳转成日期格式，需要先转成将时间戳转成 `time.Time` 类型再格式化成日期格式。

#### 2.1 根据秒数、纳秒数返回 `time.Time` 类型

```go
now := time.Now()
layout := "2006-01-02 15:04:05"
t := time.Unix(now.Unix(),0)    // 参数分别是：秒数,纳秒数
fmt.Println(t.Format(layout))
```

#### 2.2 根据指定时间返回 `time.Time` 类型，使用函数 `time.Date()`

```go
now := time.Now()
layout := "2006-01-02 15:04:05"
//根据指定时间返回 time.Time 类型
//分别指定年，月，日，时，分，秒，纳秒，时区
t := time.Date(2011, time.Month(3), 12, 15, 30, 20, 0, now.Location())
fmt.Println(t.Format(layout))
```

### 2.3 日期字符串解析成 `time.Time` 类型

```go
t, _ := time.ParseInLocation("2006-01-02 15:04:05", time.Now().Format("2006-01-02 15:04:05"), time.Local)
fmt.Println(t)  
// 输出 2021-01-10 17:28:50 +0800 CST
// time.Local 指定本地时间
```

解析的时候需要特别注意时区的问题：

```go
fmt.Println(time.Now())
fmt.Println(time.Now().Location())
t, _ := time.Parse("2006-01-02 15:04:05", "2021-01-10 15:01:02")
fmt.Println(t)
```

输出：

```bash
2021-01-10 17:22:10.951904 +0800 CST m=+0.000094166
Local
2021-01-10 15:01:02 +0000 UTC
```

可以看到，`time.Now()` 使用的 CST(中国标准时间)，而 `time.Parse()` 默认的是 UTC(零时区)，它们相差 8 小时。所以解析时常用 `time.ParseInLocation()`，可以指定时区。![img](https://cdn.nlark.com/yuque/0/2021/gif/396745/1610587943191-e1905a90-4157-43d7-8623-c98b46969a36.gif)


### 3、计算、比较日期

讲到日期的计算就不得不提 time 包提供的一种新的类型 `Duration`，源码是这样定义的：

```go
type Duration int64
```

底层类型是 int64，表示一段时间间隔，单位是 纳秒。


### 3、计算、比较日期

讲到日期的计算就不得不提 time 包提供的一种新的类型 `Duration`，源码是这样定义的：

```go
type Duration int64
```

底层类型是 int64，表示一段时间间隔，单位是 纳秒。

#### 3.1 24小时之内的时间计算

```go
now := time.Now()
fmt.Println(now)
// 1小时1分1s之后
t1, _ := time.ParseDuration("1h1m1s")
fmt.Println(t1)
m1 := now.Add(t1)
fmt.Println(m1)
// 1小时1分1s之前
t2, _ := time.ParseDuration("-1h1m1s")
m2 := now.Add(t2)
fmt.Println(m2)
// 3小时之前
t3, _ := time.ParseDuration("-1h")
m3 := now.Add(t3 * 3)
fmt.Println(m3)
// 10 分钟之后
t4, _ := time.ParseDuration("10m")
m4 := now.Add(t4)
fmt.Println(m4)
// Sub 计算两个时间差
sub1 := now.Sub(m3)
fmt.Println(sub1.Hours())   // 相差小时数
fmt.Println(sub1.Minutes()) // 相差分钟数
```

额外再介绍两个函数 `time.Since()`、`time.Until()`：

```go
// 返回当前时间与 t 的时间差，返回值是 Duration
time.Since(t Time) Duration
// 返回 t 与当前时间的时间差，返回值是 Duration
time.Until(t Time) Duration

now := time.Now()
fmt.Println(now)
t1, _ := time.ParseDuration("-1h")
m1 := now.Add(t1)
fmt.Println(m1)
fmt.Println(time.Since(m1))
fmt.Println(time.Until(m1))
```

输出：

```bash
2021-01-10 20:41:48.668232 +0800 CST m=+0.000095594
2021-01-10 19:41:48.668232 +0800 CST m=-3599.999904406
1h0m0.000199007s
-1h0m0.000203035s
```

#### 3.2 24小时之外的时间计算

涉及到一天以外的时间计算，就需要用到 `time.AddDate()`，函数原型：

```go
func (t Time) AddDate(years int, months int, days int) Time
```

比如想知道 一年一个月零一天 之后的时间，就可以这样：

```go
now := time.Now()
fmt.Println(now)
m1 := now.AddDate(1,1,1)
fmt.Println(m1)
```

再比如，想获得 2 天之前时间：

```go
now := time.Now()
fmt.Println(now)
m1 := now.AddDate(0,0,-2)
fmt.Println(m1)
```

#### 3.3 日期比较

日期的比较总共有三种：之前、之后和相等。

```go
// 如果 t 代表的时间点在 u 之前，返回真；否则返回假。
func (t Time) Before(u Time) bool
// 如果 t 代表的时间点在 u 之后，返回真；否则返回假。
func (t Time) After(u Time) bool
// 比较时间是否相等，相等返回真；否则返回假。
func (t Time) Equal(u Time) bool

now := time.Now()
fmt.Println(now)
// 1小时之后
t1, _ := time.ParseDuration("1h")
m1 := now.Add(t1)
fmt.Println(m1)
fmt.Println(m1.After(now))
fmt.Println(now.Before(m1))
fmt.Println(now.Equal(m1))
```

输出：

```bash
2021-01-10 21:00:44.409785 +0800 CST m=+0.000186800
2021-01-10 22:00:44.409785 +0800 CST m=+3600.000186800
true
true
false
```

### 4、常见例子

下面列举一些常见的例子和函数封装。

#### 4.1 日期格式 转 时间戳

```go
func TimeStr2Time(fmtStr,valueStr, locStr string) int64 {
    loc := time.Local
    if locStr != "" {
        loc, _ = time.LoadLocation(locStr) // 设置时区
    }
    if fmtStr == "" {
        fmtStr = "2006-01-02 15:04:05"
    }
    t, _ := time.ParseInLocation(fmtStr, valueStr, loc)
    return t.Unix()
}
```

#### 4.2 获取当前时间日期格式

```go
func GetCurrentFormatStr(fmtStr string) string {
    if fmtStr == "" {
        fmtStr = "2006-01-02 15:04:05"
    }
    return time.Now().Format(fmtStr)
}
```

#### 4.3 时间戳 to 日期格式

```go
func Sec2TimeStr(sec int64, fmtStr string) string {
    if fmtStr == "" {
        fmtStr = "2006-01-02 15:04:05"
    }
    return time.Unix(sec, 0).Format(fmtStr)
}
```

## Go-regexp

```go
package main

import (
	"fmt"
	"regexp"
)

const text = "My email is ccmouse@gmail.com"

func main() {
	compile := regexp.MustCompile(`[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+`)
	match := compile.FindString(text)
	fmt.Println(match)
}
```


## Go存储基础 — 文件 IO 操作

![img](/study/imgs/cunchu.png)

### 两大 IO 分类

计算的体系架构，CPU，内存，网络，IO。那么 IO 是什么呢？一般理解成 Input、Output 的缩写，通俗话就是输入输出的意思。

IO 分为网络和存储 IO 两种类型（**其实网络 IO 和磁盘 IO 在 Go 里面有着根本性区别**）。网络 IO 对应的是网络数据传输过程，网络是分布式系统的基石，通过网络把离散的物理节点连接起来，形成一个有机的系统。

存储 IO 对应的就是数据存储到物理介质的过程，通常物理介质对应的是磁盘，磁盘上一般会分个区，然后在上面格式化个文件系统出来，所以普通程序员最常看见的是文件 IO 的形式。

在 Golang 里可以归类出两种读写文件的方式：

1. 标准库封装：操作对象 `File`;
2. 系统调用 ：操作对象 `fd`;

### 读写数据要素

文件的读写最核心的要素是什么？

通俗来讲：读文件，就是把磁盘上的文件的**特定位置**的数据读到**内存的 buffer** 。写文件，就是把**内存 buffer** 的数据写到磁盘的文件的**特定位置**。

这里注意到两个关键词：

1. 特定位置；
2. 内存 buffer；

**特定位置怎么理解？怎么指定所谓的**`特定位置`**？**

很简单，用 `[ offset, length ]` 这两个参数就能标识一段位置。

![offset](/study/imgs/offset.png)

也就是 IO 偏移和长度，Offset 和 Length。

**内存 buffer 怎么理解？**

归根结底，文件的数据和谁直接打交道？**内存**，写的时候是从内存写到磁盘文件的，读的时候是从磁盘文件读到内存的。

本质上，下面的 IO 函数都离不开 Offset，Length，buffer 这三个要素。

### 标准库封装

Go 对文件进行读写非常简单，因为 Go 已经封装了一个非常便捷的使用接口，位于标准库 os 中。Go 标准库对文件 IO 的封装也就是 Go 推荐对文件进行 IO 时使用的操作方式。

#### 打开文件（Open）

```go
func OpenFile(name string, flag int, perm FileMode) (*File, error)
```

Open 文件之后，获取到一个句柄，也就是 `File` 结构，之后对文件的读写都是基于 `File` 结构之上进行的。

```go
type File struct {
    *file // os specific
}
```

文件读写只需要针对这个句柄结构体做操作即可。

另外有一点隐藏起来的知识点必须要提一下：**偏移**。也就是最开始强调的读写 3 要素之一的 Offset 。打开（`Open`）文件的时候，文件当前偏移量默认设置为 0，也就是说 IO 的起始位置就是文件的最开头。举个例子，如果这个时候，写 4K 的数据到文件，那么就是写 [0, 4K] 这个位置的数据，如果之前这上面已经有数据了，那么就会是覆盖写。

除非 `Open` 文件的时候指定 `O_APPEND` 选项，偏移量会设置为文件末尾，那么 IO 都是从文件末尾开始。


#### 文件写操作（Write）

文件 `File` 句柄对象有两个写方法

第一种：写一个 buffer 到文件 ，使用文件当前偏移

```go
func (f *File) Write(b []byte) (n int, err error)
```

**注意：该写操作会导致文件偏移量的增加。**

第二种：从指定文件偏移，写入 buffer 到文件

```go
func (f *File) WriteAt(b []byte, off int64) (n int, err error)
```

**注意：该写操作不会更新文件偏移量**


#### 文件读操作（Read）

和写对应，文件 `File` 句柄对象有两个读方法：

第一种：从文件当前偏移读一个 buffer 的数据上来

```go
func (f *File) Read(b []byte) (n int, err error)
```

**注意：该读操作会导致文件偏移量的增加。**


第二种：从指定文件偏移，读一个 buffer 大小的数据上来

```go
func (f *File) ReadAt(b []byte, off int64) (n int, err error)
```

**注意：该读操作不会更新文件偏移量**

#### 指定偏移量（Seek）

```go
func (f *File) Seek(offset int64, whence int) (ret int64, err error)
```

这个句柄方法允许用户指定文件的偏移位置。这个很容易理解，举个例子，文件刚开始是 0 字节，写 1M 的数据下去，大小变成 1M，Offset 往后挪 1M ，默认就是往后挪。

现在 Seek 方法允许把写的偏移定位到任意位置，可以就可以从任意地方覆盖写入数据。

所以在 Go 里面，文件 IO 非常简单，先 Open 一个文件，拿到 `File` 句柄，然后就可以使用这个句柄 Write ，Read，Seek 就能进行 IO 了。


### 底层的原理

Go 的标准库 `os` 提供了极其方便的封装，深入最原始的本质可以发现最核心的东西：**系统调用**。

Go 标准库的文件存储 IO 就是基于系统调用之上的。可以稍微跟一下 `os.OpenFile` 的调用：

os 库的 `OpenFile` 函数：

```go
func OpenFile(name string, flag int, perm FileMode) (*File, error) {
    f, err := openFileNolog(name, flag, perm)
    if err != nil {
        return nil, err
    }
    f.appendMode = flag&O_APPEND != 0
    return f, nil
}
```

稍微看下 `openFileNolog` 函数：

```go
func openFileNolog(name string, flag int, perm FileMode) (*File, error) {
    var r int
    for {
        var e error
        r, e = syscall.Open(name, flag|syscall.O_CLOEXEC, syscallMode(perm))
        if e == nil {
            break
        }
        if runtime.GOOS == "darwin" && e == syscall.EINTR {
            continue
        }
        return nil, &PathError{"open", name, e}
    }
    return newFile(uintptr(r), name, kindOpenFile), nil
}
```

可以看到 `syscall.Open` ，这个函数获取到一个整数，也就是在 c 语言里最常见的 fd 句柄，而 `File` 结构体则仅仅是基于这个的一层封装而已。

**思考下，为什么会有标准库封装这一层存在？**

**划重点：为了屏蔽操作系统的区别**，使用这个标准库的所有操作都是跨平台的。换句话说，如果是特殊操作系统才有的特性，那么在 os 库里就找不到对应封装的 IO 操作。


![img](/study/imgs/iosys.png)

那么怎么使用系统调用？

直接使用 `syscall` 库，也就是系统调用。从名字也能看出来，系统调用是和操作系统强相关的，因为是操作系统提供的调用接口，所以系统调用会因为操作系统不同而导致不同的特性，不同的接口。


所以，如果直接使用 `syscall` 库来使用系统调用，那么需要自己来承受系统带来的兼容性问题。

### 系统调用

系统调用在 syscall 里有一层最基础的封装：

#### 文件 Open

```go
func Open(path string, mode int, perm uint32) (fd int, err error) 
```

#### 文件 Read

```go
func Read(fd int, p []byte) (n int, err error) func Pread(fd int, p []byte, offset int64) (n int, err error) 
```

文件读有两个接口，一个 `Read` 是从**当前默认偏移**读一个 buffer 数据，`Pread` 接口则是从指定位置读数据的接口。

思考一个问题：`Pread` 从效果上来讲等于 `Seek` 和 `Read` 组合起来使用，那么是否可以认为 `Pread` 就可以被 `Seek` + `Read` 替代呢？

不行！根本原因在于 `Seek` + `Read` 是在用户层就是两步操作，而 `Pread` 虽然是 `Seek` + `Read` 的效果，但是操作系统给到用户的语义是：`Pread` 是一个原子操作。还有一个重要区别，`Pread` 不会改变当前文件的偏移量（普通的 `Read` 调用会更新偏移量）。


**所以，总结下，**`**Pread**` **和顺序调用** `**Seek**` **后调用** `**Read**`  **有两点重要区别：**

1. `Pread` 对用户提供的语义是原子操作，在调用 `Pread` 时，无法中断 `Seek` 和 `Read` 操作；
2. `Pread` 调用不会更新当前文件偏移量；


#### 文件 Write

```go
func Write(fd int, p []byte) (n int, err error) func Pwrite(fd int, p []byte, offset int64) (n int, err error) 
```

文件写对应也是有两种接口，`Wrtie` 和 `Pwrite` 分别是对应 `Read` 和 `Pread` 。同样的，`Pwrite` 作用上也是相当于先调用 `Seek`  再调用 `Write` ，但是同样的也有**两点不同**：

1. `Pwrite`  完成 `Seek` 和 `Write` 对外是原子操作的语义；
2. `Pwrite` 调用不会更新当前文件偏移量；

#### 文件 Seek

```go
func Seek(fd int, offset int64, whence int) (off int64, err error) 
```

这个函数调用允许用户指定偏移（这个会影响到 `Read` 和 `Write` 读写的位置）。一般来说，每个打开文件都有一个相关联的“当前文件偏移量”（ current file offset ）。读（`Read`）、写（`Write`）操作都是从**当前文件偏移量处**开始，并且 `Read` 和 `Write` 会导致偏移量增加，增加量就是所读写的字节数。

**小结一下**：Go核心的 Open，Read，Write，Seek 几个系统调用，可以发现一个明显不同与标准 IO 库的区别：**系统调用操作对象是一个整数句柄**。`Open` 文件得到一个整数 fd，之后的所有 IO 都是针对这个 fd 来操作的。这个明显和标准库不同，os 标准库 OpenFile 得到的是一个 `File` 结构体，所有的 IO 也是针对这个结构体的。


### 层次架构

那么究竟封装的层次一般是什么样的呢， Unix 编程里面开篇就有一张如下图：

![layer](/study/imgs/layer.png)

- 内核是最核心的实现，包括了和 IO 设备，硬件交互等功能。与内核紧密的一层是内核提供给外部调用的系统调用，系统调用提供了用户态到内核态调用的一个通道；
- 对于系统调用，各个语言的标准库会有一些封装，比如 **C 语言的 libc 库，Go 语言的 os ，syscall 库都是类似的地位，这个就是所谓的公共库**。这层封装的作用最主要是简化普通程序员使用效率，并且屏蔽系统细节，为跨平台提供基础（同样的，为了跨平台的特性，可能会阉割很多不兼容的功能，所以才会有直接调用系统掉调用的需求）；

#### 总结一下

1. IO 大类分为网络 IO 和磁盘 IO，IO 对文件来说就是读写操作，写的时候**数据从内存到磁盘**，读的时候**数据从磁盘到内存**；
2. Go 文件 IO 最常用的是 os 库，使用 Go 封装的标准库，`os.OpenFile` 打开，`File.Write`，`File.Read` 进行读写，操作对象都是 `File` 结构体；

1. Go 标准库对 IO 的封装是为了屏蔽复杂的系统调用，提供跨平台的使用姿势。然后单独提供 `syscall` 库，让程序员自我决策使用要使用更丰富的系统调用功能，当然后果自负；
2. Go 标准库 IO 操作对象是 `File` ，系统调用 IO 操作对象是 fd（非负整数）。

1. `Open` 文件默认当前偏移量是 0 （文件最开始），加上 `O_APPEND` 参数之后偏移量会是文件末尾。通过 Seek 调用可以任意指定文件偏移，从而影响文件 IO 的位置；
2. `Read`，`Write` 函数只有 buffer （buffer 有长度），偏移则使用当前文件偏移量；

1. `Pread`，`Pwrite` 的系统调用效果等同于 `Seek` 偏移量然后 `Read`，`Write`，但是又大有不同。对外语义是原子操作，并且不更新当前文件偏移量；


### Go - 文件读写操作

#### 读写文件

```go
package main

import (
	"bufio"  // 带缓冲的io操作支持
	"fmt"
	"io"
	"os"
)

/*在已存在文件清空原有内容进行追加*/
func main() {
	filePath := "D:\\fcofficework\\DNS\\1.txt"
    /*
    *   os.O_RDWR表示以可读写的方式打开文件，即既可以读取文件内容，也可以写入文件内容。
    *   os.O_APPEND表示在写入数据时，会将数据添加到文件末尾而不是覆盖原有的文本内容。如果不加这个标志，则写入数据时会覆盖原有的文本内容。
    *   os.O_RDWR|os.O_APPEND实际上是将读写模式和追加模式结合起来的一个标志位，用于以可读写的方式打开一个文件，并向其中追加数据
    */
	file, err := os.OpenFile(filePath, os.O_RDWR|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("open file err = %v\n", err)
		return
	}
	/*关闭文件流*/
	defer file.Close()
	/*读取*/
	reader := bufio.NewReader(file)
    // 循环读取每一行输出
	for {
		str, err := reader.ReadString('\n')
        // 文件结束标志，表示读取到了文件末尾
		if err == io.EOF {
			break
		}
		fmt.Print(str)
	}
	/*写入文件*/
	str := "hello FCC您好！！！\r\n"
    // 写入器是带缓冲
	writer := bufio.NewWriter(file)
	for i := 0; i < 5; i++ {
		writer.WriteString(str)
	}
	/*因为writer是带缓存的，需要通过flush到磁盘*/
	writer.Flush()
}
```

#### 文件内容拷贝至新文件

`io/ioutil`是Go语言标准库中的一个包，提供了一些基本的文件操作函数，它可以方便地读写文件数据，以及对文件进行简单的操作。

`io/ioutil`包主要提供了以下几个函数：

- `ReadFile(filename string) ([]byte, error)` 用来读取文件的内容，并返回字节切片和错误信息。该函数会在完成读取后自动关闭文件。
- `WriteFile(filename string, data []byte, perm os.FileMode) error` 用来将字节切片`data`写入文件，并返回错误信息。如果文件不存在，则根据指定的权限创建文件。
- `ReadDir(dirname string) ([]os.FileInfo, error)` 用来获取目录下所有文件列表，并返回文件信息列表和错误信息。
- `TempFile(dirName, prefix string) (*os.File, error)` 用来在指定目录下创建一个新的临时文件，并返回该文件的句柄和错误信息。

```go
package main

import (
	"fmt"
	"io/ioutil"
)

/*将文件1的内容拷贝到文件2*/
func main() {
	file1Path := "D:\\fcofficework\\DNS\\1.txt"
	file2Path := "D:\\fcofficework\\DNS\\2.txt"
	data, err := ioutil.ReadFile(file1Path)
	if err != nil {
		fmt.Printf("read file err=%v", err)
		return
	}
	err = ioutil.WriteFile(file2Path, data, 0666)
	if err != nil {
		fmt.Printf("write file err=%v\n", err)
	}
}
```

#### 判断文件或者目录是否存在

```go
package main

import (
	"fmt"
	"os"
)

/*判断文件以及目录是否存在*/
func PathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		fmt.Println("当前文件存在！")
		return true, nil
	}
	if os.IsNotExist(err) {
		fmt.Println("当前文件不存在！")
		return false, nil
	}
	return false, nil
}

func main() {
	path := "D:\\fcofficework\\2.txt"
	PathExists(path)
}
```

#### 文件的拷贝


```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
)

/*文件的拷贝*/

func CopyFile(dstFileName string, srcFileName string) (written int64, err error) {
	srcFile, err := os.Open(srcFileName)
	if err != nil {
		fmt.Printf("open file err=%v\n", err)
	}
	reader := bufio.NewReader(srcFile)
    // os.O_WRONLY表示以只写模式打开文件，即仅能写入文件内容，不能读取文件内容；
    // os.O_CREATE表示如果指定的文件不存在
	dstFile, err := os.OpenFile(dstFileName, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		fmt.Printf("open file err=%v\n", err)
		return
	}
	writer := bufio.NewWriter(dstFile)
	defer dstFile.Close()
	return io.Copy(writer, reader)
}

func main() {
	srcFile := "D:\\Photos\\Datapicture\\mmexport1530688562488.jpg"
	dstFile := "D:\\Photos\\1.jpg"
	_, err := CopyFile(dstFile, srcFile)
	if err == nil {
		fmt.Println("拷贝完成！")
	} else {
		fmt.Println("拷贝失败，err=", err)
	}
}
```

#### 读取文件并统计文件中字符的个数

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
)

/*统计文件的字符个数*/

type CharCount struct {
	/*英文的个数*/
	ChCount int
	/*数字的个数*/
	NumCount int
	/*空格的个数*/
	SpaceCount int
	/*其他字符的个数*/
	OtherCount int
}

func main() {
	fileName := "D:\\fcofficework\\DNS\\1.txt"
	file, err := os.Open(fileName)
	if err != nil {
		fmt.Printf("open file err=%v\n", err)
		return
	}
	defer file.Close()
	var count CharCount
	reader := bufio.NewReader(file)
	for {
		str, err := reader.ReadString('\n')
		if err == io.EOF {
			break
		}
		for _, v := range str {
			switch {
			case v >= 'a' && v <= 'z':
				fallthrough
			case v >= 'A' && v <= 'Z':
				count.ChCount++
			case v == ' ' || v == '\t':
				count.SpaceCount++
			case v >= '0' && v <= '9':
				count.NumCount++
			default:
				count.OtherCount++
			}
		}
	}
	fmt.Printf("字符的个数为：%v 数字的个数为：%v 空格的个数为：%v 其他字符的个数为：%v",
		count.ChCount, count.NumCount, count.SpaceCount, count.OtherCount)
}
```

#### 三种读取文件的方式

##### 通过os读取

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	file, err := os.Open("d:\\Photos\\Screenshots\\暗物质\\IMG_20180927_194619.jpg")
	if err != nil {
		fmt.Println("open file err", err)
	}
	fmt.Printf("file=%v", file)
	err1 := file.Close()
	if err1 != nil {
		fmt.Println("close file err = ", err1)
	}
}

```

##### 缓冲式读取文件

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
)

/*缓冲式读取文件*/
func main() {
	file, err := os.Open("d:\\Photos\\Screenshots\\暗物质\\IMG_20180927_194619.jpg")
	if err != nil {
		fmt.Println("open file err", err)
	}
	defer file.Close()
	reader := bufio.NewReader(file)
	for {
		str, err := reader.ReadString('\n')
		if err == io.EOF {
			break
		}
		fmt.Print(str)
	}
	fmt.Println("文件读取结束!")
}
```

##### 通过ioutil读取

```go
package main

import (
	"fmt"
	"io/ioutil"
)

func main() {
	file := "D:\\fcofficework\\DNS\\authorized_keys"
	content, err := ioutil.ReadFile(file)
	if err != nil {
		fmt.Printf("read file err=%v", err)
	}
	fmt.Printf("%v", string(content))
}
```

#### 文件写入案例

##### 在文件写入内容，没有则重新创建

```go

package main

import (
	"bufio"
	"fmt"
	"os"
)

/*在文件写入内容，没有文件则重新创建*/
func main() {
	filePath := "D:\\fcofficework\\DNS\\1.txt"
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		fmt.Printf("open file err = %v\n", err)
		return
	}
	defer file.Close()
	str := "hello world\r\n"
	writer := bufio.NewWriter(file)
	for i := 0; i < 5; i++ {
		writer.WriteString(str)
	}
	/*因为writer是带缓存的，需要通过flush到磁盘*/
	writer.Flush()
}

```

##### 在已存在文件清空原有内容重新写入

```go

package main

import (
	"bufio"
	"fmt"
	"os"
)

/*在已存在文件清空原有内容重新写入*/
func main() {
	filePath := "D:\\fcofficework\\DNS\\1.txt"
    // os.O_WRONLY表示以只写模式打开文件，即仅能写入文件内容，不能读取文件内容；
    // os.O_TRUNC表示在打开文件后先清空文件内容，然后再进行写入操作
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_TRUNC, 0666)
	if err != nil {
		fmt.Printf("open file err = %v\n", err)
		return
	}
	defer file.Close()
	str := "hello FCC\r\n"
	writer := bufio.NewWriter(file)
	for i := 0; i < 5; i++ {
		writer.WriteString(str)
	}
	/*因为writer是带缓存的，需要通过flush到磁盘*/
	writer.Flush()
}

```

##### 在已存在文件清空原有内容进行追加

```go

package main

import (
	"bufio"
	"fmt"
	"os"
)

/*在已存在文件清空原有内容进行追加*/
func main() {
	filePath := "D:\\fcofficework\\DNS\\1.txt"
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("open file err = %v\n", err)
		return
	}
	defer file.Close()
	str := "hello FCC您好！！！\r\n"
	writer := bufio.NewWriter(file)
	for i := 0; i < 5; i++ {
		writer.WriteString(str)
	}
	/*因为writer是带缓存的，需要通过flush到磁盘*/
	writer.Flush()
}

```

#### 解析命令行参数

```go
package main

import (
	"fmt"
	"os"
)

/*解析命令行参数*/
func main() {
	fmt.Println("命令行参数有：", len(os.Args))
	for i, v := range os.Args {
		fmt.Printf("args[%v]=%v\n", i, v)
	}
}

package main

import (
	"flag"
	"fmt"
)

/*解析命令行参数*/
func main() {
	var user string
	var pwd string
	var host string
	var port int
	flag.StringVar(&user, "u", "", "用户名，默认为空")
	flag.StringVar(&pwd, "pwd", "", "密码，默认为空")
	flag.StringVar(&host, "h", "localhost", "主机名，默认为空")
	flag.IntVar(&port, "port", 3306, "端口号，默认为空")
	/*转换*/
	flag.Parse()
	fmt.Printf("user=%v pwd=%v host=%v port=%v", user, pwd, host, port)
}
```


## Go-JSON序列化

### 序列化

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Monster struct {
	Name     string  `json:"name"`
	Age      int     `json:"age"`
	Birthday string  `json:"birthday"`
	Sal      float64 `json:"sal"`
	Skill    string  `json:"skill"`
}

/*结构体序列化*/
func NewMinsterStruct() {
	monster := Monster{
		Name:     "孙悟空",
		Age:      500,
		Birthday: "2011-11-11",
		Sal:      8000.0,
		Skill:    "如意七十二变",
	}
	data, err := json.Marshal(&monster)
	if err != nil {
		fmt.Printf("序列化错误err：%v\n", err)
	}
	fmt.Printf("Map序列化后=%v\n", string(data))
}

/*Map序列化*/
func MapSerlizer() {
	var a map[string]interface{}
	a = make(map[string]interface{})
	a["name"] = "牛魔王"
	a["age"] = 10
	a["address"] = "火云洞"
	data, err := json.Marshal(a)
	if err != nil {
		fmt.Printf("序列化错误err：%v\n", err)
	}
	fmt.Printf("monster序列化后=%v\n", string(data))
}

/*切片序列化*/
func SliceSerlizer() {
	var slice []map[string]interface{}
	var m1 map[string]interface{}
	m1 = make(map[string]interface{})
	m1["name"] = "TGH"
	m1["age"] = "19"
	m1["address"] = "北京"
	slice = append(slice, m1)

	var m2 map[string]interface{}
	m2 = make(map[string]interface{})
	m2["name"] = "FCC"
	m2["age"] = "18"
	m2["address"] = [2]string{"华府", "影视帝国"}
	slice = append(slice, m2)

	data, err := json.Marshal(slice)
	if err != nil {
		fmt.Printf("序列化错误err：%v\n", err)
	}
	fmt.Printf("切片序列化后=%v\n", string(data))
}

/*基本数据类型序列化*/
func FloatSerlize() {
	var num1 float64 = 245.56
	data, err := json.Marshal(num1)
	if err != nil {
		fmt.Printf("序列化错误err：%v\n", err)
	}
	fmt.Printf("基本数据类型序列化后=%v\n", string(data))
}

func main() {
	NewMinsterStruct()
	MapSerlizer()
	SliceSerlizer()
	FloatSerlize()
}
// Map序列化后={"name":"孙悟空","age":500,"birthday":"2011-11-11","sal":8000,"skill":"如意七十二变"}
// monster序列化后={"address":"火云洞","age":10,"name":"牛魔王"}
// 切片序列化后=[{"address":"北京","age":"19","name":"TGH"},{"address":["华府","影视帝国"],"age":"18","name":"FCC"}]
// 基本数据类型序列化后=245.56
```

### 反序列化

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Monster struct {
	Name     string  `json:"name"`
	Age      int     `json:"age"`
	Birthday string  `json:"birthday"`
	Sal      float64 `json:"sal"`
	Skill    string  `json:"skill"`
}

func unmarshalStruct() {
	str := "{\"name\":\"孙悟空\",\"age\":500,\"birthday\":\"2011-11-11\",\"sal\":8000,\"skill\":\"如意七十二变\"}"
	var monster Monster
	err := json.Unmarshal([]byte(str), &monster)
	if err != nil {
		fmt.Printf("反序列化失败err：%v\n", err)
	}
	fmt.Printf("反序列化后monster：%v\n", monster)
}

func unmarshallMap() {
	str := "{\"address\":\"火云洞\",\"age\":10,\"name\":\"牛魔王\"}"
	var a map[string]interface{}
	err := json.Unmarshal([]byte(str), &a)
	if err != nil {
		fmt.Printf("反序列化失败err：%v\n", err)
	}
	fmt.Printf("反序列化Map后：%v\n", a)
}

func unmarshalSlice() {
	str := "[{\"address\":\"北京\",\"age\":\"19\",\"name\":\"TGH\"}," +
		"{\"address\":[\"华府\",\"影视帝国\"],\"age\":\"18\",\"name\":\"FCC\"}]"
	var slice []map[string]interface{}
	err := json.Unmarshal([]byte(str), &slice)
	if err != nil {
		fmt.Printf("反序列化失败err：%v\n", err)
	}
	fmt.Printf("反序列化Slice后：%v\n", slice)
}

func main() {
	unmarshalStruct()
	unmarshallMap()
	unmarshalSlice()
}

// 反序列化后monster：{孙悟空 500 2011-11-11 8000 如意七十二变} 
// 反序列化Map后：map[address:火云洞 age:10 name:牛魔王] 
// 反序列化Slice后：[map[address:北京 age:19 name:TGH] map[address:[华府 影视帝国] age:18 name:FCC]]
```

## Go-HTTP包的使用

Web是基于http协议的一个服务，Go语言里面提供了一个完善的net/http包，通过http包可以很方便的搭建起来一个可以运行的Web服务。同时使用这个包能很简单地对Web的路由，静态文件，模版，cookie等数据进行设置和操作。

### http包建立Web服务器

```go
package main
import (
    "fmt"
    "net/http"
    "strings"
    "log"
)
func sayhelloName(w http.ResponseWriter, r *http.Request) {
    r.ParseForm()  //解析参数，默认是不会解析的
    fmt.Println(r.Form)  //这些信息是输出到服务器端的打印信息
    fmt.Println("path", r.URL.Path)
    fmt.Println("scheme", r.URL.Scheme)
    fmt.Println(r.Form["url_long"])
    for k, v := range r.Form {
        fmt.Println("key:", k)
        fmt.Println("val:", strings.Join(v, ""))
    }
    fmt.Fprintf(w, "Hello golang!") //这个写入到w的是输出到客户端的
}
func main() {
    http.HandleFunc("/", sayhelloName) //设置访问的路由
    err := http.ListenAndServe(":8080", nil) //设置监听的端口
    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}
```

上面这个代码，build之后，然后执行web.exe,这个时候其实已经在8080端口监听http链接请求了。

在浏览器输入`http://localhost:8080`

可以看到浏览器页面输出了`Hello golang!`

浏览器输入地址：

```bash
http://localhost:8080/?url_long=var1&url_long=var2
```

可以看看浏览器输出的是什么

看到上面的代码，要编写一个Web服务器很简单，只要调用http包的两个函数就可以了。

### 使用http包请求页面

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/httputil"
)

func main() {
	request, err := http.NewRequest(http.MethodGet, "http://www.imooc.com", nil)
	if err != nil {
		panic(err)
	}
	request.Header.Add("User-Agent",
		"Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1")

	client := http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			fmt.Println("Redirect:", req)
			return nil
		},
	}

	resp, err := client.Do(request)
	//resp, err := http.DefaultClient.Do(request)
	//resp, err := http.Get("http://www.imooc.com")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	s, err := httputil.DumpResponse(resp, true)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(s))
}
```

程序运行打印出HTML内容

![img](https://cdn.nlark.com/yuque/0/2020/png/396745/1603443525745-bf6b18f4-8ee9-45a8-8e21-67531abdf88b.png)

### net/http包的坑——i/o timeout

来看一段日常代码。

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net"
    "net/http"
    "time"
)

var tr *http.Transport

func init() {
    tr = &http.Transport{
        MaxIdleConns: 100,
        Dial: func(netw, addr string) (net.Conn, error) {
            conn, err := net.DialTimeout(netw, addr, time.Second*2) //设置建立连接超时
            if err != nil {
                return nil, err
            }
            err = conn.SetDeadline(time.Now().Add(time.Second * 3)) //设置发送接受数据超时
            if err != nil {
                return nil, err
            }
            return conn, nil
        },
    }
}

func main() {
    for {
        _, err := Get("http://www.baidu.com/")
        if err != nil {
            fmt.Println(err)
            break
        }
    }
}


func Get(url string) ([]byte, error) {
    m := make(map[string]interface{})
    data, err := json.Marshal(m)
    if err != nil {
        return nil, err
    }
    body := bytes.NewReader(data)
    req, _ := http.NewRequest("Get", url, body)
    req.Header.Add("content-type", "application/json")

    client := &http.Client{
        Transport: tr,
    }
    res, err := client.Do(req)
    if res != nil {
        defer res.Body.Close()
    }
    if err != nil {
        return nil, err
    }
    resBody, err := ioutil.ReadAll(res.Body)
    if err != nil {
        return nil, err
    }
    return resBody, nil
}
```

做的事情，比较简单，就是循环去请求<http://www.baidu.com/>, 然后等待响应。

看上去貌似没啥问题吧。

代码跑起来，也确实能正常收发消息。

但是这段代码跑一段时间，就会出现i/o timeout的报错。

这其实是最近排查了的一个问题，发现这个坑可能比较容易踩上，这边对代码做了简化。

实际生产中发生的现象是，golang服务在发起http调用时，虽然`http.Transport`设置了3s超时，会偶发出现i/o timeout的报错。

但是查看下游服务的时候，发现下游服务其实100ms就已经返回了。

### 排查

![img](https://cdn.nlark.com/yuque/0/2021/png/396745/1621351380664-f90f9eac-6fcd-4446-8a4e-d08df02ab269.png)

五层网络协议对应的消息体变化分析

就很奇怪了，明明服务端显示处理耗时才100ms，且客户端超时设的是3s, 怎么就出现超时报错i/o timeout呢？

这里推测有两个可能。

- 因为服务端打印的日志其实只是服务端应用层打印的日志。但客户端应用层发出数据后，中间还经过客户端的传输层，网络层，数据链路层和物理层，再经过服务端的物理层，数据链路层，网络层，传输层到服务端的应用层。服务端应用层处耗时100ms，再原路返回。那剩下的3s-100ms可能是耗在了整个流程里的各个层上。比如网络不好的情况下，传输层TCP使劲丢包重传之类的原因。
- 网络没问题，客户端到服务端链路整个收发流程大概耗时就是100ms左右。客户端处理逻辑问题导致超时。

一般遇到问题，大部分情况下都不会是底层网络的问题，大胆怀疑是自己的问题就对了，不死心就抓个包看下。

![img](https://cdn.nlark.com/yuque/0/2021/png/396745/1621351368734-c0656d47-9e8b-41c1-bdbb-115362ceebe8.png)

抓包结果

分析下，从刚开始三次握手（画了红框的地方）。

到最后出现超时报错i/o timeout（画了蓝框的地方）。

从time那一列从7到10，确实间隔3s。而且看右下角的蓝框，是51169端口发到80端口的一次Reset连接。

80端口是服务端的端口。换句话说就是客户端3s超时主动断开链接的。

但是再仔细看下第一行三次握手到最后客户端超时主动断开连接的中间，其实有非常多次HTTP请求。

回去看代码设置超时的方式。

```go
tr = &http.Transport{
    MaxIdleConns: 100,
    Dial: func(netw, addr string) (net.Conn, error) {
        conn, err := net.DialTimeout(netw, addr, time.Second*2) //设置建立连接超时
        if err != nil {
            return nil, err
        }
        err = conn.SetDeadline(time.Now().Add(time.Second * 3)) //设置发送接受数据超时
        if err != nil {
            return nil, err
        }
        return conn, nil
    },
}
```

也就是说，这里的3s超时，其实是在建立连接之后开始算的，而不是单次调用开始算的超时。

看注释里写的是

SetDeadline sets the read and write deadlines associated with theconnection.

#### 超时原因

大家知道HTTP是应用层协议，传输层用的是TCP协议。

HTTP协议从1.0以前，默认用的是短连接，每次发起请求都会建立TCP连接。收发数据。然后断开连接。

TCP连接每次都是三次握手。每次断开都要四次挥手。

其实没必要每次都建立新连接，建立的连接不断开就好了，每次发送数据都复用就好了。

于是乎，HTTP协议从1.1之后就默认使用长连接。具体相关信息可以看之前的[这篇文章](https://mp.weixin.qq.com/s?__biz=MzAwMDAxNjU4Mg==&mid=2247484204&idx=1&sn=0e83aabb2a48570b5bec563a777f4d26&scene=21#wechat_redirect)。

那么golang标准库里也兼容这种实现。

通过建立一个连接池，针对每个域名建立一个TCP长连接，比如<http://baidu.com和http://golang.com就是两个不同的域名。>

第一次访问<http://baidu.com域名的时候会建立一个连接，用完之后放到空闲连接池里，下次再要访问http://baidu.com的时候会重新从连接池里把这个连接捞出来复用。>

![img](https://cdn.nlark.com/yuque/0/2021/png/396745/1621351347346-43a1b64f-2a30-46d4-8fbb-0e201084f4bd.png)

复用长连接

为什么要强调是同一个域名：一个域名会建立一个连接，一个连接对应一个读goroutine和一个写goroutine。正因为是同一个域名，所以最后才会泄漏3个goroutine，如果不同域名的话，那就会泄漏1+2*N个协程，N就是域名数。

假设第一次请求要100ms，每次请求完<http://baidu.com后都放入连接池中，下次继续复用，重复29次，耗时2900ms。>

第30次请求的时候，连接从建立开始到服务返回前就已经用了3000ms，刚好到设置的3s超时阈值，那么此时客户端就会报超时i/o timeout。

虽然这时候服务端其实才花了100ms，但耐不住前面29次加起来的耗时已经很长。

也就是说只要通过`http.Transport`设置了`err = conn.SetDeadline(time.Now().Add(time.Second * 3))`，并且用了长连接，哪怕服务端处理再快，客户端设置的超时再长，总有一刻，程序会报超时错误。

#### 正确姿势

原本预期是给每次调用设置一个超时，而不是给整个连接设置超时。

另外，上面出现问题的原因是给长连接设置了超时，且长连接会复用。

基于这两点，改一下代码。

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "time"
)

var tr *http.Transport

func init() {
    tr = &http.Transport{
        MaxIdleConns: 100,
        // 下面的代码被干掉了
        //Dial: func(netw, addr string) (net.Conn, error) {
        //  conn, err := net.DialTimeout(netw, addr, time.Second*2) //设置建立连接超时
        //  if err != nil {
        //      return nil, err
        //  }
        //  err = conn.SetDeadline(time.Now().Add(time.Second * 3)) //设置发送接受数据超时
        //  if err != nil {
        //      return nil, err
        //  }
        //  return conn, nil
        //},
    }
}


func Get(url string) ([]byte, error) {
    m := make(map[string]interface{})
    data, err := json.Marshal(m)
    if err != nil {
        return nil, err
    }
    body := bytes.NewReader(data)
    req, _ := http.NewRequest("Get", url, body)
    req.Header.Add("content-type", "application/json")

    client := &http.Client{
        Transport: tr,
        Timeout: 3*time.Second,  // 超时加在这里，是每次调用的超时
    }
    res, err := client.Do(req) 
    if res != nil {
        defer res.Body.Close()
    }
    if err != nil {
        return nil, err
    }
    resBody, err := ioutil.ReadAll(res.Body)
    if err != nil {
        return nil, err
    }
    return resBody, nil
}

func main() {
    for {
        _, err := Get("http://www.baidu.com/")
        if err != nil {
            fmt.Println(err)
            break
        }
    }
}
```

看注释会发现，改动的点有两个

- `http.Transport`里的建立连接时的一些超时设置干掉了。
- 在发起http请求的时候会场景`http.Client`，此时加入超时设置，这里的超时就可以理解为单次请求的超时了。同样可以看下注释

```bash
Timeout specifies a time limit forrequestsmade by this Client.
```

到这里，代码就改好了，实际生产中问题也就解决了。

实例代码里，如果拿去跑的话，其实还会下面的错

```bash
Get http://www.baidu.com/: EOF
```

这个是因为调用得太猛了，<http://www.baidu.com那边主动断开的连接，可以理解为一个限流措施，目的是为了保护服务器，毕竟每个人都像这么搞，服务器是会炸的。。。>

解决方案很简单，每次HTTP调用中间加个sleep间隔时间就好。

到这里，其实问题已经解决了，下面会在源码层面分析出现问题的原因。

#### 源码分析

用的go版本是1.12.7。

从发起一个网络请求开始跟。

```go
res, err := client.Do(req)
func (c *Client) Do(req *Request) (*Response, error) {
    return c.do(req)
}

func (c *Client) do(req *Request) {
    // ...
    if resp, didTimeout, err = c.send(req, deadline); err != nil {
        // ...
    }
    // ...  
}  
func send(ireq *Request, rt RoundTripper, deadline time.Time) {
    // ...    
    resp, err = rt.RoundTrip(req)
    // ...  
} 

// 从这里进入 RoundTrip 逻辑
/src/net/http/roundtrip.go: 16
func (t *Transport) RoundTrip(req *Request) (*Response, error) {
    return t.roundTrip(req)
}

func (t *Transport) roundTrip(req *Request) (*Response, error) {
    // 尝试去获取一个空闲连接，用于发起 http 连接
    pconn, err := t.getConn(treq, cm)
    // ...
}

// 重点关注这个函数，返回是一个长连接
func (t *Transport) getConn(treq *transportRequest, cm connectMethod) (*persistConn, error) {
    // 省略了大量逻辑，只关注下面两点
    // 有空闲连接就返回
    pc := <-t.getIdleConnCh(cm)

    // 没有创建连接
    pc, err := t.dialConn(ctx, cm)

}
```

这里上面很多代码，其实只是为了展示这部分代码是怎么跟踪下来的，方便大家去看源码的时候去跟一下。

最后一个上面的代码里有个`getConn`方法。在发起网络请求的时候，会先取一个网络连接，取连接有两个来源。

- 如果有空闲连接，就拿空闲连接

```go
// /src/net/http/tansport.go:810
func (t *Transport) getIdleConnCh(cm connectMethod) chan *persistConn {
    // 返回放空闲连接的chan
    ch, ok := t.idleConnCh[key]
    // ...
    return ch
}
```

- 没有空闲连接，就创建长连接。

```go
// /src/net/http/tansport.go:1357
func (t *Transport) dialConn() {
  //...
  conn, err := t.dial(ctx, "tcp", cm.addr())
  // ...
  go pconn.readLoop()
  go pconn.writeLoop()
  // ...
}
```

当第一次发起一个http请求时，这时候肯定没有空闲连接，会建立一个新连接。同时会创建一个读goroutine和一个写goroutine。

![img](https://cdn.nlark.com/yuque/0/2021/png/396745/1621351204844-99fdc650-2c23-4dae-ba04-ba54b561202a.png)

读写协程

注意上面代码里的`t.dial(ctx, "tcp", cm.addr())`，如果像文章开头那样设置了`http.Transport`的

```go
Dial: func(netw, addr string) (net.Conn, error) {
    conn, err := net.DialTimeout(netw, addr, time.Second*2) //设置建立连接超时
    if err != nil {
        return nil, err
    }
    err = conn.SetDeadline(time.Now().Add(time.Second * 3)) //设置发送接受数据超时
    if err != nil {
        return nil, err
    }
    return conn, nil
},
```



那么这里就会在下面的dial里被执行到

```go
func (t *Transport) dial(ctx context.Context, network, addr string) (net.Conn, error) {
    // ...
    c, err := t.Dial(network, addr)
    // ...
}
```

这里面调用的设置超时，会执行到

```go
// /src/net/net.go
func (c *conn) SetDeadline(t time.Time) error {
    //...
    c.fd.SetDeadline(t)
    //...
}

//...

func setDeadlineImpl(fd *FD, t time.Time, mode int) error {
    // ...
    runtime_pollSetDeadline(fd.pd.runtimeCtx, d, mode)
    return nil
}


//go:linkname poll_runtime_pollSetDeadline internal/poll.runtime_pollSetDeadline
func poll_runtime_pollSetDeadline(pd *pollDesc, d int64, mode int) {
    // ...
    // 设置一个定时器事件
    rtf = netpollDeadline
    // 并将事件注册到定时器里
    modtimer(&pd.rt, pd.rd, 0, rtf, pd, pd.rseq)
}  
```

上面的源码，简单来说就是，当第一次调用请求的，会建立个连接，这时候还会注册一个定时器事件，假设时间设了3s，那么这个事件会在3s后发生，然后执行注册事件的逻辑。而这个注册事件就是`netpollDeadline`。注意这个`netpollDeadline`，待会会提到。

![img](https://cdn.nlark.com/yuque/0/2021/png/396745/1621351188250-1127f116-5af1-4a96-ae6f-c326b52761f5.png)

读写协程定时器事件

设置了超时事件，且超时事件是3s后之后，发生。再次期间正常收发数据。一切如常。

直到3s过后，这时候看读goroutine，会等待网络数据返回。

```go
// /src/net/http/tansport.go:1642
func (pc *persistConn) readLoop() {
    //...
    for alive {
        _, err := pc.br.Peek(1)  // 阻塞读取服务端返回的数据
    //...
}
```

然后就是一直跟代码。

```go
src/bufio/bufio.go: 129
func (b *Reader) Peek(n int) ([]byte, error) {
    // ...
    b.fill() 
    // ...   
}

func (b *Reader) fill() {
    // ...
    n, err := b.rd.Read(b.buf[b.w:])
    // ...
}

/src/net/http/transport.go: 1517
func (pc *persistConn) Read(p []byte) (n int, err error) {
    // ...
    n, err = pc.conn.Read(p)
    // ...
}

// /src/net/net.go: 173
func (c *conn) Read(b []byte) (int, error) {
    // ...
    n, err := c.fd.Read(b)
    // ...
}

func (fd *netFD) Read(p []byte) (n int, err error) {
    n, err = fd.pfd.Read(p)
    // ...
}

/src/internal/poll/fd_unix.go: 
func (fd *FD) Read(p []byte) (int, error) {
    //...
    if err = fd.pd.waitRead(fd.isFile); err == nil {
        continue
    }
    // ...
}

func (pd *pollDesc) waitRead(isFile bool) error {
    return pd.wait('r', isFile)
}

func (pd *pollDesc) wait(mode int, isFile bool) error {
    // ...
    res := runtime_pollWait(pd.runtimeCtx, mode)
    return convertErr(res, isFile)
}
```

直到跟到`runtime_pollWait`，这个可以简单认为是等待服务端数据返回。

```go
//go:linkname poll_runtime_pollWait internal/poll.runtime_pollWait
func poll_runtime_pollWait(pd *pollDesc, mode int) int {

    // 1.如果网络正常返回数据就跳出
  for !netpollblock(pd, int32(mode), false) {
    // 2.如果有出错情况也跳出
        err = netpollcheckerr(pd, int32(mode))
        if err != 0 {
            return err
        }
    }
    return 0
}
```

整条链路跟下来，就是会一直等待数据，等待的结果只有两个

- 有可以读的数据
- 出现报错

这里面的报错，又有那么两种

- 连接关闭
- 超时

```go
func netpollcheckerr(pd *pollDesc, mode int32) int {
    if pd.closing {
        return 1 // errClosing
    }
    if (mode == 'r' && pd.rd < 0) || (mode == 'w' && pd.wd < 0) {
        return 2 // errTimeout
    }
    return 0
}
```

其中提到的超时，就是指这里面返回的`数字2`，会通过下面的函数，转化为`ErrTimeout`， 而`ErrTimeout.Error()`其实就是i/o timeout。

```go
func convertErr(res int, isFile bool) error {
    switch res {
    case 0:
        return nil
    case 1:
        return errClosing(isFile)
    case 2:
        return ErrTimeout // ErrTimeout.Error() 就是 "i/o timeout"
    }
    println("unreachable: ", res)
    panic("unreachable")
}
```

那么问题来了。上面返回的超时错误，也就是返回2的时候的条件是怎么满足的？

```go
if (mode == 'r' && pd.rd < 0) || (mode == 'w' && pd.wd < 0) {
    return 2 // errTimeout
}
```

还记得刚刚提到的netpollDeadline吗？

这里面放了定时器3s到点时执行的逻辑。

```go
func timerproc(tb *timersBucket) {
    // 计时器到设定时间点了，触发之前注册函数
    f(arg, seq) // 之前注册的是 netpollDeadline
}

func netpollDeadline(arg interface{}, seq uintptr) {
    netpolldeadlineimpl(arg.(*pollDesc), seq, true, true)
}

/src/runtime/netpoll.go: 428
func netpolldeadlineimpl(pd *pollDesc, seq uintptr, read, write bool) {
    //...
    if read {
        pd.rd = -1
        rg = netpollunblock(pd, 'r', false)
    }
    //...
}
```

这里会设置`pd.rd=-1`，是指`poller descriptor.read deadline`，含义网络轮询器文件描述符的读超时时间， 在linux里万物皆文件，这里的文件其实是指这次网络通讯中使用到的socket。

这时候再回去看发生超时的条件就是`if (mode == 'r' && pd.rd < 0)`。

至此。代码里就收到了io timeout的报错。

#### 总结

- 不要在`http.Transport`中设置超时，那是连接的超时，不是请求的超时。否则可能会出现莫名io timeout报错。
- 请求的超时在创建`client`里设置。

---

## Go中Unicode相关包

### Go中Unicode相关包种类

Go 语言让复杂的编码问题变得简单很多，极大的减轻了程序员的心智负担。为了方便对 unicode 字符串进行处理，Go 语言标准库提供三个包：unicode、unicode/utf8 和 unicode/utf16。

这里简单介绍下三个包的功能：

- unicode：unicode 提供数据和函数来测试 Unicode 代码点（Code Point，用 rune 存储）的某些属性。
- unicode/utf8：用于处理 UTF-8 编码的文本，提供一些常量和函数，包括在 rune（码点） 和 UTF-8 字节序列之间的转换。
- unicode/utf16：函数比较少，主要是 UTF-16 序列的编码和解码。

Go 中字符串的写法。

在 Go 语言中，字符串字面值有 4 种写法，比如「徐新华」可以这么写：

```bash
s1 := "徐新华"
s2 := "\u5F90\u65B0\u534E"
s3 := "\U00005F90\U000065B0\U0000534E"
s4 := "\xe5\xbe\x90\xe6\x96\xb0\xe5\x8d\x8e"
```

简单来生活就是 \u 紧跟四个十六进制数，\U 紧跟八个十六进制数。其中 \u 或 \U 代表后面是 Unicode 码点。而 \x 紧跟两个十六进制数，这些十六进制不是 Unicode 码点，而是 UTF-8 编码。

下面的代码有利于理解：

```go
package main
import (
    "fmt"
    "unicode/utf8"
)
func main() {
    s := `徐新华`
    var (
        buf = make([]byte, 4)
        n   int
    )
    fmt.Println("字符\tUnicode码点\tUTF-8编码十六进制\tUTF-8编码二进制")
    for _, r := range s {
        n = utf8.EncodeRune(buf, r)
        fmt.Printf("%q\t%U\t\t%X\t\t%b\n", r, r, buf[:n], buf[:n])
    }

    s2 := "\u5F90\u65B0\u534E"
    s3 := "\U00005F90\U000065B0\U0000534E"
    s4 := "\xe5\xbe\x90\xe6\x96\xb0\xe5\x8d\x8e"

    fmt.Println(s2)
    fmt.Println(s3)
    fmt.Println(s4)
}
```

运行结果：

```bash

字符 Unicode码点 UTF-8编码十六进制 UTF-8编码二进制
'徐' U+5F90  E5BE90  [11100101 10111110 10010000]
'新' U+65B0  E696B0  [11100110 10010110 10110000]
'华' U+534E  E58D8E  [11100101 10001101 10001110]
徐新华
徐新华
徐新华

```

此外，关于字符串其他方面的处理，比如编码转换等，可以到 https://pkg.go.dev/golang.org/x/text 里找。

### 大小端问题（Little endian 和 Big endian）


一个字符使用多字节存储时，涉及到哪个在前哪个在后。以汉字「徐」为例，Unicode 码点是 5F90，需要用两个字节存储，一个字节是5F，另一个字节是90。存储的时候，5F在前，90 在后，这就是 Big endian 方式；90在前，5F在后，这是 Little endian 方式。


这两个古怪的名称来自英国作家斯威夫特的《格列佛游记》。在该书中，小人国里爆发了内战，战争起因是人们争论，吃鸡蛋时究竟是从大头（Big-endian）敲开还是从小头（Little-endian）敲开。为了这件事情，前后爆发了六次战争，一个皇帝送了命，另一个皇帝丢了王位。

第一个字节在前，就是"大端方式"（Big endian），第二个字节在前就是"小端方式"（Little endian）。

那么很自然的，就会出现一个问题：计算机怎么知道某一个文件到底采用哪一种方式编码？

Unicode 规范定义，每一个文件的最前面分别加入一个表示编码顺序的字符，这个字符的名字叫做"零宽度非换行空格"（zero width no-break space），用 FEFF 表示。这正好是两个字节，而且 FF 比 FE 大1。

如果一个文本文件的头两个字节是 FE FF，就表示该文件采用大端方式；如果头两个字节是 FF FE，就表示该文件采用小端方式。

但从上面关于 UTF-8 编码的说明可以看出，虽然 UTF-8 存在多字节表示一个字符的情况，但顺序是固定的，没有字节序的问题。Unix 系统下，UTF-8 没有任何前置字符，但 Windows 下记事本保存的 UTF-8 文件会带上 BOM（Byte Order Mark），即 EF BB BF 这三个字节。关于这一点，Unicode 之父 Rob Pike 明确说 UTF-8 不需要 BOM，所以一开始 Go 源文件是不允许有 BOM 的，否则编译不通过，不过现在已经可以有了。但建议还是别带 BOM。

> UTF-8 带 BOM 说不是为了区分字节序，而是为了更方便的知晓这是一个 UTF-8 文件。


## Go 标准库之 unsafe 包

### 1.  unsafe包

#### 1.1.  `ArbitraryType`

`unsafe`包下定义了一个`ArbitratyType`类型，代表了任意的Go表达式。

```go
type ArbitraryType int
```

#### 1.2.  `Pointer`

`Pointer`定义：

```go
type Pointer *ArbitraryType

```

`Pointer`代表了一个指向任意类型的指针，有四种只适用对`Pointer`而不适用于其他类型的操作。

- 任意类型的指针值可以被转换为一个`Pointer`
- 一个`Pointer`可以被转换为任意类型的指针值

- 一个`uintptr`可以被转换为一个`Pointer`
- 一个`Pointer`也可以被转换为一个`uintptr`

因此，`Pointer`可以跳过类型系统而直接指向任意类型。所以需要十分小心的使用。

关于使用`Pointer`的规则，不使用这些规则的代码是不可用的，或者在未来是不可用的。



