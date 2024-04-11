# Sync.Cond 条件变量

Golang 的 sync 包中的 Cond 实现了一种`条件变量`，可以**使多个 Reader 等待公共资源**。

每个 Cond 都会关联一个 Lock ,当修改条件或者调用 Wait 方法，必须加锁，保护 Condition

`sync.Cond` 条件变量是用来协调想要共享资源的那些 `goroutine`, 当共享资源的状态发生变化时，可以被用来通知被互斥锁阻塞的 `gorountine`


## 与 `Sync.Mutex` 的区别

sync.Cond 基于互斥锁，和互斥锁有什么区别？


`sync.Mutex` 通常用来保护临界区和共享资源，条件变量 `sync.Cond` 用来协调想要访问的共享资源。


## 使用场景

有一个协程正在接收数据，其他协程必须等待这个协程接收完数据，才能读取到正确的数据。

上述情形下，如果单纯的使用 channel 或者互斥锁，只能有一个协程可以等待，并读取到数据，没办法通知其他协程也读取数据。


这个时候怎么办？


- 可以用一个全局变量标识第一个协程是否接收数据完毕，剩下的协程反复检查该变量的值，直到读取到数据。  -浪费不必要的cpu
- 也可创建多个 channel, 每个协程阻塞在一个 Channel 上，由接收数据的协程在数据接收完毕后，挨个通知。 - 很麻烦，不优雅


然后 Go 中其实内置来一个 sync.Cond 来解决这个问题。


## sync.Cond

```go
// Each Cond has an associated Locker L (often a *Mutex or *RWMutex),
// which must be held when changing the condition and
// when calling the Wait method.
//
// A Cond must not be copied after first use.
type Cond struct {
    noCopy noCopy

    // L is held while observing or changing the condition
    L Locker

    notify  notifyList
    checker copyChecker
}

```

可以看到每个 Cond 都会关联一个 锁 L (互斥锁 Mutex, 或者读写锁 * RMMutex), 当修改条件或者使用 Wait 的时候必须要加锁。


### NewCond 创建实例

```go
// 创建实例需要关联一个锁
func NewCond(l Locker) *Cond

// 示例
cadence := sync.NewCond(&sync.Mutex{})
```


### Broadcast 广播唤醒所有

Broadcast 唤醒所有等待条件变量 c 的 goroutine，无需锁保护。

```go
// Broadcast wakes all goroutines waiting on c.
//
// It is allowed but not required for the caller to hold c.L
// during the call.
func (c *Cond) Broadcast()

// 示例
go func() {
   for range time.Tick(1 * time.Millisecond) {
      cadence.Broadcast()
   }
}()

```


### Signal 唤醒一个协程

Signal 只唤醒任意1个等待条件变量 c 的 goroutine，无需锁保护。

```go
// Signal wakes one goroutine waiting on c, if there is any.
//
// It is allowed but not required for the caller to hold c.L
// during the call.
func (c *Cond) Signal()

```


### Wait 等待

调用 `Wait` 会自动释放锁 `c.L`，并挂起调用者所在的 `goroutine`，因此当前协程会阻塞在 `Wait` 方法调用的地方。如果其他协程调用了 `Signal` 或 `Broadcast` 唤醒了该协程，`Wait` 方法结束阻塞时，并重新给 `c.L` 加锁，并且继续执行 `Wait` 后面的代码


```go
// Wait atomically unlocks c.L and suspends execution
// of the calling goroutine. After later resuming execution,
// Wait locks c.L before returning. Unlike in other systems,
// Wait cannot return unless awoken by Broadcast or Signal.
//
// Because c.L is not locked when Wait first resumes, the caller
// typically cannot assume that the condition is true when
// Wait returns. Instead, the caller should Wait in a loop:
//
//    c.L.Lock()
//    for !condition() {
//        c.Wait()
//    }
//    ... make use of condition ...
//    c.L.Unlock()
//
func (c *Cond) Wait()

// 示例
c.L.Lock()
for !condition() {
    c.Wait()
}
... make use of condition ...
c.L.Unlock()

```


## 使用示例

```go
package sync

import (
   "log"
   "sync"
   "testing"
   "time"
)

var done = false

func read(name string, c *sync.Cond) {
   c.L.Lock()
   for !done {  // for 这里叫优先调度
      c.Wait()
   }
   log.Println(name, "starts reading")
   c.L.Unlock()
}

func write(name string, c *sync.Cond) {
   log.Println(name, "starts writing")
   time.Sleep(time.Second)
   c.L.Lock()
   done = true
   c.L.Unlock()
   log.Println(name, "wakes all")
   c.Broadcast()
}

func TestSyncCond(t *testing.T) {
   cond := sync.NewCond(&sync.Mutex{})

   go read("reader1", cond)
   go read("reader2", cond)
   go read("reader3", cond)
   write("writer", cond)

   time.Sleep(time.Second * 3)
}

// === RUN   TestSyncCond
// 2021/08/26 11:06:48 writer starts writing
// 2021/08/26 11:06:49 writer wakes all
// 2021/08/26 11:06:49 reader3 starts reading
// 2021/08/26 11:06:49 reader2 starts reading
// 2021/08/26 11:06:49 reader1 starts reading
// --- PASS: TestSyncCond (4.01s)
// PASS



```