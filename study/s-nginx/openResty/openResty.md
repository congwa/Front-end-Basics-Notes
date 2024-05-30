# OpenResty

openResty（后面简称：OR）是一个基于Nginx和Lua的高性能Web平台，它内部集成大量的Lua API以及第三方模块，可以利用它快速搭建支持高并发、极具动态性和扩展性的Web应用、Web服务或动态网关。


OR最大的特点就是，将Lua协程与Nginx事件驱动模型及非阻塞I/O结合起来。使用户可以在handler中使用 同步但是依然是非阻塞 的方式编写其应用代码，而无需关心底层的协程调度以及与Nginx事件驱动模型的交互。

本文介绍OR的协程调度机制，然后结合源码以及Lua栈的情况来详细了解各个部分是如何实现的，包括其异常保护、协程初始化、协程的恢复和执行、协程的挂起、协程的执行结束、协程出错的情况。

文主要关注调度函数内部的逻辑，如果想了解外部的调用流程。[可以参看Openresty Lua钩子调用完整流程](https://catbro666.github.io/posts/30b81f82/)

注：lua-nginx模块与stream-lua-nginx模块的主体部分类似，后者实现相对简单一点。下面的讨论将基于stream-lua模块。

为了防止歧义，文中用到的一些术语明确一下：

- 主线程：表示外层调用run_thread()的OS线程
- 入口线程：每个handler被调用时会创建一个入口线程，用于执行lua代码
- 用户线程：用户在Lua代码中通过ngx.thread.spawn()创建的线程
- 用户协程：用户在Lua代码中通过coroutine.create()创建的协程
- 协程：泛指所有协程，包括入口线程、用户线程和用户协程
- vm：表示Lua虚拟机
- L：视出现的上下文，一般表示父协程，在创建入口线程的时候表示Lua VM
- co：一般表示新创建的协程
- L栈： |协程表|新协程|顶|：表示Lua栈结构，最右边是栈顶

关键数据结构

- 携程上下文: `ngx_stream_lua_co_ctx_t`
  - 协程内部栈（coctx->co）
  - 协程状态（coctx->co_status）
  - 维护协程之间关系的数据（父协程coctx->parent_co_ctx、僵尸子线程coctx->zombie_child_threads）
  - 用户相关数据（coctx->data）
  - 在Lua的registry表中对应该线程指针的引用值（co_ref）
  - 一些状态标记（是否是用户线程is_uthread、是否因创建新线程thread_spawn_yielded被yield)
- 模块上下文: `ngx_stream_lua_ctx_t`
  - ctx->cur_co_ctx（当前调度协程上下文）
  - ctx->co_op（协程是以何种方式YIELD）
- 核心调度函数：`ngx_stream_lua_run_thread()`

## 协程调度

首先你可能很好奇OR为什么要在C引擎层面自己实现协程的调度？或者说这么做的好处是什么？我觉得最主要的原因还是减轻开发者的负担。

### 原生Lua coroutine接口

我们知道Lua是个非常轻巧的语言，它不像Go有自己的调度器。Lua原生的对协程的操作无非就是`coroutine.resume()`和`coroutine.yield()`。这两者是成对出现的，协程`coroutine.yield()`之后肯定回到父协程`coroutine.resume()`的地方，恢复子协程需要显式再次`coroutine.resume()`。

如果要在Lua代码层面实现非阻塞I/O，那么父协程必须处理子协程I/O等待的情况，并在事件发生时恢复子协程的执行。如果需要同时进行多个任务，那么父协程就需要负责多个协程间的调度。因为协程的拓扑可能是一个复杂的树状结构，所以协程的调度管理将变得异常复杂。

### OpenResty实现

OR在C引擎层帮我们把这些事情都做了，你无须再关心所有这些，只需专心写你的业务逻辑。

为了支持同步非阻塞的方式编写应用代码，OR重写了`coroutine`的接口函数，从而接管了协程的调度，并在`coroutine`基础上封装抽象出了`thread`的概念。无论是`coroutine`还是`thread`，I/O等待对于用户都是透明的，用户无需关心。

