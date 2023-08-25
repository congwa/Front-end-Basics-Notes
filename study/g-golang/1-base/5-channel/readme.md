# channel

channel类似于所有权的转移，通过通信的方式，一个goroutine可以把数据的所有权交给另外一个。

channel的应用场景分为5类。

1. 数据交流： 当做并发的buffer或者queue，解决生产者-消费者问题。 多个goroutine可以并发当做生产者和消费者。
2. 数据传递： 一个goroutine可以将数据交给另一个goroutine，相当于把所有权(引用)托付出去。
3. 信号通知： 一个goroutine可以将金浩（closeing、closed、data ready等）传递给另一个或一组goroutine
4. 任务编排：可以让一组goroutine按照一定的顺序并发或者串性执行，这就是编排的功能
5. 锁： 利用Channel也可以实现互斥锁的机制



## 消息交流

一个 goroutine 可以安全地往 Channel 中塞数据，另外一个 goroutine 可以安全地从 Channel 中读取数据，goroutine 就可以安全地实现信息交流了

## 数据传递

当前持有数据的 goroutine 都有一个信箱，信箱使用 chan 实现，goroutine 只需要关注自己的信箱中的数据，处理完毕后，就把结果发送到下一家的信箱中


## 信号通知

chan 类型有这样一个特点：chan 如果为空，那么，receiver 接收数据的时候就会阻塞等待，直到 chan 被关闭或者有新的数据到来。利用这个机制，我们可以实现 wait/notify 的设计模式。

传统的并发原语 Cond 也能实现这个功能，但是，Cond 使用起来比较复杂，容易出错，而使用 chan 实现 wait/notify 模式就方便很多了。

```go
func main() {
  go func() {
    ...... // 执行业务处理
  }()
  // 处理CTRL+C等中断信号
  termChan := make(chan os.Signal)
  signal.Notify(termChan, syscall.SIGINT, syscall.SIGTERM)
  <-termChan
  // 执行退出之前的清理动作
  doCleanup()
  fmt.Println("优雅退出")
}
```

## 锁

使用 chan 也可以实现互斥锁。

要想使用 chan 实现互斥锁，至少有两种方式。
- 一种方式是先初始化一个 capacity 等于 1的 Channel，然后再放入一个元素。这个元素就代表锁，谁取得了这个元素，就相当于获取了这把锁。
- 另一种方式是，先初始化一个 capacity 等于 1 的 Channel，它的“空槽”代表锁，谁能成功地把元素发送到这个 Channel，谁就获取了这把锁。

```go

// 使用chan实现互斥锁
type Mutex struct {
  ch chan struct{}
}

// 使用锁需要初始化
func NewMutex() *Mutex {
  mu := &Mutex{make(chan struct{}, 1)}
  mu.ch <- struct{}{}
  return mu
}

// 请求锁，直到获取到
func (m *Mutex) Lock() {
  <-m.ch
}

// 解锁
func (m *Mutex) Unlock() {
  select {
    case m.ch <- struct{}{}:
    default:
      panic("unlock of unlocked mutex")
  }
}

// 尝试获取锁
func (m *Mutex) TryLock() bool {
  select {
    case <-m.ch:
      return true
    default:
  }
return false
}

// 加入一个超时的设置
func (m *Mutex) LockTimeout(timeout time.Duration) bool {
  timer := time.NewTimer(timeout)
  select {
    case <-m.ch:
      timer.Stop()
      return true
    case <-timer.C:
  }
return false
}

// 锁是否已被持有
func (m *Mutex) IsLocked() bool {
  return len(m.ch) == 0
}

func main() {
  m := NewMutex()
  ok := m.TryLock()
  fmt.Printf("locked v %v\n", ok)
  ok = m.TryLock()
  fmt.Printf("locked %v\n", ok)
}
```


## 任务编排

- WaitGroup，我们可以利用它实现等待模式

下面5种编排方式，指多个 chan 按照指定的方式组合处理的方式

### 1. Or-Done 模式

信号通知模式中的一种。

**信号通知**：我们会使用“信号通知”实现某个任务执行完成后的通知机制，在实现时，我们为这个任务定义一个类型为 chan struct{}类型的 done 变量，等任务结束后，我们就可以 close 这个变量，然后，其它 receiver 就会收到这个通知。

