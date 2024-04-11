# context

context: 在1.7版本引入，其目的在一次请求经过的所有协程或函数间传递取消信号及共享数据，以达到父协程对子协程的管理和控制的目的


```go
type Context interface {

    Deadline() (deadline time.Time, ok bool)

    Done() <-chan struct{}

    Err() error

    Value(key interface{}) interface{}
}
```

context.Context的定义实际上是一个接口类型，该接口定义了获取上下文的Deadline的函数，根据key获取value值的函数、还有获取done通道的函数。

对于传递取消信号的行为我们可以描述为：当协程运行时间达到Deadline时，就会调用取消函数，关闭done通道，往done通道中输入一个空结构体消息struct{}{}，这时所有监听done通道的子协程都会收到该消息，便知道父协程已经关闭，需要自己也结束运行。

感受一下

```go
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
    defer cancel()
    go doSomethingCool(ctx)
    select {
    case <-ctx.Done():
        fmt.Println("oh no, I've exceeded the deadline")
    }
}
func doSomethingCool(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("timed out")
            return
        default:
            fmt.Println("doing something cool")
        }
        time.Sleep(500 * time.Millisecond)
    }
}

// main协程和doSomething函数之间的唯一关联就是ctx.Done()。当子协程从ctx.Done()通道中接收到输出时（因为超时自动取消或主动调用了cancel函数），即认为是父协程不再需要子协程返回的结果了，子协程就会直接返回，不再执行其他的逻辑。
```

## 作用1：协程间传递信号

### 创建带可以传递信号的Context

在context包中已经定义好了所需场景的结构体，这些结构体已经帮我们实现了Context接口的方法，在项目中就已经够用了。

在context包中定义有`emptyCtx`、`cancelCtx`、`timerCtx`、`valueCtx`四种结构体。其中`cancelCtx`、`timerCtx`实现了给子协程传递取消信号。

`valueCtx`结构体实现了父协程和子协程传递共享数据相关。本节我们重点来看跟传递信号相关的`Context`。

```go
//创建带有取消功能的Context
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) 

//创建带有定时自动取消功能的Context
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc)
//创建带有定时自动取消功能的Context
func WithDeadline(parent Context, d time.Time) (Context, CancelFunc)
```

对应的函数创建的结构体及该实例所实现的功能的主要特点如下图所示：

![context](/study/imgs/timer_context.webp)

在图中我们看到结构体依次是继承关系。因为在cancelCtx结构体内嵌套了Context（实际上是emptyCtx）、timerCtx结构体内嵌套了cancelCtx结构体，可以认为他们之间存在继承关系。
​
通过WithTimeout和WithDealine函数创建的Context实际上都是timerCtx结构体，唯一的区别就是WithDeadline函数的第二个参数指定的是最后的时间点，而WithTimeout函数的第二个参数是一段时间。但WithDealine在内部实现中本质上也是将时间点转换成距离当前的时间段。


### Done函数返回值是通道

在Context接口的定义中我们看到Done函数的定义，其返回值是一个输出通道：

```go
Done() <-chan struct{}
```

在上面的示例中我们看到的子协程是通过监听Context的Done()函数返回的通道来判断父协程是否发送了取消信号的。当父协程调用取消函数时，该取消函数将该通道关闭。

**关闭通道相当于是一个广播信息，当监听该通道的接收者从通道到中接收完最后一个元素后，接收者都会解除阻塞，并从通道中接收到通道元素类型的零值。**

既然父子协程是通过通道传到信号的。下面我们介绍父协程是如何将信号通过通道传递给子协程的。

### 父协程是如何取消子协程的

我们发现在Context接口中并没有定义Cancel方法。实际上通过WithCancel函数创建的一个具有可取消功能的Context实例来实现的：

```go
// WithCancel 返回一个 parent 的拷贝，当 parent.Done 被关闭或调用 cancel 时，parent 的 Done 通道也会被关闭。
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
    if parent == nil {
        panic("cannot create context from nil parent")
    }
    c := newCancelCtx(parent)
    propagateCancel(parent, &c)
    return &c, func() { c.cancel(true, Canceled) }
}
```

