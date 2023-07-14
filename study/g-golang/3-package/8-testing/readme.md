# testing

testing是 Go 语言标准库自带的测试库。

Go 语言中有 3 种类型的测试：单元测试，性能测试，示例测试。


## 单元测试

单元测试又称为功能性测试，是为了测试函数、模块等代码的逻辑是否正确。


在 Go 中编写测试很简单，只需要在待测试功能所在文件的同级目录中创建一个以_test.go结尾的文件。在该文件中，我们可以编写一个个测试函数。测试函数名必须是TestXxxx这个形式，而且Xxxx必须以大写字母开头，另外函数带有一个*testing.T类型的参数


```go
// roman_test.go
package roman

import (
  "testing"
)

func TestToRoman(t *testing.T) {
  _, err1 := ToRoman(0)
  if err1 != ErrOutOfRange {
    t.Errorf("ToRoman(0) expect error:%v got:%v", ErrOutOfRange, err1)
  }

  roman2, err2 := ToRoman(1)
  if err2 != nil {
    t.Errorf("ToRoman(1) expect nil error, got:%v", err2)
  }
  if roman2 != "I" {
    t.Errorf("ToRoman(1) expect:%s got:%s", "I", roman2)
  }
}
```

在测试函数中编写的代码与正常的代码没有什么不同，调用相应的函数，返回结果，判断结果与预期是否一致，如果不一致则调用testing.T的Errorf()输出错误信息。运行测试时，这些错误信息会被收集起来，运行结束后统一输出。

测试编写完成之后，使用go test命令运行测试，输出结果：

```sh
$ go test
--- FAIL: TestToRoman (0.00s)
    roman_test.go:18: ToRoman(1) expect:I got:
FAIL
exit status 1
FAIL    github.com/darjun/go-daily-lib/testing  0.172s
```

故意将ToRoman()函数中写错了一行代码，n > pair.Num中>应该为>=，单元测试成功找出了错误。修改之后重新运行测试：

```sh
$ go test
PASS
ok      github.com/darjun/go-daily-lib/testing  0.178s
```

还可以给go test命令传入-v选项，输出详细的测试信息：

```sh
$ go test -v
=== RUN   TestToRoman
--- PASS: TestToRoman (0.00s)
PASS
ok      github.com/darjun/go-daily-lib/testing  0.174s
```

在运行每个测试函数前，都输出一行=== RUN，运行结束之后输出--- PASS或--- FAIL信息。


## 表格驱动测试 - 使用表格的方式将各个测试数据和结果列举出来


```go
func TestToRoman(t *testing.T) {
  testCases := []struct {
    num    int
    expect string
    err    error
  }{
    {0, "", ErrOutOfRange},
    {1, "I", nil},
    {2, "II", nil},
    {3, "III", nil},
    {4, "IV", nil},
    {5, "V", nil},
    {6, "VI", nil},
    {7, "VII", nil},
    {8, "VIII", nil},
    {9, "IX", nil},
    {10, "X", nil},
    {50, "L", nil},
    {100, "C", nil},
    {500, "D", nil},
    {1000, "M", nil},
    {31, "XXXI", nil},
    {148, "CXLVIII", nil},
    {294, "CCXCIV", nil},
    {312, "CCCXII", nil},
    {421, "CDXXI", nil},
    {528, "DXXVIII", nil},
    {621, "DCXXI", nil},
    {782, "DCCLXXXII", nil},
    {870, "DCCCLXX", nil},
    {941, "CMXLI", nil},
    {1043, "MXLIII", nil},
    {1110, "MCX", nil},
    {1226, "MCCXXVI", nil},
    {1301, "MCCCI", nil},
    {1485, "MCDLXXXV", nil},
    {1509, "MDIX", nil},
    {1607, "MDCVII", nil},
    {1754, "MDCCLIV", nil},
    {1832, "MDCCCXXXII", nil},
    {1993, "MCMXCIII", nil},
    {2074, "MMLXXIV", nil},
    {2152, "MMCLII", nil},
    {2212, "MMCCXII", nil},
    {2343, "MMCCCXLIII", nil},
    {2499, "MMCDXCIX", nil},
    {2574, "MMDLXXIV", nil},
    {2646, "MMDCXLVI", nil},
    {2723, "MMDCCXXIII", nil},
    {2892, "MMDCCCXCII", nil},
    {2975, "MMCMLXXV", nil},
    {3051, "MMMLI", nil},
    {3185, "MMMCLXXXV", nil},
    {3250, "MMMCCL", nil},
    {3313, "MMMCCCXIII", nil},
    {3408, "MMMCDVIII", nil},
    {3501, "MMMDI", nil},
    {3610, "MMMDCX", nil},
    {3743, "MMMDCCXLIII", nil},
    {3844, "MMMDCCCXLIV", nil},
    {3888, "MMMDCCCLXXXVIII", nil},
    {3940, "MMMCMXL", nil},
    {3999, "MMMCMXCIX", nil},
    {4000, "", ErrOutOfRange},
  }

  for _, testCase := range testCases {
    got, err := ToRoman(testCase.num)
    if got != testCase.expect {
      t.Errorf("ToRoman(%d) expect:%s got:%s", testCase.num, testCase.expect, got)
    }

    if err != testCase.err {
      t.Errorf("ToRoman(%d) expect error:%v got:%v", testCase.num, testCase.err, err)
    }
  }
}
```

