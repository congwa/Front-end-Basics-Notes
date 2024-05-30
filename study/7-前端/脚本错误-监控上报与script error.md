# 脚本错误


## 监控

脚本错误主要有两类：语法错误、运行时错误。
监控的方式主要有两种：try-catch、window.onerror。


### try-catch

```js
try {
    test  // <- throw error
} catch(e){
    console.log('运行时错误信息 ↙');
    console.log(e);
}
```

通过给代码块进行 try-catch 包装，当代码块出错时 catch 将能捕获到错误信息，页面也将继续执行。

```js
try {
    setTimeout(function() {
        test // <- throw error 异步错误 无法捕捉错误
    },0)
} catch(e){
    console.log('异步错误信息 ↙');
    console.log(e);
}
// 异步报错则可以通过为异步函数块再包装一层 try-catch，增加标识信息来配合定位，可以用工具来进行处理
```




弊端： 当发生语法错误或异步错误时，则无法正常捕捉。


### window.onerror

window.onerror 能捕捉到当前页面的语法错误或运行时报错

```js
/**
 * @param {String}  msg    错误信息
 * @param {String}  url    出错文件
 * @param {Number}  row    行号
 * @param {Number}  col    列号
 * @param {Object}  error  错误详细信息
 */
window.onerror = function (msg, url, row, col, error) {
    console.log('onerror 错误信息 ↙');
    console.log({
        msg,  url,  row, col, error
    })
};

test // <-  throw error
```

> 当一项资源（如img或script）加载失败，加载资源的元素会触发一个Event接口的error事件，并执行该元素上的onerror()处理函数。这些error事件不会向上冒泡到window，不过能被window.addEventListener在捕获阶段捕获


onerror 主要用来捕获预料之外的错误，而 try-catch 则可以用在预知情况下监控特定错误，两种形式结合使用更加高效。


### promise错误

使用 addEventListener() 监听 unhandledrejection 事件，可以捕获到未处理的 promise 错误。‘

```js
// 监听 promise 错误 缺点是获取不到列数据
window.addEventListener('unhandledrejection', e => {
    lazyReportCache({
        reason: e.reason?.stack,
        subType: 'promise',
        type: 'error',
        startTime: e.timeStamp,
        pageURL: getPageURL(),
    })
})

```




## 上报

监控错误拿到了报错信息，接下来则是将捕抓的错误信息发送到信息收集平台上，发送的形式主要有两种：

- 通过Ajax发送数据
  - 同步的方式，确保万无一失，但是会阻塞
  - 异步的方式，浏览器可能会过早关闭或跳转导致取消发送
- 动态创建 img 标签的形式
  - 占用浏览器主线程，大多数浏览器会延迟卸载以加载图像
- `sendBeacon`API 64KB限制 IE兼容性问题 post请求
  - body大小64KB限制 IE兼容性问题 post请求
  - 浏览器将 Beacon 请求排队让它在空闲的时候执行
  - 浏览器进行了优化：可以将 Beacon 请求合并到其他请求上，一同处理, 尤其在移动环境下。
  - 异步发送 不阻塞进程

```js
function report(msg, level) {
    var reportUrl = "http://localhost:8055/report";
    new Image().src = reportUrl + '?msg=' + msg; // 使用image不会发生跨域
}
```


