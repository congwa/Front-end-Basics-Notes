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