将要测试的每种情况列举出来，然后针对每个整数调用ToRoman()函数，比较返回的罗马数字字符串和错误值是否与预期的相符。后续要添加新的测试用例也很方便。

## 分组和并行

有时候对同一个函数有不同维度的测试，将这些组合在一起有利于维护。例如上面对ToRoman()函数的测试可以分为非法值，单个罗马字符和普通 3 种情况。

为了分组，我对代码做了一定程度的重构，首先抽象一个toRomanCase结构：


```go
type toRomanCase struct {
  num    int
  expect string
  err    error
}

// 将所有的测试数据划分到 3 个组中：
var (
  toRomanInvalidCases []toRomanCase
  toRomanSingleCases  []toRomanCase
  toRomanNormalCases  []toRomanCase
)

func init() {
  toRomanInvalidCases = []toRomanCase{
    {0, "", roman.ErrOutOfRange},
    {4000, "", roman.ErrOutOfRange},
  }

  toRomanSingleCases = []toRomanCase{
    {1, "I", nil},
    {5, "V", nil},
    // ...
  }

  toRomanNormalCases = []toRomanCase{
    {2, "II", nil},
    {3, "III", nil},
    // ...
  }
}
// 然后为了避免代码重复，抽象一个运行多个toRomanCase的函数：
func testToRomanCases(cases []toRomanCase, t *testing.T) {
  for _, testCase := range cases {
    got, err := roman.ToRoman(testCase.num)
    if got != testCase.expect {
      t.Errorf("ToRoman(%d) expect:%s got:%s", testCase.num, testCase.expect, got)
    }

    if err != testCase.err {
      t.Errorf("ToRoman(%d) expect error:%v got:%v", testCase.num, testCase.err, err)
    }
  }
}

// 为每个分组定义一个测试函数：
func testToRomanInvalid(t *testing.T) {
  testToRomanCases(toRomanInvalidCases, t)
}

func testToRomanSingle(t *testing.T) {
  testToRomanCases(toRomanSingleCases, t)
}

func testToRomanNormal(t *testing.T) {
  testToRomanCases(toRomanNormalCases, t)
}

// 在原来的测试函数中，调用t.Run()运行不同分组的测试函数，t.Run()第一个参数为子测试名，第二个参数为子测试函数：

func TestToRoman(t *testing.T) {
  t.Run("Invalid", testToRomanInvalid)
  t.Run("Single", testToRomanSingle)
  t.Run("Normal", testToRomanNormal)
}
```

```sh
$ go test -v
=== RUN   TestToRoman
=== RUN   TestToRoman/Invalid
=== RUN   TestToRoman/Single
=== RUN   TestToRoman/Normal
--- PASS: TestToRoman (0.00s)
    --- PASS: TestToRoman/Invalid (0.00s)
    --- PASS: TestToRoman/Single (0.00s)
    --- PASS: TestToRoman/Normal (0.00s)
PASS
ok      github.com/darjun/go-daily-lib/testing  0.188s
```


可以看到，依次运行 3 个子测试，子测试名是父测试名和t.Run()指定的名字组合而成的，如TestToRoman/Invalid。

默认情况下，这些测试都是依次顺序执行的。如果各个测试之间没有联系，我们可以让他们并行以加快测试速度。方法也很简单，在testToRomanInvalid/testToRomanSingle/testToRomanNormal这 3 个函数开始处调用t.Parallel()，由于这 3 个函数直接调用了testToRomanCases，也可以只在testToRomanCases函数开头出添加：

