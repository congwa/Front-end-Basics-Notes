# 为了解决异步储存问题



## 异步储存问题

node的异步存储的发展史
![node的异步存储的发展史](/study/imgs/node%E5%BC%82%E6%AD%A5%E5%AD%98%E5%82%A8%E5%8F%91%E5%B1%95%E5%8F%B2.webp)

当一个 Request 通过层层关卡打到我们的 Server，一般会产生多个系统的日志，包括但不限于：

- 访问日志
- 异常日志
- SQL日志
- 第三方服务日志等
- 
而当发生了线上问题的时候，需要进行溯源排查。

一般的做法是在请求之处，生成一个 unique traceId，此 id 在所有日志中携带就可以追踪该请求的所有链路，这就是所谓的**全链路日志追踪**

traceId如何在一个node请求中的上下游都带上这个traceId?

1. 定义个全局变量储存。
    - 这种方案是不可取的，因为在服务端环境请求是异步并发的，无法确定请求A和请求B的先后顺序，应该确定当前traceId是属于谁的。 如下源码
  
      ```js
              // Raw Node.js HTTP server
        const http = require('http');
        let globalTraceId // 全局变量

        // 0. 处理请求的方法
        function handleRequest(req, res) {
          // 生成唯一 traceId，每次请求进入，复写 globalTraceId 的值
          globalTraceId = generateTraceId()

          // 检查用户cookie是否有效
          cookieValidator().then((res) => {
            // 校验成功，返回给用户他需要的内容
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write('Congrats! Your damn cookie is the best one!');
            res.end();
          }).catch((err) => {
            // 把 traceId 连同 error 上报给异常监控系统
            reportError(err, globalTraceId)

            // 写状态码500和错误信息等
            // ...
          });
        }

        // 1. 创建 server 
        const server = http.createServer((req, res) => {
          handleRequest(req, res)
        });

        // 2. 让 server 和 port:3000 建立 socket 链接，持续接收端口信息
        server.listen(3000, () => {
          console.log('Server listening on port 3000');
        });

      ```

      在服务端上面，尽量减少大的闭包操作，提升内存的利用率，有利于增加并发。 这是为什么没有在handleRequest中利用闭包来缓存traceId

2. 在当前请求上下文中一路透传traceId
    - 所谓的直接透传参数，就是通过 local variable 被存到了 async function call context 里面而完成了traceId在一次请求里面一路传递(是不是感觉很麻烦)
### express和koa中处理traceId

把 traceId 通过 req 这个 object 一路传下去。能传下去的原因是 node 异步调用的时候，会创建一个新的 context（上下文），把当前调用栈、local variable、referenced global variable 存下来，一直到请求返回再在存下来的 context 中继续执行。

```js

const http = require('http');

function handleRequest(req, res) {
  const traceId = req.headers['x-trace-id'] || generateTraceId();
  // 把 traceId 写入 req 这个 object，将参数一路带下去
  req.traceId = traceId;

  // 同上
  cookieValidator().then((result) => {
    // 校验成功，返回给用户他需要的内容
  	// ...
  }).catch((err) => {
    //  上报 traceId
    reportError(err, req.traceId)

    // 写状态码500和错误信息等
    // ...
  });
}

function cookieValidator() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // do someting
      // ...
    }, 1000);
  });
}

// 此后省略监听等操作
// ...

```

```js
// Via express
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { reportError } = require('./error-logging');

const app = express();

// 中间件
app.use((req, res, next) => {
  const traceId = uuidv4(); // generate a new UUID for the trace ID
  req.traceId = traceId; // attach the trace ID to the request object

  next();
});

// 设置路由
app.get('/', async (req, res, next) => {
  const traceId = req.traceId;

  try {
    // call an asynchronous function and pass along the trace ID
    const result = await someAsyncFunction(traceId);

    // do something with the result
    res.send(result);
  } catch (error) {
    // log the error and trace ID to the error logging system
    reportError(error, { traceId });
    next(error);
  }
});

// 监听端口
// ...

```

