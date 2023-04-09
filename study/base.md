# base 

## 浏览器一帧都会干些什么?

1. 接受输入事件
2. 执行事件回调
3. 开始一帧
4. 执行RAF
5. 页面布局、样式计算
6. 绘制渲染
7. 执行RIC

## 浏览器内核

### 进程
- 浏览器进程：浏览器的主进程（负责协调、主控）
    + 负责浏览器界面显示，与用户交互。网址栏输入、前进、后退等
    + 管理各个页面，创建和销毁进程
    + 将页面内容（位图）写入到浏览器内存中，最后再将图像显示在屏幕上
    + 文件储存等功能
- 渲染进程：默认一个Tab页面一个渲染进程（特殊情况：渲染进程不一定每个Tab就一个）
    + 页面渲染
    + 脚本执行
    + 事件处理等
- GPU进程：用于3d绘制等，将开启了3d绘制的元素的渲染由CPU转向GPU，也就是开启GPU加速。
- 网络进程：主要负责页面的网络资源加载，之前是作为一个模块（NetWork Thread）运行在浏览器进程里面的，直至最近才独立出来，成为一个单独的进程。
- 插件进程：每种类型的插件对应一个进程，仅当使用该插件时才创建
- 音频进程：浏览器音频管理

### 渲染进程

每个tab页包含一个渲染进程，渲染进程包含以下线程

- ~~GUI 渲染线程 （主线程）~~
- ~~JavaScript 引擎线程~~
- [主线程](https://baijiahao.baidu.com/s?id=1754924634013815803&wfr=spider&for=pc)
- 合成线程
- I/O线程
- 定时触发器线程
- 事件触发线程  
- 异步 http 请求线程

主线程，包括GUI+JS。所有的 JS 执行，HTML 解析和 DOM 构造，CSS 解析和计算得到 computed style，Layout，Paint（主要是决定 paint order，最终layer tree 和 paint order信息提交到 compositor 线程完成最终绘制） 等等。
其它线程，包括 worker 的，Blink 和 V8 创建的内部使用的线程（比如处理 webaudio、database）等等。
个人感觉最后一段引用里提到的「GUI 线程和 JS 线程互斥」的说法好像不太对。DOM tree/render tree 的构建和 JS 引擎应该是在同一个线程里执行的

### 外部进程通讯（react设计原理一书第二章有标明）

- 例子：外部进程(比如网络进程)通过ipc消息进行通讯到I/0线程，I/0线程发送给主线程的任务队列。

**TODO: 需要详细去学习浏览器线程通讯的方式**

## 继承

    ```javascript

        // 组合式
        function Parent() {}
        function Child() {
            Parent.call(this)
        }
        Child.prototype = new Parent()
        Child.prototype.constructor = Child
        // 构造执行了两次 可以传参
        // 组合寄生
        function Child() {
            Parent.call(this)
        }
        (function() {
            const Super = function () {}
            Super.prototype = Parent.prototype
            Child.prototype = new Super()
            Child.prototype.constructor = Child
        })()
    ```

## 缓存判断

>Cache-Control ：如果是no-cache需要验证 last-Modified if-Modified-Since  / Etag  If-None-Match 来验证缓存规则

- 强缓存：未失效 cache-control优先级高于Expires 
- 强缓存：已失效 执行协商缓存，Etag的优先级高于last-Modified；
- 缓存未失效从缓存中读取304状态码
- 缓存已失效返回数据和200状态码

## XSS攻击

1. 常见使用csp进行防御攻击
2. 对输入字符串进行特殊字符转义

## CSRF攻击

1. cookie设置same-site:strict

### vw布局


### 缩放