两者的主要区别是，`coroutine`父子之间的协作度更高，`coroutine.yield`()和`coroutine.resume()`成对出现。在子协程执行完成（出错）或者显式`coroutine.yield()`之前，父协程一直处于等待状态。而`thread`则由调度器进行调度，子`thread`一旦开始执行就不再受父协程控制了，在需要并发请求时很有用。thread提供了`spawn()`、`wait()`等接口，`spawn()`执行参数中指定的函数，直到执行完毕、出错或者I/O等待时返回。`wait()`则使父协程可以同步等待子线程执行完毕、获取结果。

OR在对协程调度上，最核心的改动是其创建新协程时的行为`（coroutine.resume(), ngx.thread.spawn()）`。它不会直接调用`lua_resume()`，而是先`lua_yield()`回到主线程，然后由主线程再根据情况`lua_resume()`下一个协程。Lua代码域内从来不会直接调用`lua_resume()`，理解了这一点你就理解了OpenResty协程调度的精髓。

所以OR中协程拓扑是一个单层的结构，它只有一个入口点。这样使得协程调度更加灵活，I/O事件的触发时回调函数也更容易实现。

OR调度器根据`lua_resume()`的返回值，确定协程是挂起了、结束了还是出错了。因为OR改动了创建新协程时行为，同时又抽象了`thread`概念，所以如果是协程挂起的情况，还需要知道是什么原因挂起，以便做相应的不同处理。是继续调度？还是返回上层？我们前面提到的`ctx->co_op`便是做这个用途。

协程的调度在核心调度函数`ngx_stream_lua_run_thread()`中进行，它是创建或恢复协程的唯一入口点。最初是由配置的Lua钩子调用（图中`ssl_cert_handler()`），如果碰到了I/O等待的情况，后续则由对应的事件`handler（图中的sleep_handler()和read_handler()）`再次拉起。`run_thread()`里面实现了一个调度循环，循环里面先从`ctx->cur_co_ctx`获取下一个待`resume`的协程上下文，然后`lua_resume()`执行或恢复该协程，其返回值`LUA_YIELD`表示协程挂起，`0`表示协程执行结束，其余的表示协程出错了。其中协程挂起又分为四种不同的情况：

- 即等待I/O、
- 新建thread、
- coroutine.resume()
- coroutine.yield()。
  

根据不同的情况，决定是跳到循环前面继续恢复下一个协程，还是返回上层函数。


下图是协程调度主要逻辑的示意图，可以看到在Lua代码域中无论是**新建、挂起或恢复协程，都是先调用`lua_yield()`回到主线程**。**I/O操作例如ngx.tcp.receive()如果碰到了I/O等待，会在内部注册epoll事件（对于sleep的情况是定时器），然后自动lua_yield()，当事件触发时继续未完成的I/O操作，完成之后再调用run_thread()恢复之前被挂起的协程**。

![openResty](/study/imgs/openResty.svg)


## 使用
![nginx-lua](/study/imgs/nginx-lua.awebp)

OpenResty 将我们编写的 Lua 代码挂载到不同阶段进行处理，每个阶段分工明确，代码独立。

- init_by_lua*：Master 进程加载 Nginx 配置文件时运行，一般用来注册全局变量或者预加载 Lua 模块。
- init_worker_by_lua*：每个 worker 进程启动时执行，通常用于定时拉取配置/数据或者进行后端服务的健康检查。
- set_by_lua*：变量初始化。
- rewrite_by_lua*：可以实现复杂的转发、重定向逻辑。
- access_by_lua*：IP 准入、接口权限等情况集中处理。
- content_by_lua*：内容处理器，接收请求处理并输出响应。
- header_filter_by_lua*：响应头部或者 cookie 处理。
- body_filter_by_lua*：对响应数据进行过滤，如截断或者替换。
- log_by_lua*：会话完成后，本地异步完成日志记录。

## 参考地址

[猫猫哥-Openresty Lua协程调度机制](https://catbro666.github.io/posts/150430f0/)
[猫猫哥-OpenResty Lua钩子调用完整流程](https://catbro666.github.io/posts/30b81f82/)

[OpenResty文档](https://openresty-reference.readthedocs.io/en/latest/Lua_Nginx_API/)
[openresty中文官方地址](https://openresty.org/cn/)