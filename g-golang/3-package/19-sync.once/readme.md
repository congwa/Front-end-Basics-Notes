# sync.Once

Go语言标准库中的sync.Once可以保证go程序在运行期间的某段代码只会执行一次，作用与init类似，但是也有所不同：

- init函数是在文件包首次被加载的时候执行，且只执行一次。
- sync.Once是在代码运行中需要的时候执行，且只执行一次。


```go
// sync.Once, 懒汉模式
type singleton struct {
 
}

var instance *singleton
var once sync.Once
func GetInstance() *singleton {
 once.Do(func() {
  instance = new(singleton)
 })
 return instance
}
```


## 实现

```go
// 只有两个字段，字段done用来标识代码块是否执行过，字段m是一个互斥锁。
type Once struct {
 // done indicates whether the action has been performed.
 // It is first in the struct because it is used in the hot path.
 // The hot path is inlined at every call site.
 // Placing done first allows more compact instructions on some architectures (amd64/x86),
 // and fewer instructions (to calculate offset) on other architectures.
 done uint32
 m    Mutex
}

func (o *Once) Do(f func()) {
 if atomic.LoadUint32(&o.done) == 0 {
  o.doSlow(f)
 }
}

func (o *Once) doSlow(f func()) {
 o.m.Lock()
 defer o.m.Unlock()
 if o.done == 0 {
  defer atomic.StoreUint32(&o.done, 1)
  f()
 }
}
```

- 首先原子性的读取done字段的值是否改变，没有改变则执行doSlow()方法.
- 一进入doslow()方法就开始执行加锁操作，这样在并发情况下可以保证只有一个线程会执行，在判断一次当前done字段是否发生改变(这里肯定有朋友会感到疑惑，为什么这里还要在判断一次flag？这里目的其实就是保证并发的情况下，代码块也只会执行一次，毕竟加锁是在doslow()方法内，不加这个判断的在并发情况下就会出现其他goroutine也能执行f())，如果未发生改变，则开始执行代码块，代码块运行结束后会对done字段做原子操作，标识该代码块已经被执行过了.