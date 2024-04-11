# sync.WaitGroup


一个`waitGroup`对象可以等待一组协程结束，也就等待一组`goroutine`返回。有了`sync.WaitGroup`我们可以将原本顺序执行的代码在多个`Goroutine`中并发执行，加快程序处理的速度




## 示例

```go
package main

import (
 "sync"
)

type httpPkg struct{}

func (httpPkg) Get(url string) {}

var http httpPkg

func main() {
 var wg sync.WaitGroup
 var urls = []string{
  "http://www.golang.org/",
  "http://www.google.com/",
  "http://www.somestupidname.com/",
 }
 for _, url := range urls {
  // Increment the WaitGroup counter.
  wg.Add(1)
  // Launch a goroutine to fetch the URL.
  go func(url string) {
   // Decrement the counter when the goroutine completes.
   defer wg.Done()
   // Fetch the URL.
   http.Get(url)
  }(url)
 }
 // Wait for all HTTP fetches to complete.
 wg.Wait()
}

// 首先我们需要声明一个sync.WaitGroup对象，在主Goroutine调用Add()方法设置要等待的goroutine数量，每一个Goroutine在运行结束时要调用Done()方法，同时使用Wait()方法进行阻塞直到所有的goroutine完成。
```


## 实现原理

TODO: sync.WaitGroup实现原理


## 参考

[源码剖析sync.WaitGroup](https://mp.weixin.qq.com/s?__biz=MzkyNzI1NzM5NQ==&mid=2247484784&idx=1&sn=368be2e2003b85f0e26337b566d0ebde&scene=21#wechat_redirect)