WithCancel函数的返回值有两个，一个是ctx，一个是取消函数cancel。当父协程调用cancel函数时，就相当于触发了关闭的动作，在cancel的执行逻辑中会将ctx的done通道关闭，然后所有监听该通道的子协程就会收到一个struct{}类型的零值，子协程根据此便执行了返回操作。下面是cancel函数实现：

```go
//  cancel 关闭 c.done，取消 c 的每个子节点，并且如果 removeFromParent 为 true，则将 c 从其父节点的子节点中移除。
func (c *cancelCtx) cancel(removeFromParent bool, err error) {
    //...
    d, _ := c.done.Load().(chan struct{})//获取通道
    if d == nil {
        c.done.Store(closedchan)
    } else {
        close(d) //关闭通道done
    }
    //...
}
```

cancelCtx的cancel函数执行时会关闭通道close(d)。

通过WithCancel函数构造的Context，**需要开发者自己设定调用取消函数的条件**。 而在某些场景下需要设定超时时间，比如调用grpc服务时设置超时时间，那么实际上就是在构造Context的同时，启动一个定时任务，当达到设定的定时时间时，就自动调用cancel函数即可。 这就是context包中提供的WithDeadline和WithTimeout函数来构造的上下文。如下是WithDeadline函数的关键实现部分：

```go
func WithDeadline(parent Context, d time.Time) (Context, CancelFunc) {
    //...
    c := &timerCtx{
        cancelCtx: newCancelCtx(parent),
        deadline:  d,
    }
    propagateCancel(parent, c)
    dur := time.Until(d)
    //...
    if c.err == nil {
        //这里实现定时器，即dur时间后执行cancel函数
        c.timer = time.AfterFunc(dur, func() {
            c.cancel(true, DeadlineExceeded)
        })
    }
    return c, func() { c.cancel(true, Canceled) }
}
```

WithTimeout函数也是将相对时间timeout转换成绝对的时间点deadline之后，调用的WithDeadline函数。

### 通过WithXXX函数构造一个树形结构

通过WithXXX函数基于Context会衍生出一个Context树，树的每个节点都可以有任意多个子节点Context。如下图表示：

![context_tree](/study/imgs/context-tree.webp)

那为什么要构造一个树形结构呢？我们从处理一个请求时经过的多个协程来角度来理解会更容易一些。

当一个请求到来时，该请求会经过很多个协程的处理，而这些**协程之间的关系实际上就组成了一个树形结构**。如下图：

![context_tree](/study/imgs/context-tree.webp)

Context的目的就是为了在关联的协程间传递信号和共享数据的，而每个协程又只能管理自己的子节点，而不能管理父节点。所以，在整个处理过程中，Context自然就衍生成了树形结构。


如上图所示，main goroutine能管理其下的所有子节点以及孙子节点，但goroutine2只能管理自己的子节点goroutine2.1和goroutine2.2，不能管理和自己并行的其他节点。那么这些协程节点之间的管理就是通过对应的Context来进行传递信号和共享值的。

### WithXXX函数返回的是一个新的Context对象

通过WithXXX的源码可以看到，每个衍生函数返回来的都是一个新的Context对象，并且都是基于parent Context的。

以WithDeadline为例，就是返回的一个timerCtx新的结构体实例。这是因为，在Context的传递过程中，每个协程都能根据自己的需要来定制Context（例如，在上图中，main协程调用goroutine2时要求是600毫秒完成操作，但goroutine2调用goroutine2.1时，要求是500毫秒内完成操作），而这些修改又不能影响之前已经调用的函数，只能对向下传递。所以，通过一个新的Context值来进行传递。


## 作用2：协程间传递共享数据

Context的另外一个功能就是在协程间共享数据。该功能是通过WithValue函数构造的Context来实现的。我们看下WithValue的实现：