```js
const Koa = require('koa');
const { v4: uuidv4 } = require('uuid');
const { reportError } = require('./error-logging');

const app = new Koa();

// 中间件A
app.use(async (ctx, next) => {
  const traceId = uuidv4(); // generate a new UUID for the trace ID
  ctx.state.traceId = traceId; // store the trace ID in the Koa context object

  try {
    await next();
  } catch (error) {
    // log the error and trace ID to the error logging system
    reportError(error, { traceId });
    throw error;
  }
});

// 中间件B，通过 ctx 透传 traceId
app.use(async (ctx) => {
  const traceId = ctx.state.traceId;

  // call an asynchronous function and pass along the trace ID
  const result = await someAsyncFunction(traceId);

  // do something with the result
  ctx.body = result;
});

// 监听端口
// ...


```

通过把 tracId 存到一路透传的 ctx 变量里面实现参数的透传

### nestjs中是使用nestjs-cls这个库来实现

nestjs-cls是用于提升开发者体验的基于原生AsyncLocalStorage的包

```js
// 使用 nestjs-cls这个库
// npm i nestjs-cls


// 模块初始化的时候，申明 Cls Module
@Module({
  imports: [
    // Register the ClsModule,
    ClsModule.forRoot({
      middleware: {
        // automatically mount the
        // ClsMiddleware for all routes
        mount: true,
        // and use the setup method to
        // provide default store values.
        setup: (cls, req) => {
          // 通过CLS存储 traceId
          cls.set('traceId', req.headers['x-trace-id'] || generateTraceId()); 
        },
      },
    }),
  ],
  providers: [CatService],
  controllers: [CatController],
})
export class AppModule {}


// 在 Service 中注册 Cls，并且直接调用
@Injectable()
export class CatService {
  constructor(
    // We can inject the provided ClsService instance,
    private readonly cls: ClsService,
    private readonly catRepository: CatRepository,
  ) {}

  getCatForUser() {
    // and use the "get" method to retrieve any stored value.
    const userId = this.cls.get('traceId'); // 获得 traceId
    return this.catRepository.getForUser(userId);
  }
}

```




## AsyncLocalStorage

Node v13.10.0 完整支持了，随后 API 迁移到了长期支持版本 Node v12.17.0


