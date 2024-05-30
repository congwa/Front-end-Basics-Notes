# ios 的 title无法动态更改的问题

通常动态更改title的常用代码如下：

```js
document.title = "标题";

```

这句代码在IOS上，QQ内置的浏览器里并没有效果。原因是IOS加载一次title，就不在监听title的变化。

## 解决

采用 iframe 来更改title

```js
export function changeTitle(title) {
  document.title = title;
  let iframe = document.createElement("iframe");
  iframe.style.display="none";
  iframe.setAttribute("src", "/favicon.ico");
  let d = function() {
    setTimeout(function() {
      iframe.removeEventListener('load', d);
      document.body.removeChild(iframe);
    }, 0);
  };
  iframe.addEventListener('load', d);
  document.body.appendChild(iframe);
}
```

封装一个changeTitle()方法，在需要更改title的地方调用。在修改title的时候，创建一个iframe请求，然后立即删除，不会对页面造成影响，能够很好的解决该问题。

me是内联框架元素，可以将另一个html元素嵌入到当前页面，当异步获取到数据后，动态创建的iframe根据指定src发送请求，从而触发title的监听，加载完后移除不会对页面造成影响， 这是一个hack，没什么实际意义

**在部分低版本系统上会出现此问题，可以试着这样解决**,无需对所有机型都这样
## 参考

[在 iOS 下微信的浏览器里，修改 title 不生效](https://github.com/miaolz123/vue-helmet/issues/3)

