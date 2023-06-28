# rxgo 异步编程

ReactiveX，简称为 Rx，是一个异步编程的 API。

与 callback（回调）、promise（JS 提供这种方式）和 deferred（Python 的 twisted 网络编程库就是使用这种方式）这些异步编程方式有所不同，Rx 是基于事件流的。

这里的事件可以是系统中产生或变化的任何东西，在代码中我们一般用对象表示。

事件流需要被 Observer（观察者）处理才有意义。想象一下，我们日常作为一个 Observer，一个重要的工作就是观察 BUG 的事件流。每次发现一个 BUG，我们都需要去解决它。

[pipelines](https://blog.golang.org/pipelines)是 Go 基础的并发编程模型

其中包含，fan-in——多个 goroutine 产生数据，一个goroutine 处理数据，fan-out——一个 goroutine 产生数据，多个 goroutine 处理数据，fan-inout——多个 goroutine 产生数据，多个 goroutine 处理数据。

它们都是通过 channel 连接。RxGo 的实现就是基于 pipelines 的理念，并且提供了方便易用的包装和强大的扩展。


使用 RxGo 的一般流程如下：

- 使用相关的 Operator 创建 Observable，Operator 就是用来创建 Observable 的。这些术语都比较难贴切地翻译，而且英文也很好懂，就不强行翻译了；
- 中间各个阶段可以使用过滤操作筛选出我们想要的数据，使用转换操作对数据进行转换；
- 调用 Observable 的Observe()方法，该方法返回一个<- chan rxgo.Item。然后for range遍历即可。


- 首先使用Just创建一个仅有若干固定数据的 Observable；
- 使用Map()方法执行转换（将圆形转为方形）；
- 使用Filter()方法执行过滤（过滤掉黄色的方形）

```go
package main

import (
  "fmt"

  "github.com/reactivex/rxgo/v2"
)

func main() {
  observable := rxgo.Just(1, 2, 3, 4, 5)()
  ch := observable.Observe()
  for item := range ch {
    fmt.Println(item.V)
  }
}


// 1
// 2
// 3
// 4
// 5
```

Just使用柯里化（currying）让它可以在第一个参数中接受多个数据，在第二个参数中接受多个选项定制行为。柯里化是函数化编程的思想，简单来说就是通过在函数中返回函数，以此来减少每个函数的参数个数。


使用item.Error()检查是否出现错误。然后使用item.V访问数据，item.E访问错误

```go
func main() {
  observable := rxgo.Just(1, 2, errors.New("unknown"), 3, 4, 5)()
  observable.ForEach(func(v interface{}) {
    fmt.Println("received:", v)
  }, func(err error) {
    fmt.Println("error:", err)
  }, func() {
    fmt.Println("completed")
  })
}

// 1
// 2
// error: unknown
// 3
// 4
// 5
```

除了使用for range之外，我们还可以调用 Observable 的ForEach()方法来实现遍历。ForEach()接受 3 个回调函数

- NextFunc：类型为func (v interface {})，处理数据；
- ErrFunc：类型为func (err error)，处理错误；
- CompletedFunc：类型为func ()，Observable 完成时调用。


ForEach()实际上是异步执行的，它返回一个接收通知的 channel。当 Observable 数据发送完毕时，该 channel 会关闭。所以如果要等待ForEach()执行完成，我们需要使用<-。上面的示例中如果去掉<-，可能就没有输出了，因为主 goroutine 结束了，整个程序就退出了。

## 创建 Observable

上面使用最简单的方式创建 Observable：直接调用Just()方法传入一系列数据。下面再介绍几种创建 Observable 的方式。


### Create

传入一个[]rxgo.Producer的切片，其中rxgo.Producer的类型为func(ctx context.Context, next chan<- Item)。我们可以在代码中调用rxgo.Of(value)生成数据，rxgo.Error(err)生成错误，然后发送到next通道中


```go
func main() {
  observable := rxgo.Create([]rxgo.Producer{func(ctx context.Context, next chan<- rxgo.Item) {
    next <- rxgo.Of(1)
    next <- rxgo.Of(2)
    next <- rxgo.Of(3)
    next <- rxgo.Error(errors.New("unknown"))
    next <- rxgo.Of(4)
    next <- rxgo.Of(5)
  }})

  ch := observable.Observe()
  for item := range ch {
    if item.Error() {
      fmt.Println("error:", item.E)
    } else {
      fmt.Println(item.V)
    }
  }
}
```

### FromChannel

FromChannel可以直接从一个已存在的<-chan rxgo.Item对象中创建 Observable：

```go
func main() {
  ch := make(chan rxgo.Item)
  go func() {
    for i := 1; i <= 5; i++ {
      ch <- rxgo.Of(i)
    }
    close(ch)
  }()

  observable := rxgo.FromChannel(ch)
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
```

通道需要手动调用close()关闭，上面Create()方法内部rxgo自动帮我们执行了这个步骤。

### Interval

Interval以传入的时间间隔生成一个无穷的数字序列，从 0 开始：

```go
func main() {
  observable := rxgo.Interval(rxgo.WithDuration(5 * time.Second))
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

func main() {
  t := time.NewTicker(5 * time.Second)

  var count int
  for range t.C {
    fmt.Println(count)
    count++
  }
}
```

### Range

Range可以生成一个范围内的数字：

```go
func main() {
  observable := rxgo.Range(0, 3)
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
//上面代码依次输出 0，1，2，3。

```

### Repeat

在已存在的 Observable 对象上调用Repeat，可以实现每隔指定时间，重复一次该序列，一共重复指定次数：

```go

func main() {
  observable := rxgo.Just(1, 2, 3)().Repeat(
    3, rxgo.WithDuration(1*time.Second),
  )
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
//运行上面的代码，立即输出 1，2，3，然后等待 1s，又输出一次 1，2，3，然后又等待 1s，最后又输出一次 1，2，3。
```


### Start

可以给Start方法传入[]rxgo.Supplier作为参数，它可以包含任意数量的rxgo.Supplier类型。rxgo.Supplier的底层类型为：

```go
// rxgo/types.go
var Supplier func(ctx context.Context) rxgo.Item
```

Observable 内部会依次调用这些rxgo.Supplier生成rxgo.Item：

```go
func Supplier1(ctx context.Context) rxgo.Item {
  return rxgo.Of(1)
}

func Supplier2(ctx context.Context) rxgo.Item {
  return rxgo.Of(2)
}

func Supplier3(ctx context.Context) rxgo.Item {
  return rxgo.Of(3)
}

func main() {
  observable := rxgo.Start([]rxgo.Supplier{Supplier1, Supplier2, Supplier3})
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
```



## Observable 分类

根据数据在何处生成，Observable 被分为 Hot 和 Cold 两种类型（类比热启动和冷启动）。数据在其它地方生成的被成为 Hot Observable。相反，在 Observable 内部生成数据的就是 Cold Observable。

使用上面介绍的方法创建的实际上都是 Hot Observable。

```go
func main() {
  ch := make(chan rxgo.Item)
  go func() {
    for i := 0; i < 3; i++ {
      ch <- rxgo.Of(i)
    }
    close(ch)
  }()

  observable := rxgo.FromChannel(ch)

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
```

上面创建的是 Hot Observable。但是有个问题，第一次Observe()消耗了所有的数据，第二个就没有数据输出了。

而 Cold Observable 就不会有这个问题，因为它创建的流是独立于每个观察者的。即每次调用Observe()都创建一个新的 channel。我们使用Defer()方法创建 Cold Observable，它的参数与Create()方法一样。

```go
func main() {
  observable := rxgo.Defer([]rxgo.Producer{func(_ context.Context, ch chan<- rxgo.Item) {
    for i := 0; i < 3; i++ {
      ch <- rxgo.Of(i)
    }
  }})

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// 0
// 1
// 2
// 0
// 1
// 2

```

## 可连接的 Observable


可连接的（Connectable）Observable 对普通的 Observable 进行了一层组装。

调用它的Observe()方法时并不会立刻产生数据。

使用它，我们可以等所有的观察者都准备就绪了（即调用了Observe()方法）之后，再调用其Connect()方法开始生成数据。

我们通过两个示例比较使用普通的 Observable 和可连接的 Observable 有何不同。


```go 
// 普通的
func main() {
  ch := make(chan rxgo.Item)
  go func() {
    for i := 1; i <= 3; i++ {
      ch <- rxgo.Of(i)
    }
    close(ch)
  }()

  observable := rxgo.FromChannel(ch)

  observable.DoOnNext(func(i interface{}) {
    fmt.Printf("First observer: %d\n", i)
  })

  time.Sleep(3 * time.Second)
  fmt.Println("before subscribe second observer")

  observable.DoOnNext(func(i interface{}) {
    fmt.Printf("Second observer: %d\n", i)
  })

  time.Sleep(3 * time.Second)
}

// First observer: 1
// First observer: 2
// First observer: 3
// before subscribe second observer
// 输出可以看出，注册第一个观察者之后就开始产生数据了

func main() {
  ch := make(chan rxgo.Item)
  go func() {
    for i := 1; i <= 3; i++ {
      ch <- rxgo.Of(i)
    }
    close(ch)
  }()

  //  创建一个支持多次订阅的可观测序列 observable
  observable := rxgo.FromChannel(ch, rxgo.WithPublishStrategy())

  // 使用 DoOnNext 操作符为第一个观察者定义处理逻辑，打印每个元素的值
  observable.DoOnNext(func(i interface{}) {
    fmt.Printf("First observer: %d\n", i)
  })

  time.Sleep(3 * time.Second)
  fmt.Println("before subscribe second observer")

  observable.DoOnNext(func(i interface{}) {
    fmt.Printf("Second observer: %d\n", i)
  })

  //调用 observable.Connect(context.Background()) 来启动可观测序列的订阅和事件的发布
  observable.Connect(context.Background()) // context.Background() 函数返回一个空的 Context 对象，它是根节点（root）的上下文。
  time.Sleep(3 * time.Second)
}
// before subscribe second observer
// Second observer: 1
// First observer: 1
// First observer: 2
// First observer: 3
// Second observer: 2
// Second observer: 3

//上面是等两个观察者都注册之后，并且手动调用了 Observable 的Connect()方法才产生数据。而且可连接的 Observable 有一个特性：它是冷启动的，即每个观察者都会收到一份相同的拷贝。


// ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
// defer cancel()
// 使用了 context.WithTimeout() 函数基于 context.Background() 创建了一个带有 10 秒超时时间的上下文对象 ctx，并同时返回了一个 cancel 函数，用于在不再需要该上下文时进行取消。
```


## 转换 Observable

rxgo 提供了很多转换函数，可以修改经过它的rxgo.Item，然后再发送给下一个阶段。

### Map

Map()方法简单修改它收到的rxgo.Item然后发送到下一个阶段（转换或过滤）。Map()接受一个类型为func (context.Context, interface{}) (interface{}, error)的函数。第二个参数就是rxgo.Item中的数据，返回转换后的数据。如果出错，则返回错误。

```go
func main() {
  observable := rxgo.Just(1, 2, 3)()

  observable = observable.Map(func(_ context.Context, i interface{}) (interface{}, error) {
    return i.(int)*2 + 1, nil
  }).Map(func(_ context.Context, i interface{}) (interface{}, error) {
    return i.(int)*3 + 2, nil
  })

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// 11
// 17
// 23


// 上例中每个数字经过两个Map，第一个Map执行2 * i + 1，第二个Map执行3 * i + 2。即对于每个数字来说，最终进行的变换为3 * (2 * i + 1) + 2。运行：
```


## Marshal

Marshal对经过它的数据进行一次Marshal。这个Marshal可以是json.Marshal/proto.Marshal，甚至我们自己写的Marshal函数。它接受一个类型为func(interface{}) ([]byte, error)的函数用于对数据进行处理。

```go
type User struct {
  Name string `json:"name"`
  Age  int    `json:"age"`
}

func main() {
  observable := rxgo.Just(
    User{
      Name: "dj",
      Age:  18,
    },
    User{
      Name: "jw",
      Age:  20,
    },
  )()

  observable = observable.Marshal(json.Marshal)

  for item := range observable.Observe() {
    fmt.Println(string(item.V.([]byte)))
  }
}

// {"name":"dj","age":18}
// {"name":"jw","age":20}
```

## Unmarshal

既然有Marshal，也就有它的相反操作Unmarshal。Unmarshal用于将一个[]byte类型转换为相应的结构体或其他类型。与Marshal不同，Unmarshal需要知道转换的目标类型，所以需要提供一个函数用于生成该类型的对象。然后将[]byte数据Unmarshal到该对象中。Unmarshal接受两个参数，参数一是类型为func([]byte, interface{}) error的函数，参数二是func () interface{}用于生成实际类型的对象。我们拿上面的例子中生成的 JSON 字符串作为数据，将它们重新Unmarshal为User对象：

```go
type User struct {
  Name string `json:"name"`
  Age  int    `json:"age"`
}

func main() {
  observable := rxgo.Just(
    `{"name":"dj","age":18}`,
    `{"name":"jw","age":20}`,
  )()

  observable = observable.Map(func(_ context.Context, i interface{}) (interface{}, error) {
    return []byte(i.(string)), nil
  }).Unmarshal(json.Unmarshal, func() interface{} {
    return &User{}
  })

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// &{dj 18}
// &{jw 20}
```

## Buffer

Buffer按照一定的规则收集接收到的数据，然后一次性发送出去（作为切片），而不是收到一个发送一个。有 3 种类型的Buffer：

- BufferWithCount(n)：每收到n个数据发送一次，最后一次可能少于n个；
- BufferWithTime(n)：发送在一个时间间隔n内收到的数据；
- BufferWithTimeOrCount(d, n)：收到n个数据，或经过d时间间隔，发送当前收到的数据。

```go
func main() {
  observable := rxgo.Just(1, 2, 3, 4)()

  observable = observable.BufferWithCount(3)

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

//[1 2 3]
// [4]

func main() {
  ch := make(chan rxgo.Item, 1)

  go func() {
    i := 0
    for range time.Tick(time.Second) {
      ch <- rxgo.Of(i)
      i++
    }
  }()

  observable := rxgo.FromChannel(ch).BufferWithTime(rxgo.WithDuration(3 * time.Second))

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// [0 1 2]
// [3 4 5]
// [6 7 8]

func main() {
  ch := make(chan rxgo.Item, 1)

  go func() {
    i := 0
    for range time.Tick(time.Second) {
      ch <- rxgo.Of(i)
      i++
    }
  }()

  observable := rxgo.FromChannel(ch).BufferWithTimeOrCount(rxgo.WithDuration(3*time.Second), 2)

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// [0 1]
// [2 3]
// [4 5]
```

## GroupBy

GroupBy根据传入一个 Hash 函数，为每个不同的结果分别创建新的 Observable。换句话说，GroupBy生成一个数据类型为 Observable 的 Observable

```go
func main() {
  count := 3
  observable := rxgo.Range(0, 10).GroupBy(count, func(item rxgo.Item) int {
    return item.V.(int) % count
  }, rxgo.WithBufferedChannel(10)) // WithBufferedChannel() 函数允许你设置可观测序列使用缓冲通道，并指定缓冲大小以避免阻塞。缓冲通道允许在没有立即接收事件的情况下继续发送事件，直到达到缓冲大小。

  for subObservable := range observable.Observe() {
    fmt.Println("New observable:")

    for item := range subObservable.V.(rxgo.Observable).Observe() {
      fmt.Printf("item: %v\n", item.V)
    }
  }
}
// New observable:
// item: 0
// item: 3
// item: 6
// item: 9
// New observable:
// item: 1
// item: 4
// item: 7
// item: 10
// New observable:
// item: 2
// item: 5
// item: 8

// rxgo.WithBufferedChannel(10)的使用，由于我们的数字是连续生成的，依次为 0->1->2->...->9->10。
// 而 Observable 默认是惰性的，即由Observe()驱动。
// 内层的Observe()在返回一个 0 之后就等待下一个数，但是下一个数 1 不在此 Observable 中。
// 所以会陷入死锁。使用rxgo.WithBufferedChannel(10)，设置它们之间的连接 channel 缓冲区大小为 10，这样即使我们未取出 channel 里面的数字，上游还是能发送数字进来。

```


## 并行操作

默认情况下，这些转换操作都是串行的，即只有一个 goroutine 负责执行转换函数。

我们也可以使用rxgo.WithPool(n)选项设置运行n个 goroutine，或者rxgo.WitCPUPool()选项设置运行与逻辑 CPU 数量相等的 goroutine。


```go
func main() {
  observable := rxgo.Range(1, 100)

  observable = observable.Map(func(_ context.Context, i interface{}) (interface{}, error) {
    time.Sleep(time.Duration(rand.Int31()))
    return i.(int)*2 + 1, nil
  }, rxgo.WithCPUPool())

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// 由于是并行，所以输出顺序就不确定了。为了让不确定性更明显一点，我在代码中加了一行time.Sleep。
```

## 过滤 Observable

Observable 中发送过来的数据并不一定都是我们需要的，我们要把不想要的过滤掉。
### Filter

Filter()接受一个类型为func (i interface{}) bool的参数，通过的数据使用这个函数断言，返回true的将发送给下一个阶段。否则，丢弃。

```go
func main() {
  observable := rxgo.Range(1, 10)

  observable = observable.Filter(func(i interface{}) bool {
    return i.(int)%2 == 0
  })

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// 2
// 4
// 6
// 8
// 10
```

### ElementAt

ElementAt()只发送指定索引的数据，如ElementAt(2)只发送索引为 2 的数据，即第 3 个数据。

```go
func main() {
  observable := rxgo.Just(0, 1, 2, 3, 4)().ElementAt(2)

  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
// 2
```

### Debounce

Debounce()，它收到数据后还会等待指定的时间间隔，后续间隔内没有收到其他数据才会发送刚开始的数据。


```go
func main() {
  ch := make(chan rxgo.Item)

  go func() {
    ch <- rxgo.Of(1)
    time.Sleep(2 * time.Second)
    ch <- rxgo.Of(2)
    ch <- rxgo.Of(3)
    time.Sleep(2 * time.Second)
    close(ch)
  }()

  observable := rxgo.FromChannel(ch).Debounce(rxgo.WithDuration(2 * time.Second))
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
//1
//3
// 先收到 1，然后 2s 内没收到数据，所以发送 1。接着收到了数据 2，由于马上又收到了 3，所以 2 不会发送。收到 3 之后 2s 内没有收到数据，发送了 3。所以最后输出为 1，3


```

### Distinct

Distinct()会记录它发送的所有数据，它不会发送重复的数据。由于数据格式多样，Distinct()要求我们提供一个函数，根据原数据返回一个唯一标识码（有点类似哈希值）。基于这个标识码去重。

```go
func main() {
  observable := rxgo.Just(1, 2, 2, 3, 3, 4, 4)().
    Distinct(func(_ context.Context, i interface{}) (interface{}, error) {
      return i, nil
    })
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}

// 1，2，3，4

```

### Skip

Skip可以跳过前若干个数据。

```go
func main() {
  observable := rxgo.Just(1, 2, 3, 4, 5)().Skip(2)
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
```

### Take

Take只取前若干个数据。

```go
func main() {
  observable := rxgo.Just(1, 2, 3, 4, 5)().Take(2)
  for item := range observable.Observe() {
    fmt.Println(item.V)
  }
}
```

rxgo 让基于 pipelines 的并发编程变得更容易