[官方文档：https://nodejs.org/api/async_context.html#class-asynclocalstorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)


AsyncLocalStorage是基于node:async_hooks实现的，并且是性能好、内存安全的方法去存储用于log的信息

### AsyncLocalStorage发展历史方案

这个async的发展是由: 2013年cls -> 2017 -> async_hooks -> cls-hooked  -> 2019年AsyncLocalStorage

#### cls

[github cls](https://github.com/othiym23/node-continuation-local-storage)

CLS 通过 process.addAsyncListener 这个 API 监听异步事件

在创建异步事件的时候将当前上下文传入，执行异步回调时，传入上下文，异步事件执行结束销毁上下文

注意：而process.addAsyncListener是 Node v0.11 版本的 API，目前仓库引用的是 polyfill 的方法

通过 async call 的事件，可以写出一个方法来存储我们在每个异步调用中的需要存储的变量。

所以，这里还是用的一个局部变量来存储当前异步调用的上下文；

同时在全局变量里面，维护了一个类似于栈的结构，通过此数据结构完成了nest的功能，即嵌套调用，run里面在嵌入一个run。

后来介绍的cls-hooked逻辑和他差不多，但是实现更容易理解，把他把每个异步调用的上下文存到了一个全局变量new map()，然后通过全局唯一的为异步调用生成的asyncId 作为 key 来区分。不过为了嵌套能力，栈的结构依旧保留。

这样的**好处也很明显，不用闭包所有上下文，只存储了所有的traceId，提高了内存的利用率**

#### async_hooks

[async_hooks地址](https://github.com/nodejs/node/blob/main/doc/api/async_hooks.md)

> async_hooks不是一个三方库，而是一个Node build-in的module，供用户调用。

通过 hook 可以往 async call 的各个阶段注册方法，类似于我们熟悉的React生命周期。同时，每次异步初始化，都会生成一个独一无二的asyncId，所以基于此可以实现我们的异步监听

```js
const asyncHooks = require('async-hooks')
const asyncHook = asyncHooks.createHook({
  init: (asyncId, type, triggerAsyncId, resource) => {},
  before: asyncId => {},
  after: asyncId => {},
  destroy: asyncId => {},
  promiseResolve: asyncId => {},
})
asyncHook.enable();



// init() is called during object construction. The resource may not have
// completed construction when this callback runs. Therefore, all fields of the
// resource referenced by "asyncId" may not have been populated.
function init(asyncId, type, triggerAsyncId, resource) { }

// before() is called just before the resource's callback is called. It can be
// called 0-N times for handles (such as TCPWrap), and will be called exactly 1
// time for requests (such as FSReqCallback).
function before(asyncId) { }

// after() is called just after the resource's callback has finished.
function after(asyncId) { }

// destroy() is called when the resource is destroyed.
function destroy(asyncId) { }

```


#### 2017年：cls-hooked


在2017年，async_hooks发布后，Jeff Lewis 这位老兄马不停蹄地将老仓库fork出来，重新用最新的 async_hooks 重写了 CLS。重写后 API 没有任何变化

Node版本小于8的，使用了 AsyncWrap

Node版本大于8.2.1的则用async_hooks重写了

> 注意：他用 Experimental来描述此API，自然而然我们到 Nodejs 的官网可以看到，不再被推荐使用。原因是可用性、安全性、以及性能表现都有问题


#### 扩展一下线程中管理上下文的常见方法

- 使用线程局部存储（Thread Local Storage, TLS）：可以让每个线程都有自己私有的一份数据副本，这样就可以避免线程之间的数据冲突
- 使用函数参数传递上下文：通过将数据作为函数参数传递，可以确保它只在当前线程的上下文中使用，避免了线程之间的数据共享问题
- 使用全局变量配合加锁机制：通过使用全局变量和锁机制来确保线程之间的数据正确性
- 使用协程：协程是一种比线程更轻量级的并发执行单位，可以在单线程中实现多任务并发执行，避免了线程切换带来的额外开销，也可以避免线程之间产生数据竞争和死锁等问题

```py
# 使用 threading 模块实现了线程局部存储
import threading

my_thread_local = threading.local()

def my_thread_function():
    my_thread_local.value = threading.get_ident()
    print(f"My thread-local value is {my_thread_local.value}")

t1 = threading.Thread(target=my_thread_function)
t2 = threading.Thread(target=my_thread_function)
t1.start()
t2.start()
t1.join()
t2.join()
# 两个线程都能够在自己的 TLS 存储区中维护自己的数据，因此它们不会彼此干扰
# 输出的数字是线程 ID，我们可以看到，t1 和 t2 两个线程的 ID 是不同的
```

- 创建了两个线程 t1 和 t2，并分别将 my_thread_function 函数作为它们的目标函数
- 启动线程时，每个线程都会执行 my_thread_function 函数并存储其线程 ID，因为使用了线程局部存储，所以两个线程将独立维护自己的数据
- 最后，等待两个线程完成它们的任务，并对它们进行 join() 操作，以便主线程等待两个子线程完成后结束运行




### 性能问题


初期性能是不好的，AsyncLocalStorage 直接基于 async_hooks 进行封装。而 async_hooks 对于性能有一定的影响，在高并发的场景，大家对此 API 保持了谨慎的态度


[async_hooks测试结果](https://github.com/bmeurer/async-hooks-performance-impact)

![async_hook](/study/imgs/async_hook.png)

[关于性能的讨论](https://github.com/nodejs/node/issues/34493#issuecomment-845094849)

本来Node的性能就是他的短板（或者说这事因为他的特质所导致的），现在用上ALS后性能又变差了不少，自然会让人在生产环境对他敬而远之，所以怎么解决呢

### 后续更新-解决了性能问题

使用v8进行介入，使用v8的api，直接监听Promise lifecycle


这就是 v8::Context PromiseHook API。这个 Hook 被加入 V8 后，很快被 [Stephen Belanger](https://github.com/Qard) 加入到了 async_hooks, [这里是PR引入地址](https://github.com/nodejs/node/pull/36394)


在V8的加持下，在 Node v16.2.0 的版本里，ALS的性能"大幅"提升

