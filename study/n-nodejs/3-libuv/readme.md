
# libuv

TODO: libuv

![nodejs事件循环全景图](/study/imgs/node_eventloop.jpg)
> node.v11后跟浏览器一样，每个宏任务完成，都会调一轮微任务，不再是每个阶段结束才会调

## 线程

线程会在内部使用，用来在执行系统调用时伪造异步的假象。

libuv通过线程还可以使得程序异步地执行一个阻塞的任务。方法就是大量地生成新线程，然后收集线程执行返回的结果。

当下有两个占主导地位的线程库：windows下的线程实现和POSIX的pthread。libuv的线程API与pthread的API在使用方法和语义上很接近。

libuv的线程模块是自成一体的。比如，其他的功能模块都需要依赖于event loop和回调的原则，但是线程并不是这样。它们是不受约束的，会在需要的时候阻塞，通过返回值产生信号错误，还有像接下来的这个例子所演示的这样，不需要在event loop中执行。

考虑到libuv的跨平台特性，libuv支持的线程API个数很有限。


**只有一个主线程，主线程上只有一个event loop。不会有其他与主线程交互的线程了**。（除非使用uv_async_send）。


### node.js框架

1. Javascript依赖包 - Standard Libary 是我们日常项目常用的HTTP Buffer等模块
2. 桥阶层 - Node Binding 是沟通C++和Javascript的桥梁,封装了底层C与C++模块包，暴露出JavaScript接口给上层调用
3. C/C++依赖包 - V8、libuv、C-ares（使用C语言实现的一个异步DNS查找的一个底层库，著名的Node.js curl gevent都使用了C-ares作为底层）http_parser、OpenSSL、zlib等模块实现了一些和网络请求封装有关的东西，比如说http解析、SSL和数据压缩
4. 操作系统

### v8

源代码 ---> AST ---> 字节码 ---> 解释器执行字节码

- ①字节码占用空间远小于机器码，有效减少内存占用 
- ②将字节码转换为不同架构的二进制代码的工作量也会大大降低 
- ③引入字节码，使得V8 移植到不同的 CPU 架构平台更加容易

字节码
- ① 解释器可以直接解释执行字节码。
- ② 字节码是一种中间码，占用内存相较机器码小，不受cpu型号影响。
机器码
- ① 机器码可以被cpu直接解读，运行速度快。
- ② 但是不同cpu有不同体系架构，也对应不同机器码。占用内存也较大。

控制与执行

v8无论是在浏览器端还是Node.js环境下都会启用一个主线程(浏览器中称为为UI线程)，并且维护一个消息队列用于存放即将被执行的宏任务，若队列为空，则主线程也会被挂起。

宏任务

每个宏任务执行的时候，V8都会重新创建栈，所有的函数都会被压入栈中然后逐个执行，直到整个栈都被清空。

微任务

微任务的出现，是为了在多个在粒度较大的宏任务之间穿插更多的操作。微任务可以看做是一个需要异步执行的函数，执行的时机在当前的宏任务的主代码快执行完之后，在整个宏任务执行结束之前

俗地理解，V8 会为每个宏任务维护一个微任务队列，生成一个微任务，该微任务会被 V8 自动添加进微任务队列，等整段代码快要执行结束时，该环境对象也随之被销毁，但是在销毁之前，V8 会先处理微任务队列中的微任务。


### libuv 高性能的，事件驱动的I/O库

![libuv线程池1](/study/imgs/libuv%E7%BA%BF%E7%A8%8B%E6%B1%A0.webp)
![libuv线程池2](/study/imgs/libuv%E7%BA%BF%E7%A8%8B%E6%B1%A02.webp)

在 《图解 Google V8》中有一段描述十分经典，这里直接引用一下
> Node 是 V8 的宿主，它会给 V8 提供事件循环和消息队列。在 Node 中，事件循环是由 libuv 提供的，libuv 工作在主线程中，它会从消息队列中取出事件，并在主线程上执行事件。
>同样，对于一些主线程上不适合处理的事件，比如消耗时间过久的网络资源下载、文件读写、设备访问等，Node 会提供很多线程来处理这些事件，我们把这些线程称为线程池。

![libuv组成](/study/imgs/libuv%E7%BB%84%E6%88%90.png)

拿文件读写操作来说，如上图libuv就会启用Thread Pool中的文件读写线程进行文件读写。读写完毕后，该线程会将读写的结果包装成函数的形式，塞入消息队列中等待主线程执行。

### 线程池


