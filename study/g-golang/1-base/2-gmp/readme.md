# gmp

TODO: gmp


首先要了解几个名词

宽泛的说，一个正在运行的程序就是一个进程。



一个运行的程序需要CPU、Memory、IO等资源，根资源封装调度的区别定义了操作系统语境下的进程、线程和协程。

资源的调度可能发生在内核态（OS），也可以在用户态（程序）。

CPU可以是抢占式分配，也可以是协作式分配。

Memory可以独占，也可以共享。

- 内核态调度，抢占式分配CPU，不共享Memory。这是操作系统的进程。
- 内核态调度，抢占式分配CPU，共享Memory。这是操作系统的线程。
- 用户态调度，抢占式分配CPU，不共享Memory。这是轻量级进程。
- 用户态调度，抢占式分配CPU，共享Memory。这是用户态线程，也叫绿色线程。
- 用户态调度，协作式分配CPU，共享Memory。这是协程。


## 用户级线程

用户态调度，抢占式分配CPU，共享Memory。这是用户态线程，也叫绿色线程。

## 系统线程

内核态调度，抢占式分配CPU，共享Memory。这是操作系统的线程

如果此时只有一个cpu，用户态线程和内核态线程肯定是要抢占cpu的，但是用户态线程可以采用类似io多路复用轮训的方式，在使用的时候才唤醒或者定时唤醒，这样减少cpu的时间片占用，那么内核态线程就会得到更多的时间片，如果时间片连续，那么就变成了协程切换，开销较小。 调度的几种方式之[时间片轮转法](/study/c-操作系统原理/进程管理.md)

> 结论： 用户态线程由用户创建和控制，用户要对cpu的时间片负责，尽量不用的时候阻塞，减少无异议时间片的调用，平时用不到的时候尽量阻塞，以给内核态更多的cpu调度时间分配

## 理解-**线程上下文切换的开销**

在一定条件下，线程越多，进程利用或者说抢占的 cpu 资源就会越高,

![switch_t](/study/imgs/switch_t.png)

那么是不是线程可以无限制的开启呢？

答案当然不是的，我们知道，当我们**cpu 在内核态切换一个执行单元的时候，会有一个上下文切换的时间成本和性能开销**

![cpu_switch](/study/imgs/cpu_switch.png)

其中性能开销至少有以下两个方面：

- 切换内核上下文栈
- 保存寄存器中的状态内容

因此，我们不能大量的开辟线程。

> 经过上面分析得出结论： 减少线程的切换开销(理想状态下，如果在一个cpu只在一个线程的情况下，自然不会有线程切换开销)

## 协程

让内核线程只有一个，自然没有内核线程的切换的开销。

用户任务的切换由用户去控制，也在同一个线程上面完成。

以如上的策略，自然减少了cpu的利用切换造成的开销。 

> 注意区分单cpu和多cpu的分配的利用率，以便于理解，但是在用户态的代码一致。 总的原则还是，减少cpu在线程上面的切换。
>
> 类比： 和http2、http3有很大的相似之处，既然内核态调度无法更改(tcp传输这里无法更改)，那么更改用户可以控制部分，只利用不可修改部分的一部分机制，其余由用户帮忙处理，以达到高效率的目的。


## 协程切换成本

协程切换比线程切换快主要有两点：

1. 协程切换完全在用户空间，而进行线程切换涉及特权模式切换，需要在内核空间完成；
2. 协程切换相比线程切换做的事情更少，线程需要有内核和用户态的切换，涉及系统调用过程。

协程切换比较简单，就是把当前协程的 CPU 寄存器状态保存起来，然后将需要切换进来的协程的 CPU 寄存器状态加载的 CPU 寄存器上就 ok 了。而且完全在用户态进行，一般来说一次协程上下文切换最多就是几十 ns 这个量级。

## 线程切换成本

系统内核调度的对象是线程，因为线程是调度的基本单元（进程是资源拥有的基本单元，进程的切换需要做的事情更多，这里占时不讨论进程切换），而线程的调度只有拥有最高权限的内核空间才可以完成，所以线程的切换涉及到用户空间和内核空间的切换，也就是特权模式切换。进程一般占用 1 ～ 4g 不等的内存，G 量级。 线程一般占用 2 ～ 8M 不等内存，MB 量级。 而协程占用 2 ～ 4KB 内存，KB 量级。那么，go 的协程切换成本如此小，占用也那么小，是否可以无限开辟呢？ 前面有一篇文章讲到过这个问题，不妨看下这篇文章：




## 参考资料

[协程作为用户态线程是如何提高性能和并发量的？](https://www.zhihu.com/question/455735271)