这是有一个任务的情况，如果有多个任务，只要有任意一个任务执行完，我们就想获得这个信号，这就是 Or-Done 模式。

比如，你发送同一个请求到多个微服务节点，只要任意一个微服务节点返回结果，就算成功，这个时候，就可以参考下面的实现：

```go
// 循环处理channel是一个一个处理的，前面的阻塞，后面的就监听不到了,所以用递归或者反射
func or(channels ...<-chan interface{}) <-chan interface{} {
// 特殊情况，只有零个或者1个chan
  switch len(channels) {
    case 0:
      return nil
    case 1:
      return channels[0]
  }

  orDone := make(chan interface{})

  go func() {
    defer close(orDone)
    switch len(channels) {
      case 2: // 2个也是一种特殊情况
      select {
        case <-channels[0]:
        case <-channels[1]:
      }   
      default:
      m: = length(channels) / 2 // 超过2个二分法递归处理
      select {
        case <-or(channels[:m]...):
        case <-or(channels[m:]...):
      }
    }
  }()

  return orDone
}

func sig(after time.Duration) <-chan interface{} {
  c := make(chan interface{})
  go func() {
    defer close(c)
    time.Sleep(after)
  }()
  return c
}

func main() {
  start := time.Now()
  <-or(
    sig(10*time.Second),
    sig(20*time.Second),
    sig(30*time.Second),
    sig(40*time.Second),
    sig(50*time.Second),
    sig(01*time.Minute),
  )
  fmt.Printf("done after %v", time.Since(start))
}

```

```go
// 不使用递归可以使用反射来实现 or方法
func or(channels ...<-chan interface{}) <-chan interface{} {
  switch len(channels) {
    case 0:
      return nil
    case 1:
      return channels[0]
  }

  orDone := make(chan interface{})

  go func() {
    defer close(orDone)

    // 利用反射构建SelectCase
    var cases []reflect.SelectCase
    for _, c := range channels {
      cases = append(cases, reflect.SelectCase{
        Dir:  reflect.SelectRecv,
        Chan: reflect.ValueOf(c),
      })
    }

    reflect.Select(cases)
  }()

  return orDone
}
func sig(after time.Duration) <-chan interface{} {
  c := make(chan interface{})
  go func() {
    defer close(c)
    time.Sleep(after)
  }()
  return c
}

func main() {
  start := time.Now()
  <-or(
    sig(10*time.Second),
    sig(20*time.Second),
    sig(30*time.Second),
    sig(40*time.Second),
    sig(50*time.Second),
    sig(01*time.Minute),
  )
  fmt.Printf("done after %v", time.Since(start))
}
```

### 2. 扇入模式

扇入借鉴了数字电路的概念，它定义了单个逻辑门能够接受的数字信号输入最大量的术语。一个逻辑门可以有多个输入，一个输出。

在软件工程中，模块的扇入是指有多少个上级模块调用它。

而对于我们这里的 Channel 扇入模式来说，就是指有多个源 Channel 输入、一个目的 Channel 输出的情况。扇入比就是源 Channel 数量比 1。

每个源 Channel 的元素都会发送给目标 Channel，相当于目标 Channel 的 receiver 只需要监听目标 Channel，就可以接收所有发送给源 Channel 的数据。

扇入模式也可以使用反射、递归，或者是用最笨的每个 goroutine 处理一个 Channel 的方式来实现。

```go
func fanInReflect(chans ...<-chan interface{}) <-chan interface{} {
  out := make(chan interface{})
  go func() {
    defer close(out)
    //构造SelectCase slice
    var cases []reflect.SelectCase
    for _, c := range chans {
      cases = append(cases, reflect.SelectCase{
        Dir:  reflect.SelectRecv,
        Chan: reflect.ValueOf(c),
      })
    }
    // 循环，从cases中选择一个可用的
    for len(cases) > 0 {
      i, v, ok := reflect.Select(cases)
      if !ok { //此channel已经close
        cases = append(cases[:i], cases[i+1:]...)
        continue
      }
      out <- v.Interface()
    }
  }()
  return out
}
```

