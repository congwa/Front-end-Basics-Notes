# flag自带包

flag包用于解析命令行选项。


## 选项格式 flag.TypeVar 这种方式需要我们先定义变量，然后变量的地址

```go
package main

import (
  "fmt"
  "flag"
)

var (
  intflag int
  boolflag bool
  stringflag string
)

func init() {
  flag.IntVar(&intflag, "intflag", 0, "int flag value")
  flag.BoolVar(&boolflag, "boolflag", false, "bool flag value")
  flag.StringVar(&stringflag, "stringflag", "default", "string flag value")
}

func main() {
  flag.Parse()

  fmt.Println("int flag:", intflag)
  fmt.Println("bool flag:", boolflag)
  fmt.Println("string flag:", stringflag)
}
```

```sh
# 出现就是bool值，出现为true，不出现为默认值
flag  

# 把x的值赋值给flag
-flag=x

# 把x的值赋值给flag
-flag x

# *是shell通配符，有名字为`*`匹配到的文件 x的值为true，没有这个文件就是false
cmd -flag *

# 把x的值赋值给flag, 遇到 -- 中断解析， -c的c变量取默认值
cmd -flag x -- -c 18
```

在go中`-` 和`--`无论长短选项，都是一样的意思

触发解析中断： `--`

### flag.Args()、lag.NArg()、flag.Arg(i)、flag.NFlag()

解析终止之后如果还有命令行参数，flag库会存储下来，通过flag.Args方法返回这些参数的切片。

可以通过flag.NArg方法获取未解析的参数数量，flag.Arg(i)访问位置i（从 0 开始）上的参数。 选项个数也可以通过调用flag.NFlag方法获取。

```go
func main() {
  flag.Parse() // 解析命令行参数
    
  fmt.Println(flag.Args()) // 打印非标志参数
  fmt.Println("Non-Flag Argument Count:", flag.NArg()) // 打印非标志参数的数量
  for i := 0; i < flag.NArg(); i++ {
    fmt.Printf("Argument %d: %s\n", i, flag.Arg(i)) // 打印每个非标志参数
  }
  
  fmt.Println("Flag Count:", flag.NFlag()) // 打印标志参数的数量
}
//./main.exe -intflag 12 -- -stringflag test

// 运行结果
/**
[-stringflag test]
Non-Flag Argument Count: 2
Argument 0: -stringflag
Argument 1: test
 */
```

解析遇到--终止后，剩余参数-stringflag test保存在flag中，可以通过Args/NArg/Arg等方法访问。

布尔类型的选项值可以为：

- 取值为true的：1、t、T、true、TRUE、True；
- 取值为false的：0、f、F、false、FALSE、False。


## flag.Type 调用flag.Type（其中Type可以为Int/Uint/Bool/Float64/String/Duration等）会自动为我们分配变量，返回该变量的地址

```go
package main

import (
  "fmt"
  "flag"
)

var (
  intflag *int
  boolflag *bool
  stringflag *string
)

func init() {
  //  flag.Int Bool  String  直接调用type
  intflag = flag.Int("intflag", 0, "int flag value")
  boolflag = flag.Bool("boolflag", false, "bool flag value")
  stringflag = flag.String("stringflag", "default", "string flag value")
}

func main() {
  flag.Parse()
    
  fmt.Println("int flag:", *intflag)
  fmt.Println("bool flag:", *boolflag)
  fmt.Println("string flag:", *stringflag)
}
```


## 短选项

flag库并没有显示支持短选项

但是可以通过给某个相同的变量设置不同的选项来实现,即两个选项共享同一个变量。

由于初始化顺序不确定，必须保证它们拥有相同的默认值。否则不传该选项时，行为是不确定的。


```go
package main

import (
  "fmt"
  "flag"
)

var logLevel string

func init() {
  const (
    defaultLogLevel = "DEBUG"
    usage = "set log level value"
  )
  
  // 给logLevel变量设置不同的选项监听，以达到短选项的目的
  flag.StringVar(&logLevel, "log_type", defaultLogLevel, usage)
  flag.StringVar(&logLevel, "l", defaultLogLevel, usage + "(shorthand)")
}

func main() {
  flag.Parse()

  fmt.Println("log level:", logLevel)
}
```

## 解析时间间隔

flag库还支持time.Duration类型，即时间间隔。

时间间隔支持的格式非常之多，例如"300ms"、"-1.5h"、“2h45m"等等等等。 时间单位可以是 ns/us/ms/s/m/h/day 等。实际上flag内部会调用time.ParseDuration。具体支持的格式可以参见time（需fq）库的文档。


