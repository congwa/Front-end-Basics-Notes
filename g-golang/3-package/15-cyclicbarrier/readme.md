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


## 使用示例




## 参考

- [鸟窝大叔的《go并发编程实战课》](https://time.geekbang.org/column/article/309098)
- [golang新手57个坑](/study/g-golang/2-book/2-Golang新手可能会踩的57个坑.md)
- [Golang 中的回环栅栏](https://zhuanlan.zhihu.com/p/144871831)