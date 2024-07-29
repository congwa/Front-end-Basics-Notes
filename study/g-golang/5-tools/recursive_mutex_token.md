# 基于token的可重入锁 TokenRecursiveMutex


- 支持跨 goroutine 的锁重入: 之前的实现只支持同一个 goroutine 的重入,而使用 token 的方式可以支持跨 goroutine 的锁重入。
- 可以在多个 goroutine 之间共享同一个锁: 只要 goroutine 持有同一个 token,就可以共享同一个可重入锁。

```go
package mutex

import (
 "fmt"
 "sync"
 "sync/atomic"
)

// TokenRecursiveMutex Token方式的递归锁
type TokenRecursiveMutex struct {
 sync.Mutex
 token     int64
 recursion int64
}

// Lock 请求锁，需要传入token
func (m *TokenRecursiveMutex) Lock(token int64) {
 if atomic.LoadInt64(&m.token) == token { // 如果传入的token和持有锁的token一致，说明是递归调用
  atomic.AddInt64(&m.recursion, 1)
  return
 }
 m.Mutex.Lock() // 传入的token不一致，说明不是递归调用
 // 抢到锁之后记录这个token
 atomic.StoreInt64(&m.token, token)
 atomic.StoreInt64(&m.recursion, 1)
}

// Unlock 释放锁
func (m *TokenRecursiveMutex) Unlock(token int64) {
 if atomic.LoadInt64(&m.token) != token { // 释放其它token持有的锁
  panic(fmt.Sprintf("wrong the owner(%d): %d!", m.token, token))
 }
 recursion := atomic.AddInt64(&m.recursion, -1)
 if recursion != 0 { // 如果这个goroutine还没有完全释放，则直接返回
  return
 }
 atomic.StoreInt64(&m.token, 0) // 没有递归调用了，释放锁
 m.Mutex.Unlock()
}

```

基于token的可重入锁，可以实现跨 goroutine 的锁重入，使用时候在特殊场景中使用，因为此锁可能不在同一个goroutine中，**主要是避免死锁事情的发生**。

使用示例

```go
package main

import (
 "fmt"
 "sync"
)

type SharedData struct {
 Value int
 Mutex TokenRecursiveMutex
}

func main() {
 data := &SharedData{}

 var wg sync.WaitGroup
 wg.Add(2)

 // Goroutine 1 accessing the shared data
 go func() {
  defer wg.Done()

  // Use the same token for both goroutines
  token := int64(1)

  data.Mutex.Lock(token)
  defer data.Mutex.Unlock(token)

  data.Value += 10
  fmt.Println("Goroutine 1 updated value:", data.Value)
 }()

 // Goroutine 2 accessing the shared data
 go func() {
  defer wg.Done()

  // Use the same token as Goroutine 1
  token := int64(1)

  data.Mutex.Lock(token)
  defer data.Mutex.Unlock(token)

  data.Value += 20
  fmt.Println("Goroutine 2 updated value:", data.Value)
 }()

 wg.Wait()
 fmt.Println("Final value:", data.Value)
}
```

注意： 上面两个协程都可同事获取锁，执行顺序无法预知，有可能导致问题，但在部分递归(递归读取一个缓冲区)场景下使用，可以避免死锁的发生。
