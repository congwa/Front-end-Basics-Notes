# 判断当前应用是否在iframe中打开

```js
// 如果自己嵌自己会发生什么情况呢？
// 是否可以使用 if(window.parent !== widnow) {} 代替
if(window.top !== window) {}
```


## 解释说明

每一个 iframe 都有自己的浏览上下文，不同的浏览上下文包含了各自的 Document 对象以及 History 对象，通常情况下 Document 对象和 Window 对象存在 1:1 的映射关系

![iframe](/study/imgs/iframe.avis)

在上述示例中，如果主应用是在空白的标签页打开，那么主应用是一个顶级浏览上下文，顶级浏览器上下文既不是嵌套的浏览上下文，自身也没有父浏览上下文，通过访问 window.top 可以获取当前浏览上下文的顶级浏览上下文 window 对象，通过访问 window.parent 可以获取父浏览上下文的 window 对象。

