# Sync.pool

Sync.pool它池化的对象可能会被垃圾回收掉，这对于数据库长连接等场景是不合适的。


sync.Pool 数据类型用来保存一组可独立访问的临时对象。请注意这里加粗的“临时”这两个字，它说明了 sync.Pool 这个数据类型的特点，也就是说，它池化的对象会在未来的某个时候被毫无预兆地移除掉。而且，如果没有别的对象引用这个被移除的对象的话，这个被移除的对象就会被垃圾回收掉。

因为 Pool 可以有效地减少新对象的申请，从而提高程序性能

当大量的goroutine 并发输出的时候，就会创建比较多的 buffer，并且在不需要的时候回收掉。

- sync.Pool 本身就是线程安全的，多个 goroutine 可以并发地调用它的方法存取对象；
- sync.Pool 不可在使用之后再复制使用。


## 使用

它只提供了三个对外的方法：New、Get 和 Put。

### 1. New

当调用Pool 的 Get 方法从池中获取元素，**没有更多的空闲元素可返回时，就会调用这个 New 方法来创建新的元素**。 

如果你没有设置 New 字段，没有更多的空闲元素可返回时，Get 方法将返回 nil，表明当前没有可用的元素。

New 是可变的字段。这就意味着，你可以在程序运行的时候改变创建元素的方法。当然，很少有人会这么做，因为一般我们创建元素的逻辑都是一致的，要创建的也是同一类的元素，所以你在使用 Pool 的时候也没必要玩一些“花活”，在程序运行时更改New 的值。



### 2. Get

如果调用这个方法，就会从 Pool取走一个元素

这也就意味着，这个元素会从 Pool 中移除，返回给调用者。

不过，除了返回值是正常实例化的元素，Get 方法的返回值还可能会是一个 nil（Pool.New 字段没有设置，又没有空闲元素可以返回），所以你在使用的时候，可能需要判断。

### 3. Put

这个方法用于将一个元素返还给 Pool，Pool 会把这个元素保存到池中，并且可以复用。但如果 Put 一个 nil 值，Pool 就会忽略这个值。


## 示例

Sync.Pool 最常用的一个场景：buffer 池（缓冲池）

```go
// 实现sync.Pool结构体
var buffers = sync.Pool{
  New: func() interface{} {
    return new(bytes.Buffer)
  },
}

func GetBuffer() *bytes.Buffer {
  return buffers.Get().(*bytes.Buffer)
}

func PutBuffer(buf *bytes.Buffer) {
  buf.Reset()
  buffers.Put(buf)
}
```

```go
package main

import (
	"fmt"
	"sync"
  "time"
)

type MyObject struct {
	ID int
}

func main() {
	pool := sync.Pool{
		New: func() interface{} {
			return &MyObject{}
		},
	}

	// 创建多个对象放入池中
	for i := 0; i < 5; i++ {
		obj := &MyObject{ID: i}
		pool.Put(obj)
	}

	// 从池中获取对象并使用
	for i := 0; i < 6; i++ {
		obj := pool.Get().(*MyObject)
		fmt.Println("Object ID:", obj.ID)
    // 在第六个时候Pool里面没有了，会调用New自动创建一个
		// 使用完后将对象放回池中
    time.Sleep(time.Second)
		pool.Put(obj)
	}
}

```

## 实现原理

TODO: Sync.Pool实现原理


## Pool的内存泄露的坑

取出来的 bytes.Buffer 在使用的时候，我们可以往这个元素中增加大量的 byte 数据，这会导致底层的 byte slice 的容量可能会变得很大。这个时候，即使 Reset 再放回到池子中，这些 byte slice 的容量不会改变，所占的空间依然很大。而且，因为 Pool 回收的机制，这些大的 Buffer 可能不被回收，而是会一直占用很大的空间，这属于内存泄漏的问题。


## Pool的内存浪费情况

池子中的 buffer 都比较大，但在实际使用的时候，很多时候只需要一个小的 buffer，这也是一种浪费现象。

要做到物尽其用，尽可能不浪费的话，我们可以将 buffer 池分成几层。首先，小于 512byte 的元素的 buffer 占一个池子；其次，小于 1K byte 大小的元素占一个池子；再次，小于 4K byte 大小的元素占一个池子。这样分成几个池子以后，就可以根据需要，到所需大小的池子中获取 buffer 了。


## 三方库

- [bytebufferpool]() - buffer 池，基本功能和 sync.Pool 相同。它的底层也是使用 sync.Pool 实现的，包括会检测最大的 buffer，超过最大尺寸的 buffer，就会被丢弃。
- [oxtoacart/bpool]() - 这也是比较常用的 buffer 池，它提供了以下几种类型的 buffer

  - bpool.BufferPool- 提供一个固定元素数量的 buffer 池，元素类型是 bytes.Buffer，如果超过这个数量，Put 的时候就丢弃，如果池中的元素都被取光了，会新建一个返回。Put 回去的时候，不会检测 buffer 的大小
  - bpool.BytesPool - 提供一个固定元素数量的 byte slice 池，元素类型是 byte slice。Put 回去的时候不检测 slice 的大小。
  - bpool.SizedBufferPool - 提供一个固定元素数量的 buffer 池，如果超过这个数量，Put 的时候就丢弃，如果池中的元素都被取光了，会新建一个返回。Put 回去的时候，会检测 buffer 的大小，超过指定的大小的话，就会创建一个新的满足条件的 buffer 放回去。

  bpool 最大的特色就是能够保持池子中元素的数量，一旦 Put 的数量多于它的阈值，就会自动丢弃，而 sync.Pool 是一个没有限制的池子，只要 Put 就会收进去。

  bpool 是基于 Channel 实现的，不像 sync.Pool 为了提高性能而做了很多优化，所以，在性能上比不过 sync.Pool。不过，它提供了限制 Pool 容量的功能，所以，如果你想控制Pool 的容量的话，可以考虑这个库


