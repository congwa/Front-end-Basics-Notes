# prefers-color-scheme

[mdn](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

使用

```js
if ( window.matchMedia("(prefers-color-scheme: dark)").matches) {
  // todo
}
```

prefers-color-scheme 是一个媒体查询，用于检测用户对颜色方案（light mode 或 dark mode）的首选偏好。这个媒体查询通常用于响应式设计，以便根据用户的首选模式为网页应用不同的样式。


在 CSS 中，你可以使用 prefers-color-scheme 媒体查询来定义针对暗色模式和浅色模式的样式规则。以下是一个简单的例子：

```css
body {
  background-color: white; /* 默认背景颜色，适用于浅色模式 */
  color: black; /* 默认文本颜色，适用于浅色模式 */
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: black; /* 暗色模式下的背景颜色 */
    color: white; /* 暗色模式下的文本颜色 */
  }
}

```