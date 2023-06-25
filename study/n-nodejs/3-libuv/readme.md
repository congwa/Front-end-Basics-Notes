
# libuv

TODO: libuv

## 线程

线程会在内部使用，用来在执行系统调用时伪造异步的假象。

libuv通过线程还可以使得程序异步地执行一个阻塞的任务。方法就是大量地生成新线程，然后收集线程执行返回的结果。

当下有两个占主导地位的线程库：windows下的线程实现和POSIX的pthread。libuv的线程API与pthread的API在使用方法和语义上很接近。

libuv的线程模块是自成一体的。比如，其他的功能模块都需要依赖于event loop和回调的原则，但是线程并不是这样。它们是不受约束的，会在需要的时候阻塞，通过返回值产生信号错误，还有像接下来的这个例子所演示的这样，不需要在event loop中执行。

考虑到libuv的跨平台特性，libuv支持的线程API个数很有限。


**只有一个主线程，主线程上只有一个event loop。不会有其他与主线程交互的线程了**。（除非使用uv_async_send）。


## 参考资料

[阮一峰-2013-EventLoop概念](https://www.ruanyifeng.com/blog/2013/10/event_loop.html)
[阮一峰-2014JavaScript 运行机制详解：再谈Event Loop](https://www.ruanyifeng.com/blog/2014/10/event-loop.html)

[libuv运行机制入门视频](https://www.youtube.com/watch?v=nGn60vDSxQ4)
[libuv运行概述](http://docs.libuv.org/en/v1.x/design.html#the-i-o-loop)

[libuv简介总结](https://luohaha.github.io/Chinese-uvbook/source/threads.html)



[libuv 流程简介](https://github.com/HXWfromDJTU/blog/issues/25)