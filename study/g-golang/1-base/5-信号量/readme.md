# go中的信号量

![pv](/study/imgs/go-pv.webp)

## 信号量的定义


信号量的定义： 信号量(Semaphore)，有时被称为信号灯，是在多线程环境下使用的一种设施, 它负责协调各个线程, 以保证它们能够正确、合理的使用公共资源。

信号量的概念是荷兰计算机科学家 Edsger Dijkstra 在 1963 年左右提出来的，广泛应用在不同的操作系统中。在系统中，会给每一个进程一个信号量，代表每个进程目前的状态。未得到控制权的进程，会在特定的地方被迫停下来，等待可以继续进行的信号到来。


go在官方扩展包里面定义了信号量[https://pkg.go.dev/golang.org/x/sync/semaphore](https://pkg.go.dev/golang.org/x/sync/semaphore)

## Go 并发设计的一个惯用法就是将带缓冲 channel 用作**计数信号量**（counting semaphore）

带缓冲 channel 中的当前数据个数代表的是当前同时处于活动状态（处理业务）的 goroutine 的数量，而带缓冲 channel 的容量（capacity）就代表了允许同时处于活动状态的 goroutine 的最大数量。

向带缓冲 channel 的一个发送操作表示获取一个信号量，而从 channel 的一个接收操作则表示释放一个信号量。

**计数信号量经常被使用于限制最大并发数**。

```go
package main

import (
	"log"
	"sync"
	"time"
)

func main() {
	active := make(chan struct{}, 3)
	jobs := make(chan int, 10)
	go func() {
		for i := 0; i < 8; i++ {
			jobs <- i + 1
		}
		close(jobs)
	}()

	var wg sync.WaitGroup
	for j := range jobs {
		wg.Add(1)
		active <- struct{}{}
		go func(j int) {
			defer func() { <-active }()
			log.Printf("handle job: %d\n", j)
			time.Sleep(2 * time.Second)
			wg.Done()
		}(j)
	}
	wg.Wait()
}

/**
2021/07/14 23:15:17 handle job: 3
2021/07/14 23:15:17 handle job: 8
2021/07/14 23:15:17 handle job: 6
2021/07/14 23:15:19 handle job: 1
2021/07/14 23:15:19 handle job: 4
2021/07/14 23:15:19 handle job: 7
2021/07/14 23:15:21 handle job: 2
2021/07/14 23:15:21 handle job: 5 */

/**
创建了一组 goroutines 来处理 job，同一时间允许的最多 3 个 goroutine 处于活动状态。为达成这一目标，我们看到示例使用了一个容量 (capacity) 为 3 的带缓冲 channel:active 作为计数信号量，这意味着允许同时处于活动状态的最大 goroutine 数量为 3。

*/
/**
从示例运行结果中的时间戳我们可以看到：
虽然我们创建了很多 goroutine，但由于计数信号量的存在，同一时间内处理活动状态(正在处理 job)的 goroutine 的数量最多为 3 个。
*/
```

```go
package main

import (
	"log"
	"math/rand"
	"time"
)

type Customer struct{ id int }
type Bar chan Customer

func (bar Bar) ServeCustomer(c Customer) {
	log.Print("++ 顾客#", c.id, "开始饮酒")
	time.Sleep(time.Second * time.Duration(3+rand.Intn(16)))
	log.Print("-- 顾客#", c.id, "离开酒吧")
	<-bar // 离开酒吧，腾出位子
}

func main() {
	rand.Seed(time.Now().UnixNano())

	bar24x7 := make(Bar, 10) // 最对同时服务10位顾客
	for customerId := 0; ; customerId++ {
		time.Sleep(time.Second * 2)
		customer := Customer{customerId}
		bar24x7 <- customer // 等待进入酒吧
		go bar24x7.ServeCustomer(customer)
	}
}
```



## 官方扩展包 semaphore

> 它可以一次请求多个资源，这是通过 Channel 实现的信号量所不具备的。


```go
//  "golang.org/x/sync/semaphore"
var (
    maxWorkers = runtime.GOMAXPROCS(0)                    // worker数量
    sema       = semaphore.NewWeighted(int64(maxWorkers)) //信号量
    task       = make([]int, maxWorkers*4)                // 任务数，是worker的四倍
)

func main() {
    ctx := context.Background()

    for i := range task {
        // 如果没有worker可用，会阻塞在这里，直到某个worker被释放
        if err := sema.Acquire(ctx, 1); err != nil {
            break
        }

        // 启动worker goroutine
        go func(i int) {
            defer sema.Release(1)
            time.Sleep(100 * time.Millisecond) // 模拟一个耗时操作
            task[i] = i + 1
        }(i)
    }

    // 请求所有的worker,这样能确保前面的worker都执行完
    if err := sema.Acquire(ctx, int64(maxWorkers)); err != nil {
        log.Printf("获取所有的worker失败: %v", err)
    }

    fmt.Println(task)
}
```

在这段代码中，main goroutine 相当于一个 dispatcher，负责任务的分发。它先请求信号量，如果获取成功，就会启动一个 goroutine 去处理计算，然后，这个 goroutine 会释放这个信号量（有意思的是，信号量的获取是在 main goroutine，信号量的释放是在 worker goroutine 中），如果获取不成功，就等到有信号量可以使用的时候，再去获取。需要提醒你的是，其实，在这个例子中，还有一个值得我们学习的知识点，就是最后的那一段处理（第 25 行）。如果在实际应用中，你想等所有的 Worker 都执行完，就可以获取最大计数值的信号量。


Go 扩展库中的信号量是使用互斥锁 +List 实现的。互斥锁实现其它字段的保护，而 List 实现了一个等待队列，等待者的通知是通过 Channel 的通知机制实现的。

```go
type Weighted struct {
    size    int64         // 最大资源数
    cur     int64         // 当前已被使用的资源
    mu      sync.Mutex    // 互斥锁，对字段的保护
    waiters list.List     // 等待队列
}
```

在信号量的几个实现方法里，Acquire 是代码最复杂的一个方法，它不仅仅要监控资源是否可用，而且还要检测 Context 的 Done 是否已关闭。我们来看下它的实现代码

```go
func (s *Weighted) Acquire(ctx context.Context, n int64) error {
    s.mu.Lock()
        // fast path, 如果有足够的资源，都不考虑ctx.Done的状态，将cur加上n就返回
    if s.size-s.cur >= n && s.waiters.Len() == 0 {
      s.cur += n
      s.mu.Unlock()
      return nil
    }
  
        // 如果是不可能完成的任务，请求的资源数大于能提供的最大的资源数
    if n > s.size {
      s.mu.Unlock()
            // 依赖ctx的状态返回，否则一直等待
      <-ctx.Done()
      return ctx.Err()
    }
  
        // 否则就需要把调用者加入到等待队列中
        // 创建了一个ready chan,以便被通知唤醒
    ready := make(chan struct{})
    w := waiter{n: n, ready: ready}
    elem := s.waiters.PushBack(w)
    s.mu.Unlock()
  

        // 等待
    select {
    case <-ctx.Done(): // context的Done被关闭
      err := ctx.Err()
      s.mu.Lock()
      select {
      case <-ready: // 如果被唤醒了，忽略ctx的状态
        err = nil
      default: 通知waiter
        isFront := s.waiters.Front() == elem
        s.waiters.Remove(elem)
        // 通知其它的waiters,检查是否有足够的资源
        if isFront && s.size > s.cur {
          s.notifyWaiters()
        }
      }
      s.mu.Unlock()
      return err
    case <-ready: // 被唤醒了
      return nil
    }
  }
```

其实，为了提高性能，这个方法中的 fast path 之外的代码，可以抽取成 acquireSlow 方法，以便其它 Acquire 被内联。


Release 方法将当前计数值减去释放的资源数 n，并唤醒等待队列中的调用者，看是否有足够的资源被获取。

```go
func (s *Weighted) Release(n int64) {
    s.mu.Lock()
    s.cur -= n
    if s.cur < 0 {
      s.mu.Unlock()
      panic("semaphore: released more than held")
    }
    s.notifyWaiters()
    s.mu.Unlock()
}
```

notifyWaiters 方法就是逐个检查等待的调用者，如果资源不够，或者是没有等待者了，就返回：

notifyWaiters 方法是按照先入先出的方式唤醒调用者。当释放 100 个资源的时候，如果第一个等待者需要 101 个资源，那么，队列中的所有等待者都会继续等待，即使有的等待者只需要 1 个资源。这样做的目的是避免饥饿，否则的话，资源可能总是被那些请求资源数小的调用者获取，这样一来，请求资源数巨大的调用者，就没有机会获得资源了。


## 使用信号量常见的错误

- 请求了资源，但是忘记释放它；
- 释放了从未请求的资源；
- 长时间持有一个资源，即使不需要它；
- 不持有一个资源，却直接使用它。

不过，即使你规避了这些坑，在同时使用多种资源，不同的信号量控制不同的资源的时候，也可能会出现死锁现象，比如[哲学家就餐问题](https://en.wikipedia.org/wiki/Dining_philosophers_problem)。

就 Go 扩展库实现的信号量来说，在调用 Release 方法的时候，你可以传递任意的整数。但是，如果你传递一个比请求到的数量大的错误的数值，程序就会 panic。如果传递一个负数，会导致资源永久被持有。如果你请求的资源数比最大的资源数还大，那么，调用者可能永远被阻塞。

所以，使用信号量遵循的原则就是请求多少资源，就释放多少资源。你一定要注意，必须使用正确的方法传递整数，不要“耍小聪明”，而且，请求的资源数一定不要超过最大资源数。


除了 Channel，[marusama/semaphore](https://github.com/marusama/semaphore)也实现了一个可以动态更改资源容量的信号量，也是一个非常有特色的实现。如果你的资源数量并不是固定的，而是动态变化的，我建议你考虑一下这个信号量库。



## 信号量的使用场景

在多线程编程中，以下场景适合使用信号量：

- 控制对共享资源的访问：当多个线程需要同时访问某个共享资源时，可以使用互斥锁和信号量来实现线程之间的同步。互斥锁用于控制对共享资源的独占访问，而信号量用于控制并发访问的数量。
- 实现生产者-消费者模型：当一个或多个生产者生产数据，并将其放入缓冲区等待消费者处理时，可以使用信号量来实现生产者和消费者之间的同步。通过设置两个信号量分别表示缓冲区是否为空和是否已满，从而使得生产者和消费者能够协调工作。
- 管理线程池：当需要管理一组工作线程以执行任务时，可以使用信号量来限制线程池中可用线程的数量。通过设置一个计数器来记录当前可用的空闲线程数量，并在需要创建新线程或回收空闲线程时进行限制
- 等待其他线程完成任务：当一个或多个线程需要等待其他线程完成某些任务后才能继续执行时，可以使用信号量来实现等待机制。通过设置一个初始值为0的信号量，并在需要等待时调用wait()函数阻塞当前线程，直到其他线程完成任务后调用signal()函数唤醒该线程。

## 参考资料

[go并发实战课-信号量-极客时间](https://time.geekbang.org/column/article/308399?utm_source=u_nav_web&utm_medium=u_nav_web&utm_term=pc_interstitial_1413)