```go
func testToRomanCases(cases []toRomanCase, t *testing.T) {
  t.Parallel()
  // ...
}
```

```sh
$ go test -v
...
--- PASS: TestToRoman (0.00s)
    --- PASS: TestToRoman/Invalid (0.00s)
    --- PASS: TestToRoman/Normal (0.00s)
    --- PASS: TestToRoman/Single (0.00s)
PASS
ok      github.com/darjun/go-daily-lib/testing  0.182s
```

我们发现测试完成的顺序并不是我们指定的顺序。


## 主测试函数

有一种特殊的测试函数，函数名为TestMain()，接受一个*testing.M类型的参数。

这个函数一般用于在运行所有测试前执行一些初始化逻辑（如创建数据库链接），或所有测试都运行结束之后执行一些清理逻辑（释放数据库链接）。

如果测试文件中定义了这个函数，则go test命令会直接运行这个函数，否者go test会创建一个默认的TestMain()函数。

这个函数的默认行为就是运行文件中定义的测试。我们自定义TestMain()函数时，也需要手动调用m.Run()方法运行测试函数，否则测试函数不会运行。默认的TestMain()类似下面代码

```go
func TestMain(m *testing.M) {
  os.Exit(m.Run())
}
```

```go
// 定义一个TestMain()函数，打印go test支持的选项
func TestMain(m *testing.M) {
  flag.Parse()
  flag.VisitAll(func(f *flag.Flag) {
    fmt.Printf("name:%s usage:%s value:%v\n", f.Name, f.Usage, f.Value)
  })
  os.Exit(m.Run())
}
```

```sh
$ go test -v
name:test.bench usage:run only benchmarks matching `regexp` value:
name:test.benchmem usage:print memory allocations for benchmarks value:false
name:test.benchtime usage:run each benchmark for duration `d` value:1s
name:test.blockprofile usage:write a goroutine blocking profile to `file` value:
name:test.blockprofilerate usage:set blocking profile `rate` (see runtime.SetBlockProfileRate) value:1
name:test.count usage:run tests and benchmarks `n` times value:1
name:test.coverprofile usage:write a coverage profile to `file` value:
name:test.cpu usage:comma-separated `list` of cpu counts to run each test with value:
name:test.cpuprofile usage:write a cpu profile to `file` value:
name:test.failfast usage:do not start new tests after the first test failure value:false
name:test.list usage:list tests, examples, and benchmarks matching `regexp` then exit value:
name:test.memprofile usage:write an allocation profile to `file` value:
name:test.memprofilerate usage:set memory allocation profiling `rate` (see runtime.MemProfileRate) value:0
name:test.mutexprofile usage:write a mutex contention profile to the named file after execution value:
name:test.mutexprofilefraction usage:if >= 0, calls runtime.SetMutexProfileFraction() value:1
name:test.outputdir usage:write profiles to `dir` value:
name:test.paniconexit0 usage:panic on call to os.Exit(0) value:true
name:test.parallel usage:run at most `n` tests in parallel value:8
name:test.run usage:run only tests and examples matching `regexp` value:
name:test.short usage:run smaller test suite to save time value:false
name:test.testlogfile usage:write test action log to `file` (for use only by cmd/go) value:
name:test.timeout usage:panic test binary after duration `d` (default 0, timeout disabled) value:10m0s
name:test.trace usage:write an execution trace to `file` value:
name:test.v usage:verbose: print additional output value:tru

// 这些选项也可以通过go help testflag查看。
```



## 性能测试

性能测试是为了对函数的运行性能进行评测。性能测试也必须在_test.go文件中编写，且函数名必须是BenchmarkXxxx开头。性能测试函数接受一个*testing.B的参数。下面我们编写 3 个计算第 n 个斐波那契数的函数。

```go
// 递归
func Fib1(n int) int {
  if n <= 1 {
    return n
  }
  
  return Fib1(n-1) + Fib1(n-2)
}

// 备忘录
func fibHelper(n int, m map[int]int) int {
  if n <= 1 {
    return n
  }

  if v, ok := m[n]; ok {
    return v
  }
  
  v := fibHelper(n-2, m) + fibHelper(n-1, m)
  m[n] = v
  return v
}

func Fib2(n int) int {
  m := make(map[int]int)
  return fibHelper(n, m)
}

// 迭代
func Fib3(n int) int {
  if n <= 1 {
    return n
  }
  
  f1, f2 := 0, 1
  for i := 2; i <= n; i++ {
    f1, f2 = f2, f1+f2
  }
  
  return f2
}
```