```go
// 解析命令行参数的睡眠时间，以达到睡眠参数上的时间的目的
package main

import (
  "flag"
  "fmt"
  "time"
)

var (
  period time.Duration
)

func init() {
  // time.Duration类型 用于解析时间段
  flag.DurationVar(&period, "period", 1*time.Second, "sleep period")
}

func main() {
  flag.Parse()
  fmt.Printf("Sleeping for %v...", period)
  time.Sleep(period)
  fmt.Println()
}
```

## flag.Var方法

```go
package main

import (
  "errors"
  "flag"
  "fmt"
  "strings"
  "time"
)

type interval []time.Duration

func (i *interval) String() string {
  return fmt.Sprint(*i)
}

func (i *interval) Set(value string) error {
  if len(*i) > 0 {
    return errors.New("interval flag already set")
  }
  for _, dt := range strings.Split(value, ",") {
    duration, err := time.ParseDuration(dt)
    if err != nil {
      return err
    }
    *i = append(*i, duration)
  }
  return nil
}

var (
  intervalFlag interval
)

func init() {
  flag.Var(&intervalFlag, "deltaT", "comma-seperated list of intervals to use between events")
}

func main() {
  flag.Parse()

  fmt.Println(intervalFlag)
}
```

```go
// src/flag/flag.go
type Value interface {
  String() string
  Set(string) error
}
```

其中String方法格式化该类型的值，flag.Parse方法在执行时遇到自定义类型的选项会将选项值作为参数调用该类型变量的Set方法。 这里将以,分隔的时间间隔解析出来存入一个切片中。

自定义选项要实现Value接口


### 解析程序中的字符串

有时候选项并不是通过命令行传递的。

例如，从配置表中读取或程序生成的。这时候可以使用flag.FlagSet结构的相关方法来解析这些选项。

实际上，我们前面调用的flag库的方法，都会间接调用FlagSet结构的方法。flag库中定义了一个FlagSet类型的全局变量CommandLine专门用于解析命令行选项。 前面调用的flag库的方法只是为了提供便利，它们内部都是调用的CommandLine的相应方法：

```go
// src/flag/flag.go
var CommandLine = NewFlagSet(os.Args[0], ExitOnError)

func Parse() {
  CommandLine.Parse(os.Args[1:])
}

func IntVar(p *int, name string, value int, usage string) {
  CommandLine.Var(newIntValue(value, p), name, usage)
}

func Int(name string, value int, usage string) *int {
  return CommandLine.Int(name, value, usage)
}

func NFlag() int { return len(CommandLine.actual) }

func Arg(i int) string {
  return CommandLine.Arg(i)
}

func NArg() int { return len(CommandLine.args) }
```

同样的，我们也可以自己创建FlagSet类型变量来解析选项。


```go
package main

import (
  "flag"
  "fmt"
)

func main() {
  args := []string{"-intflag", "12", "-stringflag", "test"}

  var intflag int
  var boolflag bool
  var stringflag string

  // 使用NewFlagSet方法自定义类型，来解析选项
  fs := flag.NewFlagSet("MyFlagSet", flag.ContinueOnError)
  fs.IntVar(&intflag, "intflag", 0, "int flag value")
  fs.BoolVar(&boolflag, "boolflag", false, "bool flag value")
  fs.StringVar(&stringflag, "stringflag", "default", "string flag value")

  fs.Parse(args)
  
  fmt.Println("int flag:", intflag)
  fmt.Println("bool flag:", boolflag)
  fmt.Println("string flag:", stringflag)
}
```

NewFlagSet方法有两个参数，第一个参数是程序名称，输出帮助或出错时会显示该信息。第二个参数是解析出错时如何处理，有几个选项：

- ContinueOnError：发生错误后继续解析，CommandLine就是使用这个选项；
- ExitOnError：出错时调用os.Exit(2)退出程序；
- PanicOnError：出错时产生 panic。

```go
// src/flag/flag.go
func (f *FlagSet) Parse(arguments []string) error {
  f.parsed = true
  f.args = arguments
  for {
    seen, err := f.parseOne()
    if seen {
      continue
    }
    if err == nil {
      break
    }
    switch f.errorHandling {
    case ContinueOnError:
      return err
    case ExitOnError:
      os.Exit(2)
    case PanicOnError:
      panic(err)
    }
  }
  return nil
}
```

与直接使用flag库的方法有一点不同，FlagSet调用Parse方法时需要显示传入字符串切片作为参数。因为flag.Parse在内部调用了