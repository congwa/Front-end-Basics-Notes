# domparser api

在看谭光志大佬的github，看到一个mini-single-spa的微前端项目，其中用到了`domparser` api, 感觉很有用。


使用一个 API DOMParser，它可以直接解析一个 HTML 字符串，并且不需要挂到 document 对象上。

```js
const domparser = new DOMParser()
const doc = domparser.parseFromString(html, 'text/html')

// 返回一个json的dom树
```



## 参考资料

[手把手教你写一个简易的微前端框架 - 谈光志](https://github.com/woai3c/Front-end-articles/issues/31)