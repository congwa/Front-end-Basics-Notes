# RecursiveMutex 可重用锁

> 可重入锁允许同一个 goroutine 多次对同一个锁进行加锁和解锁操作,而不会造成死锁

使用场景

- 函数递归调用: 一个函数内部可能会多次调用需要获取同一个锁的代码片段。如果使用普通的互斥锁,就可能会发生死锁。
- 锁嵌套使用: 一个 goroutine 可能需要先获取一个锁,然后在持有该锁的情况下去获取另一个锁。如果使用普通的互斥锁,也可能会发生死锁。

```go
package mutex

import (
 "fmt"
 "sync"
 "sync/atomic"
 "runtime"
 "strconv"
 "strings"
)

// GetGID 获取goroutine唯一ID
func GetGID() int64 {
 var buf [64]byte
 n := runtime.Stack(buf[:], false)
 // 得到id字符串
 idField := strings.Fields(strings.TrimPrefix(string(buf[:n]), "goroutine "))[0]
 id, err := strconv.Atoi(idField)
 if err != nil {
  panic(fmt.Sprintf("cannot get goroutine id: %v", err))
 }
 return int64(id)
}


// RecursiveMutex 包装一个Mutex,实现可重入
type RecursiveMutex struct {
 sync.Mutex
 owner     int64 // 当前持有锁的goroutine id
 recursion int64 // 这个goroutine 重入的次数
}

func (m *RecursiveMutex) Lock() {
 gid := goid.GetGID()
 // 如果当前持有锁的goroutine就是这次调用的goroutine,说明是重入
 if atomic.LoadInt64(&m.owner) == gid {
  atomic.AddInt64(&m.recursion, 1)
  return
 }
 m.Mutex.Lock()
 // 获得锁的goroutine第一次调用，记录下它的goroutine id,调用次数加1
 atomic.StoreInt64(&m.owner, gid)
 atomic.StoreInt64(&m.recursion, 1)
}

func (m *RecursiveMutex) Unlock() {
 gid := goid.GetGID()
 // 非持有锁的goroutine尝试释放锁，错误的使用
 if atomic.LoadInt64(&m.owner) != gid {
  panic(fmt.Sprintf("wrong the owner(%d): %d!", m.owner, gid))
 }
 // 调用次数减1
 recursion := atomic.AddInt64(&m.recursion, -1)
 if recursion != 0 { // 如果这个goroutine还没有完全释放，则直接返回
  return
 }
 // 此goroutine最后一次调用，需要释放锁
 atomic.StoreInt64(&m.owner, -1)
 m.Mutex.Unlock()
}

```