```go
// fib_test.go
// 需要特别注意的是N，go test会一直调整这个数值，直到测试时间能得出可靠的性能数据为止。
func BenchmarkFib1(b *testing.B) {
  for i := 0; i < b.N; i++ {
    Fib1(20)
  }
}

func BenchmarkFib2(b *testing.B) {
  for i := 0; i < b.N; i++ {
    Fib2(20)
  }
}

func BenchmarkFib3(b *testing.B) {
  for i := 0; i < b.N; i++ {
    Fib3(20)
  }
}
```

```sh
$ go test -bench=.
goos: windows
goarch: amd64
pkg: github.com/darjun/go-daily-lib/testing/fib
cpu: Intel(R) Core(TM) i7-7700 CPU @ 3.60GHz
BenchmarkFib1-8            31110             39144 ns/op
BenchmarkFib2-8           582637              3127 ns/op
BenchmarkFib3-8         191600582            5.588 ns/op
PASS
ok      github.com/darjun/go-daily-lib/testing/fib      5.225s
```

性能测试默认不会执行，需要通过-bench=.指定运行。-bench选项的值是一个简单的模式，.表示匹配所有的，Fib表示运行名字中有Fib的。


上面的测试结果表示Fib1在指定时间内执行了 31110 次，平均每次 39144 ns，Fib2在指定时间内运行了 582637 次，平均每次耗时 3127 ns，Fib3在指定时间内运行了 191600582 次，平均每次耗时 5.588 ns。


- -benchtime：设置每个测试的运行时间。
- -benchmem：输出性能测试函数的内存分配情况。
- -memprofile file：将内存分配数据写入文件
- -cpuprofile file：将 CPU 采样数据写入文件，方便使用go tool pprof工具分析

```sh
$ go tool pprof ./mem.prof
Type: alloc_space
Time: Aug 4, 2021 at 10:30am (CST)
Entering interactive mode (type "help" for commands, "o" for options)
(pprof) top10
Showing nodes accounting for 8.69GB, 100% of 8.69GB total
Dropped 12 nodes (cum <= 0.04GB)
      flat  flat%   sum%        cum   cum%
    8.69GB   100%   100%     8.69GB   100%  github.com/darjun/fib.fibHelper
         0     0%   100%     8.69GB   100%  github.com/darjun/fib.BenchmarkFib2
         0     0%   100%     8.69GB   100%  github.com/darjun/fib.Fib2 (inline)
         0     0%   100%     8.69GB   100%  testing.(*B).launch
         0     0%   100%     8.69GB   100%  testing.(*B).runN
(pprof)
```

## 示例测试

示例测试用于演示模块或函数的使用。

同样地，示例测试也在文件_test.go中编写，并且示例测试函数名必须是ExampleXxx的形式。

在Example*函数中编写代码，然后在注释中编写期望的输出，go test会运行该函数，然后将实际输出与期望的做比较。

下面摘取自 Go 源码net/url/example_test.go文件中的代码演示了url.Values的用法：

```go
func ExampleValuesGet() {
  v := url.Values{}
  v.Set("name", "Ava")
  v.Add("friend", "Jess")
  v.Add("friend", "Sarah")
  v.Add("friend", "Zoe")
  fmt.Println(v.Get("name"))
  fmt.Println(v.Get("friend"))
  fmt.Println(v["friend"])
  // Output:
  // Ava
  // Jess
  // [Jess Sarah Zoe]
}
```

注释中Output:后是期望的输出结果，go test会运行这些函数并与期望的结果做比较，比较会忽略空格。

有时候我们输出的顺序是不确定的，这时就需要使用Unordered Output。我们知道url.Values底层类型为map[string][]string，所以可以遍历输出所有的键值，但是输出顺序不确定：

```go
func ExampleValuesAll() {
  v := url.Values{}
  v.Set("name", "Ava")
  v.Add("friend", "Jess")
  v.Add("friend", "Sarah")
  v.Add("friend", "Zoe")
  for key, values := range v {
    fmt.Println(key, values)
  }
  // Unordered Output:
  // name [Ava]
  // friend [Jess Sarah Zoe]
}
```

```sh
$ go test -v
=== RUN   ExampleValuesGet
--- PASS: ExampleValuesGet (0.00s)
=== RUN   ExampleValuesAll
--- PASS: ExampleValuesAll (0.00s)
PASS
ok      github.com/darjun/url   0.172s
```

没有注释，或注释中无Output/Unordered Output的函数会被忽略。