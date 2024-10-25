# dvh 动态视口单位

在移动端真机的浏览器上，`100vh` 不总是等于一屏幕的高度。有些浏览器会将地址栏等控件也计算在屏幕高度内，因此可能出现高度差异。可以使用新的视口单位 `dvh` 来解决该问题。`100dvh` 相当于一屏幕高度，但不包含地址栏等控件高度，更符合直觉。

在 Safari 下，通过 `window.innerHeight` 获得的值（例如 `659px`）是整个屏幕的高度，包括地址栏等控件的高度。因此，若想正确获取一屏幕的高度，应该使用 `dvh` 单位：

`dvh` 是一个较新的单位，如果需要兼容旧版本，可能需要使用 polyfill，例`large-small-dynamic-viewport-units-polyfill` 插件。

```css
#app {
  min-height: 100vh;
  min-height: calc(var(--dvh, 1vh) * 100);
  min-height: 100dvh;
  width: 100vw;
}
```

## 参考

1. [CSS 新Viewport视口单位svh、lvh和 dvh](https://blog.csdn.net/qq_41221596/article/details/132632258)
3. [large-small-dynamic-viewport-units-polyfill](https://github.com/joppuyo/large-small-dynamic-viewport-units-polyfill)