```go
func WithValue(parent Context, key, val interface{}) Context {
    if parent == nil {
        panic("cannot create context from nil parent")
    }
    if key == nil {
        panic("nil key")
    }
    if !reflectlite.TypeOf(key).Comparable() {
        panic("key is not comparable")
    }
    return &valueCtx{parent, key, val}
}
```

实现代码很简短，我们看到最终返回的是一个valueCtx结构体实例。
其中有两点：一是key的类型必须是可比较的。二是value是不能修改的，即具有不可变性。如果需要添加新的值，只能通过WithValue基于原有的Context再生成一个新的valueCtx来携带新的key-value。

这也是Context的值在传递过程中是并发安全的原因。 从另外一个角度来说，在获取一个key的值的时候，也是递归的一层一层的从下往上查找，如下：

```go
func (c *valueCtx) Value(key interface{}) interface{} {
    if c.key == key {
        return c.val
    }
    return c.Context.Value(key)
}
```

但这里讨论的重点什么样的数据需要通过Context来共享，而不是通过传参的方式？

- 携带的数据作用域必须是在请求范围内有效的。即该数据随着请求的产生而产生，随着请求的结束而结束，不会永久的保存。
- 携带的数据不建议是关键参数，关键参数应显式的通过参数来传递。例如像trace_id之类的，用于维护作用，就适合用在Context中传递。


### 什么是请求范围（request-scoped）内的数据

这个没有一个明显的划定标准。一般的请求范围的数据就是用来表示该请求的元数据。比如该请求是由谁发出（即user id），该请求是在哪儿发出的（即user ip，请求是从该用户的ip位置发出的）。

例如，如果一个日志对象logger是一个单例那么它也不是一个请求范围内的数据。但如果该logger包含了发送请求的来源信息，以及该请求是否启动了调试功能的开关信息，那么该logger也可以被认为是一个请求范围内的数据。


### 使用Context.Value的缺点

使用Context.Value会对降低函数的可读性和表达性。例如，下面是使用Context.Value来携带token验证角色的示例：

```go
func IsAdminUser(ctx context.Context) bool {
  x := token.GetToken(ctx)
  userObject := auth.AuthenticateToken(x)
  return userObject.IsAdmin() || userObject.IsRoot()
}
```

当用户调用该函数的时候，仅仅知道该函数带有一个Context类型的参数。但如果要判断一个用户是否是Admin必须要两部分要说明：一个是验证过的token，一个是认证服务。

我们将该函数的Context移除，然后使用参数的方式来重构，如下：


```go
func IsAdminUser(token string, authService AuthService) bool {
  x := token.GetToken(ctx)
  userObject := auth.AuthenticateToken(x)
  return userObject.IsAdmin() || userObject.IsRoot()
}
```

那么这个函数的可读性和表达性就比重构前提高了很多。调用者通过函数签名就很容易知道要判断一个用户是否是AdminUser，只需要传入token和认证的服务authService即可。
​

### context.Value的使用场景

一般复杂的项目都会有中间件层以及大量的抽象层。如果将类似token或userid这样简单的参数以参数的方式从第一个函数层层传递，那对调用者来说将会是一种噩梦。如果将这样的元数据通过Context来携带进行传递，将会是比较好的方式。在实际项目中，最常用的就是在中间件中。我们以iris为web框架，来看下在中间件中的应用：

```go
package main

import (
    "context"
    "github.com/google/uuid"
    "github.com/kataras/iris/v12"
)

func main() {
    app := iris.New()
    app.Use(RequestIDMiddleware)

    app.Get("/hello", mainHandler)

    app.Listen("localhost:8080", iris.WithOptimizations)
}

func RequestIDMiddleware(c iris.Context) {
    reqID := uuid.New()
    ctx := context.WithValue(c.Request().Context(), "req_id", reqID)
    req := c.Request().Clone(ctx)
    c.ResetRequest(req)
    c.Next()
}

func mainHandler(ctx iris.Context) {
    req_id := ctx.Request().Context().Value("req_id")
    ctx.Writef("Hello request id:%s", req_id)
    return
}
```