### 连接池

Pool 的另一个很常用的一个场景就是保持 TCP 的连接。一个 TCP 的连接创建，需要三次握手等过程，如果是 TLS 的，还会需要更多的步骤，如果加上身份认证等逻辑的话，耗时会更长。所以，为了避免每次通讯的时候都新创建连接，我们一般会建立一个连接的池子，预先把连接创建好，或者是逐步把连接放在池子中，减少连接创建的耗时，从而提高系统的性能。

事实上，我们很少会使用 sync.Pool 去池化连接对象，原因就在于，sync.Pool 会无通知地在某个时候就把连接移除垃圾回收掉了，而我们的场景是需要长久保持这个连接，所以，我们一般会使用其它方法来池化连接，比如接下来我要讲到的几种需要保持长连接的Pool。


### 标准库中的 http client 池

标准库的 http.Client 是一个 http client 的库，可以用它来访问 web 服务器。为了提高性能，这个 Client 的实现也是通过池的方法来缓存一定数量的连接，以便后续重用些连接。

http.Client 实现连接池的代码是在 Transport 类型中，它使用 idleConn 保存持久化的可重用的长连接


### TCP 连接池

最常用的一个 TCP 连接池是 `fatih` 开发的[fatih/pool](),虽然这个项目已经被 fatih 归档（Archived），不再维护了，但是因为它相当稳定了.

```go
// 工厂模式，提供创建连接的工厂方法
factory := func() (net.Conn, error) { 
  return net.Dial("tcp", "127.0.0.1:4000") 
}
// 创建一个tcp池，提供初始容量和最大容量以及工厂方法
p, err := pool.NewChannelPool(5, 30, factory)
// 获取一个连接
conn,err := p.Get()
// Close并不会真正关闭这个连接，而是把它放回池子，所以你不必显式地Put这个对象到池子中
conn.Close()
// 通过调用MarkUnusable, Close的时候就会真正关闭底层的tcp的连接了
if pc, ok := conn.(*pool.PoolConn); ok {
  pc.MarkUnusable()
  pc.Close()
}
// 关闭池子就会关闭=池子中的所有的tcp连接
p.Close()
// 当前池子中的连接的数量
current := p.Len()
```

虽然我一直在说 TCP，但是它管理的是更通用的 net.Conn，不局限于 TCP 连接。


**它通过把 net.Conn 包装成 PoolConn，实现了拦截 net.Conn 的 Close 方法，避免了真正地关闭底层连接，而是把这个连接放回到池中**

```go
type PoolConn struct {
  net.Conn
  mu sync.RWMutex
  c *channelPool
  unusable bool
}

//拦截Close
func (p *PoolConn) Close() error {
  p.mu.RLock()
  defer p.mu.RUnlock()
  if p.unusable {
    if p.Conn != nil {
      return p.Conn.Close()
    }
    return nil
  }
  return p.c.put(p.Conn)
}

type channelPool struct {
  // 存储连接池的channel
  mu sync.RWMutex
  conns chan net.Conn
  // net.Conn 的产生器
  factory Factory
}
```

它的 Pool 是通过 Channel 实现的，空闲的连接放入到 Channel 中，这也是 Channel 的一个应用场景


### 数据库连接池


[`gomemcache`]()是他使用 Go 开发的 `Memchaced` 的客户端，其中也用了连接池的方式池化 `Memcached` 的连接
> Memchaced 是一个缓存库

### Worker Pool

一个 goroutine 初始的栈大小是 2048 个字节，并且在需要的时候可以扩展到 1GB（不同架构下最大数不同）， 所以，大量的goroutine 还是很耗资源的。同时，大量的 goroutine 对于调度和垃圾回收的耗时还是会有影响的，因此，goroutine 并不是越多越好


有的时候，我们就会创建一个 Worker Pool 来减少 goroutine 的使用。

一个 TCP 服务器，如果每一个连接都要由一个独立的 goroutine 去处理的话，在大量连接的情况下，就会创建大量的 goroutine，这个时候，我们就可以创建一个固定数量的
goroutine（Worker）， 由这一组 Worker 去处理连接，比如 [fasthttp]() 中的WorkerPool。

大部分的 Worker Pool 都是通过 Channel 来缓存任务的，因为 Channel 能够比较方便地实现并发的保护，有的是多个 Worker 共享同一个任务 Channel，有些是每个 Worker 都有一个独立的 Channel。

- [gammazero/workerpool]() - gammazero/workerpool 可以无限制地提交任务，提供了更便利的 Submit 和 SubmitWait 方法提交任务，还可以提供当前的 worker 数和任务数以及关闭 Pool 的功能
- [ivpusic/grpool]() - grpool 创建 Pool 的时候需要提供 Worker 的数量和等待执行的任务的最大数量，任务的提交是直接往 Channel 放入任务
- [dpaks/goworkers]() - dpaks/goworkers 提供了更便利的 Submi 方法提交任务以及Worker 数、任务数等查询方法、关闭 Pool 的方法。它的任务的执行结果需要在ResultChan 和 ErrChan 中去获取，没有提供阻塞的方法，但是它可以在初始化的时候设置 Worker 的数量和任务数。


