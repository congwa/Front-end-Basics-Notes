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

    - GUI 渲染线程
    - JavaScript 引擎线程
    - 定时触发器线程
    - 事件触发线程  
    - 异步 http 请求线程

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