context包定义了一个API，它提供对截止日期、取消信号和请求范围值的支持，这些值可以跨API以及在Goroutine之间传递。


## 使用示例

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// 创建爷爷协程的上下文
	ctx := context.Background()

	// 在爷爷协程中设置消息，并创建父协程
	ctx = context.WithValue(ctx, "message", "Hello from grandparent")
	parentCtx, parentCancel := context.WithCancel(ctx)
	go parentRoutine(parentCtx)

	// 等待一会，然后取消父协程
	time.Sleep(2 * time.Second)
	parentCancel()

	// 等待一段时间，以观察子协程是否也被取消了
	time.Sleep(1 * time.Second)
	fmt.Println("Main goroutine ended")
}

func parentRoutine(ctx context.Context) {
	// 从爷爷协程的上下文中获取消息，并创建子协程
	message := ctx.Value("message").(string)
	ctx = context.WithValue(ctx, "message", message+" - Hello from parent")
	childCtx, childCancel := context.WithCancel(ctx)
	go childRoutine(childCtx)

	// 等待一会，然后取消子协程
	time.Sleep(1 * time.Second)
	childCancel()

	// 等待一段时间，以观察父协程是否也被取消了
	time.Sleep(1 * time.Second)
	fmt.Println("Parent goroutine ended")
}

func childRoutine(ctx context.Context) {
	// 从父协程的上下文中获取消息，并输出
	message := ctx.Value("message").(string)
	fmt.Println(message)

	// 模拟一些工作
	time.Sleep(2 * time.Second)

	// 检查是否被取消，如果是则结束协程
	select {
	case <-ctx.Done():
		fmt.Println("Child goroutine canceled")
	default:
		fmt.Println("Child goroutine completed")
	}
}
// ==============================
// Hello from grandparent - Hello from parent
// Parent goroutine ended
// Child goroutine canceled
// Main goroutine ended
// 在主函数中，我们等待一段时间后取消父协程。通过使用带有 context.WithCancel 创建的上下文，我们可以在需要时手动取消协程。最后，我们再次等待一段时间，以观察子协程是否也被取消了。
```

改一下上面的例子，不调用childCancel()的时候，我们可以看到孙子协程被取消了。 表明了之间的关联关系

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// 创建爷爷协程的上下文
	ctx := context.Background()

	// 在爷爷协程中设置消息，并创建父协程
	ctx = context.WithValue(ctx, "message", "Hello from grandparent")
	parentCtx, parentCancel := context.WithCancel(ctx)
	go parentRoutine(parentCtx)

	// 等待一会，然后取消父协程
	time.Sleep(2 * time.Second)
	parentCancel()

	// 等待一段时间，以观察子协程是否也被取消了
	time.Sleep(1 * time.Second)
	fmt.Println("Main goroutine ended")
}

func parentRoutine(ctx context.Context) {
	// 从爷爷协程的上下文中获取消息，并创建子协程
	message := ctx.Value("message").(string)
	ctx = context.WithValue(ctx, "message", message+" - Hello from parent")
	childCtx, _ := context.WithCancel(ctx)
	go childRoutine(childCtx)

	// 等待一会，然后取消子协程
	time.Sleep(1 * time.Second)
// 	childCancel()

	// 等待一段时间，以观察父协程是否也被取消了
	time.Sleep(1 * time.Second)
	fmt.Println("Parent goroutine ended")
}

func childRoutine(ctx context.Context) {
	// 从父协程的上下文中获取消息，并输出
	message := ctx.Value("message").(string)
	fmt.Println(message)

	// 模拟一些工作
	time.Sleep(2 * time.Second)

	// 检查是否被取消，如果是则结束协程
	select {
	case <-ctx.Done():
		fmt.Println("Child goroutine canceled")
	default:
		fmt.Println("Child goroutine completed")
	}
}

// ==============================
// Hello from grandparent - Hello from parent
// Parent goroutine ended
// Child goroutine canceled
// Main goroutine ended
```