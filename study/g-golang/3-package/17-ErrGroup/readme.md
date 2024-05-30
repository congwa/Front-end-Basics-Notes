# ErrGroup

并发编程包`ErrGroup`，其实这个包就是对`sync.waitGroup`的封装

使用`waitGroup`可以实现一个`goroutine`等待一组`goroutine`干活结束，更好的实现了任务同步，但是`WaitGroup`却无法返回错误，当一组`Goroutine`中的某个`goroutine`出错时，我们是无法感知到的，所以`ErrGroup`对`WaitGroup`进行了一层封装



## 示例

```go
var (
 Web   = fakeSearch("web")
 Image = fakeSearch("image")
 Video = fakeSearch("video")
)

type Result string
type Search func(ctx context.Context, query string) (Result, error)

func fakeSearch(kind string) Search {
 return func(_ context.Context, query string) (Result, error) {
  return Result(fmt.Sprintf("%s result for %q", kind, query)), nil
 }
}

func main() {
  Google := func(ctx context.Context, query string) ([]Result, error) {
    // 1. 首先我们使用errgroup.WithContext创建一个errGroup对象和ctx对象
    g, ctx := errgroup.WithContext(ctx)

    searches := []Search{Web, Image, Video}
    results := make([]Result, len(searches))
    for i, search := range searches {
    i, search := i, search // https://golang.org/doc/faq#closures_and_goroutines
    // 2. 然后我们直接调用errGroup对象的Go方法就可以启动一个协程, Go方法中已经封装了waitGroup的控制操作，不需要我们手动添加了
    g.Go(func() error {
      result, err := search(ctx, query)
      if err == nil {
        results[i] = result
      }
      return err
    })
    }
    // 3.最后我们调用Wait方法，其实就是调用了waitGroup方法
    if err := g.Wait(); err != nil {
      return nil, err
    }
    return results, nil
  }

  results, err := Google(context.Background(), "golang")
  if err != nil {
    fmt.Fprintln(os.Stderr, err)
    return
  }
  for _, result := range results {
    fmt.Println(result)
  }

}
```

这个包不仅减少了我们的代码量，而且还增加了错误处理，对于一些业务可以更好的进行并发处理


## 实现原理

TODO: ErrGroup实现原理




## errgroup扩展

如果我们无限制地直接调用 ErrGroup 的 Go 方法，就可能会创建出非常多的goroutine，太多的 goroutine 会带来调度和 GC 的压力，而且也会占用更多的内存资源。就像go#34457指出的那样，当前 Go 运行时创建的 g 对象只会增长和重用，不会回收，所以在高并发的情况下，也要尽可能减少 goroutine 的使用

常用的一个手段就是使用 worker pool(goroutine pool)，或者是类似containerd/stargz-snapshotter的方案，使用前面我们讲的信号量，信号量的资源的数量就是可以并行的 goroutine 的数量。但是在这一讲，我来介绍一些其它的手段，比如下面介绍的 bilibili 实现的 errgroup

- [bilibili/errgroup](https://github.com/go-kratos/kratos/blob/v0.3.3/pkg/sync/errgroup/errgroup.go) - 这是 B 站微服务框架中的一个拓展包。
  
  bilibili 实现了一个扩展的 ErrGroup，可以使用一个固定数量的 goroutine 处理子任务。如果不设置 goroutine 的数量，那么每个子任务都会比较“放肆地”创建一个 goroutine.

  除了可以控制并发 goroutine 的数量，它还提供了 2 个功能：
      - cancel，失败的子任务可以 cancel 所有正在执行任务；
      - recover，而且会把 panic 的堆栈信息放到 error 中，避免子任务 panic 导致的程序崩溃。
  
  但是，有一点不太好的地方就是，一旦你设置了并发数，超过并发数的子任务需要等到调用者调用 Wait 之后才会执行，而不是只要 goroutine 空闲下来，就去执行。如果不注意这一点的话，可能会出现子任务不能及时处理的情况，这是这个库可以优化的一点。

  这个库其实是有一个并发问题的。在高并发的情况下，如果任务数大于设定的goroutine 的数量，并且这些任务被集中加入到 Group 中，这个库的处理方式是把子任务加入到一个数组中，但是，这个数组不是线程安全的，有并发问题. **可以查看issue看看有没有修复**

- [neilotoole/errgroup](https://github.com/neilotoole/errgroup)
  可以直接替换官方的ErrGroup，方法都一样，原有功能也一样，只不过增加了可以控制并发 goroutine 的功能。
  
  ```go
  func WithContext(ctx context.Context) (*Group, context.Context)
  ```

  新增加的方法 WithContextN，可以设置并发的 goroutine 数，以及等待处理的子任务队列的大小。当队列满的时候，如果调用 Go 方法，就会被阻塞，直到子任务可以放入到队列中才返回。如果你传给这两个参数的值不是正整数，它就会使用 runtime.NumCPU 代替你传入的参数。

- [facebookgo/errgroup](https://github.com/facebookarchive/errgroup/tree/master)

  Facebook 提供的这个 ErrGroup，其实并不是对 Go 扩展库 ErrGroup 的扩展，而是对标准库 WaitGroup 的扩展。

  标准库的 WaitGroup 只提供了 Add、Done、Wait 方法，而且 Wait 方法也没有返回子goroutine 的 error。

  而 Facebook 提供的 ErrGroup 提供的 Wait 方法可以返回 error，而且可以包含多个 error。子任务在调用 Done 之前，可以把自己的 error 信息设置给ErrGroup。接着，Wait 在返回的时候，就会把这些 error 信息返回给调用者。


## 参考资料

- [鸟叔极客时间-go并发实战]()
- [聊聊 ErrorGroup 的用法和拓展](https://marksuper.xyz/2021/10/15/error_group/)

