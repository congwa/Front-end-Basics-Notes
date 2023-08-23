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