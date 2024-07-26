# cyclicbarrier 循环栅栏

[https://github.com/marusama/cyclicbarrier](https://github.com/marusama/cyclicbarrier)

循环栅栏（CyclicBarrier），它常常应用于重复进行一组 goroutine 同时执行的场景中。


`CyclicBarrier`允许一组 `goroutine` 彼此等待，到达一个共同的执行点。同时，因为它可以被重复使用，所以叫循环栅栏。具体的机制是，大家都在栅栏前等待，等全部都到齐了，就抬起栅栏放行。

事实上，这个 `CyclicBarrier` 是参考[Java CyclicBarrier](https://docs.oracle.com/en/java/javase/15/docs/api/java.base/java/util/concurrent/CyclicBarrier.html)和[C# Barrier](https://learn.microsoft.com/en-us/dotnet/api/system.threading.barrier?redirectedfrom=MSDN&view=netcore-3.1)的功能实现的。Java 提供了 CountDownLatch（倒计时器）和 CyclicBarrier（循环栅栏）两个类似的用于保证多线程到达同一个执行点的类，只不过前者是到达 0 的时候放行，后者是到达某个指定的数的时候放行。C# Barrier 功能也是类似的，你可以查看链接，了解它的具体用法。


你可能会觉得，`CyclicBarrier` 和 `WaitGroup` 的功能有点类似，确实是这样。不过，`CyclicBarrier` 更适合用在“固定数量的 `goroutine` 等待同一个执行点”的场景中，而且在放行 `goroutine` 之后，`CyclicBarrier` 可以重复利用，不像 `WaitGroup` 重用的时候，必须小心翼翼避免` panic`。

处理可重用的多 goroutine 等待同一个执行点的场景的时候，CyclicBarrier 和 WaitGroup 方法调用的对应关系如下：



![CyclicBarrier](/study/imgs/CyclicBarrier.webp)


可以看到，如果使用 WaitGroup 实现的话，调用比较复杂，不像 CyclicBarrier 那么清爽。更重要的是，**如果想重用 WaitGroup，你还要保证，将 WaitGroup 的计数值重置到 n 的时候不会出现并发问题**。


## 实现原理

1. 容量为 1 的 buffered channel, 门的逻辑可以通过先从 channel 中接收数据，然后再次向其中发送数据来实现,如果 channel 中包含元素数量为 1，则表示门是开的。它会让一个 worker 通过并往 channel 中放入新的元素以使另外一个 worker 通过，依此类推。如果 channel 中没有元素了则表示门关闭了。接着 worker 从 channel 中接收元素就会被阻塞
2. 使用了容量和 worker 数量 n 相等的 buffered channel。现在我们不再让 worker 一个接一个地依次通过，而是在 channel 中放入 n 个元素来使所有的 worker 一次性通过

TODO: 


## 利用waitGroup实现循环栅栏

```go
// 使用 sync.WaitGroup 和 sync.Mutex 实现一个循环栅栏(Cyclic Barrier),来确保所有的 goroutine 都达到某个同步点后才继续执行
package main

import (
    "fmt"
    "sync"
)

func main() {
    // 定义要计算的数组
    nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    // 创建一个 WaitGroup 用于跟踪 goroutine 的执行
    var wg sync.WaitGroup
    wg.Add(len(nums))

    // 创建一个 Mutex 和 Condition 用于实现循环栅栏
    var mutex sync.Mutex
    var cond = sync.NewCond(&mutex)
    var count int // 用于记录到达同步点的 goroutine 数量

    // 创建一个 channel 用于接收计算结果
    results := make(chan int, len(nums))

    // 启动 goroutine 并行计算数字的平方和
    for _, num := range nums {
        go calculateSquareSum(num, results, &wg, &cond, &count)
    }

    // 等待所有 goroutine 执行完毕
    wg.Wait()

    // 从 channel 中收集计算结果并累加
    var total int
    for i := 0; i < len(nums); i++ {
        total += <-results
    }

    fmt.Println("The sum of square of numbers is:", total)
}

func calculateSquareSum(num int, results chan<- int, wg *sync.WaitGroup, cond *sync.Cond, count *int) {
    defer wg.Done() // 在 goroutine 结束时减少 WaitGroup 的计数器

    squareSum := num * num
    results <- squareSum

    cond.L.Lock() // 获取 Mutex 锁
    *count++      // 增加到达同步点的 goroutine 数量
    if *count == len(results) { // 如果所有 goroutine 都到达同步点
        cond.Broadcast() // 唤醒所有等待的 goroutine
    } else {
        cond.Wait() // 等待其他 goroutine 到达同步点
    }
    cond.L.Unlock() // 释放 Mutex 锁
}
```

## 使用示例




## 参考

- [鸟窝大叔的《go并发编程实战课》](https://time.geekbang.org/column/article/309098)
- [golang新手57个坑](/study/g-golang/2-book/2-Golang新手可能会踩的57个坑.md)
- [Golang 中的回环栅栏](https://zhuanlan.zhihu.com/p/144871831)