```go
// 递归模式
func fanInRec(chans ...<-chan interface{}) <-chan interface{} {
  switch len(chans) {
    case 0:
      c := make(chan interface{})
      close(c)
      return c
    case 1:
      return chans[0]
    case 2:
      return mergeTwo(chans[0], chans[1])
    default:
      m := len(chans) / 2
      return mergeTwo(
        fanInRec(chans[:m]...),
        fanInRec(chans[m:]...))
  }
}

// mergeTwo 的方法，是将两个 Channel 合并成一个 Channel，是扇入形式的一种特例（只处理两个 Channel）
func mergeTwo(a, b <-chan interface{}) <-chan interface{} {
  c := make(chan interface{})
  go func() {
    defer close(c)
    for a != nil || b != nil { //只要还有可读的chan
      select {
        case v, ok := <-a:
          if !ok { // a 已关闭，设置为nil
            a = nil
            continue
          }
          c <- v
        case v, ok := <-b:
          if !ok { // b 已关闭，设置为nil
            b = nil
            continue
          }
          c <- v
      }
    }
  }()
  return c
}
```



### 3. 扇出模式

有扇入模式，就有扇出模式，扇出模式是和扇入模式相反的。

扇出模式只有一个输入源 Channel，有多个目标 Channel，扇出比就是 1 比目标 Channel数的值，经常用在设计模式中的观察者模式中（观察者设计模式定义了对象间的一种一对多的组合关系。这样一来，一个对象的状态发生变化时，所有依赖于它的对象都会得到通知并自动刷新）。在观察者模式中，数据变动后，多个观察者都会收到这个变更信号。

下面是一个扇出模式的实现。从源 Channel 取出一个数据后，依次发送给目标 Channel。在发送给目标 Channel 的时候，可以同步发送，也可以异步发送：

```go
func fanOut(ch <-chan interface{}, out []chan interface{}, async bool) {
  go func() {
    defer func() { // 退出时候关闭所有的输出chan
      for i := 0; i < len(out); i++ {
        close(out[i])
      }
    }()

    for v := range ch { // 从输入chan中读取数据
      v := v
      for i := 0; i < len(out); i++ {
        i := i
        if async {
          go func() {
            out[i] <- v // 放入到输出chan中，异步方式
          }()
        } else {
          out[i] <- v // 放入到输出chan中，同步方式
        }
      }
    }
  }()
}
```

### 4. Stream

把 Channel 当作流式管道使用的方式，也就是把 Channel 看作流（Stream），提供跳过几个元素，或者是只取其中的几个元素等方法。

```go
// 创建流的方法。这个方法把一个数据 slice 转换成流：

func asStream(done <- chan struct{}, values ...interface{}) <-chan interface{} {
  s := make(chan interface{}) // 创建一个unbuffered的channel
  go func() { // 启动一个goroutine，往s中塞数据
    defer close(s)

    for _,v := range values {
      select {
        case <-done:
          return
        case s <- v: // 将数组元素塞入到chan中
      }
    }
  }
}

/**
  takeN 只读取流中的前n个元素
 */
func takeN(done <-chan struct{}, valueStream <-chan interface{}, num int) <-chan interface{} {
  takeStream := make(chan interface{}) // 创建输出流
  go func() {
    defer close(takeStream)
    for i := 0; i < num; i++ { // 只读前num个元素
      select {
        case <-done:
          return
        case takeStream <- <-valueStream: // 从输入流中读取元素
      }
      
    }
  }()
  return takeStream
}
```

### 5. Map-Reduce

map-reduce 分为两个步骤，第一步是映射（map），处理队列中的数据，第二步是规约（reduce），把列表中的每一个元素按照一定的处理方式处理成结果，放入到结果队列中

就像做汉堡一样，map 就是单独处理每一种食材，reduce 就是从每一份食材中取一部分，做成一个汉堡。

```go
func mapChan(in <- chan interface{}, fn func(interface{}) interface{}) <- chan interface{} {
  out := make(chan interface{}) // 创建一个输出chan
  if in == nil {
    close(out)
    return out
  }

  go func() { // 启动一个goroutine,实现map的主要逻辑
    defer close(out)

    for v := range in { // 从输出chan读取数据，执行业务操作，也就是map操作
      out <- fn(v)
    }

  }()
}

func reduce(in <- chan interface{}, fn func(r, v interface{}) interface{}) interface{} {
  if in == nil {
    return nil
  }

  out := <-in // 先取第一个元素
  for v := range in { // 实现reduce主要逻辑
    out = fn(out, v) // out的值和当前map的item传回去，约定再传回来作为下一次的out， 循环完返回out
  }
  return out
}
```