- 耗时工作在工作线程完成，而工作的callback在主线程执行。
- 每一个node进程中，libuv都维护了一个线程池。
- 因为同处于一个进程，所以线程池中的所有线程都共享进程中的上线文。
- 线程池默认只有4个工作线程，用UV_THREADPOOL_SIZE常量控制。(翻译自文章)
- 并不是所有的操作都会使用线程池进行处理，只有文件读取、dns查询与用户制定使用额外线程的会使用线程池。


### Node.js 中的事件循环

![node_event_loop](/study/imgs/node_event_loop.png)

**一定要读懂这个图，非常详细的描述了libuv的eventLoop做了哪些事情的。而且非常详细的解惑在什么阶段线程如何进行轮训通讯的**

- 首先判断当前loop的状态，只有处于激活状态才会开始执行周期，若处于非激活状态，则什么都不需要做。
- 事件循环的职责，就是不断得等待事件的发生，然后将这个事件的所有处理器，以它们订阅这个事件的时间顺序，依次执行。当这个事件的所有- 处理器都被执行完毕之后，事件循环就会开始继续等待下一个事件的触发，不断往复。
- 即如果某个事件绑定了两个处理器，那么第二个处理器会在第一个处理器执行完毕后，才开始执行。

> 重点看timers、poll、check这3个阶段就好，因为日常开发中的绝大部分异步任务都是在这3个阶段处理的。

```js
int uv_run(uv_loop_t* loop, uv_run_mode mode) {
  int timeout;
  int r;
  int ran_pending;

  /*
  从uv__loop_alive中我们知道event loop继续的条件是以下三者之一：
  1，有活跃的handles（libuv定义handle就是一些long-lived objects，例如tcp server这样）
  2，有活跃的request
  3，loop中的closing_handles
  */
  r = uv__loop_alive(loop);

  //  假若上述三个条件都不满足，则更新 loop 里的update_times
  if (!r)
    uv__update_time(loop);  // 更新 loop 实体的 time属性为当前时间

  while (r != 0 && loop->stop_flag == 0) {
    uv__update_time(loop); // 更新时间变量，这个变量在uv__run_timers中会用到
    uv__run_timers(loop); // 执行timers阶段
    ran_pending = uv__run_pending(loop);//从libuv的文档中可知，这个其实就是I/O callback阶段,ran_pending指示队列是否为空
    uv__run_idle(loop);//idle阶段
    uv__run_prepare(loop);//prepare阶段

    timeout = 0;

    /**
    设置poll阶段的超时时间，以下几种情况下超时会被设为0，这意味着此时poll阶段不会被阻塞，在下面的poll阶段我们还会详细讨论这个
    1，stop_flag不为0
    2，没有活跃的handles和request
    3，idle、I/O callback、close阶段的handle队列不为空
    否则，设为timer阶段的callback队列中，距离当前时间最近的那个
    **/    
    if ((mode == UV_RUN_ONCE && !ran_pending) || mode == UV_RUN_DEFAULT){
      timeout = uv_backend_timeout(loop); // 这个函数调用计算除了，I/O将会阻塞多少时间

      uv__io_poll(loop, timeout);//poll阶段
      uv__run_check(loop);//check阶段
      uv__run_closing_handles(loop);//close阶段
      //如果mode == UV_RUN_ONCE（意味着流程继续向前）时，在所有阶段结束后还会检查一次timers，这个的逻辑的原因不太明确
    
      if (mode == UV_RUN_ONCE) {
        uv__update_time(loop);
        uv__run_timers(loop);
      }

      r = uv__loop_alive(loop);
      if (mode == UV_RUN_ONCE || mode == UV_RUN_NOWAIT)
       break;
    }

    if (loop->stop_flag != 0) {
        loop->stop_flag = 0;
    }

    return r;
}
```

## 参考资料

[阮一峰-2013-EventLoop概念](https://www.ruanyifeng.com/blog/2013/10/event_loop.html)
[阮一峰-2014JavaScript 运行机制详解：再谈Event Loop](https://www.ruanyifeng.com/blog/2014/10/event-loop.html)

[libuv运行机制入门视频](https://www.youtube.com/watch?v=nGn60vDSxQ4)
[libuv运行概述](http://docs.libuv.org/en/v1.x/design.html#the-i-o-loop)
[libuv简介总结](https://luohaha.github.io/Chinese-uvbook/source/threads.html)
[libuv 流程简介](https://github.com/HXWfromDJTU/blog/issues/25) --- 1
[一直在研究node的大佬](https://zhuanlan.zhihu.com/p/138085385)
[子线程](https://zhuanlan.zhihu.com/p/462880544) ---2