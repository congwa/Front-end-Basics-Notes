# 滑动scrollIntoView和Window.scrollTo

## scrollIntoView

```js
element.scrollIntoView() 
// alignToTop true: 元素的顶部将对齐到可滚动祖先的可见区域的顶部
// 对应 对应于scrollIntoViewOptions: {block: "start", inline: "nearest"}。这是默认值

// 元素的底部将与可滚动祖先的可见区域的底部对齐。对应于scrollIntoViewOptions: {block: "end", inline: "nearest"}。
element.scrollIntoView(alignToTop) // alignToTop: true false 

// scrollIntoViewOptions
/**
 * behavior: 定义过渡动画。"auto","instant"或"smooth"。默认为"auto"。
 * block: "start"，"center"，"end"或"nearest"。默认为"center"。
 * inline:  "start"，"center"，"end"或"nearest"。默认为"nearest"。
 */
element.scrollIntoView(scrollIntoViewOptions)
```

## Window.scrollTo

scrollTo() 方法可把内容滚动到指定的坐标

```js
window.scrollTo(x, y)
```