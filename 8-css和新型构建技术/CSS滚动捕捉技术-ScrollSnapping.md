# Scroll Snapping

CSS 滚动捕捉允许用户完成滚动之后将`视口锁定`到某个元素的位置。

```css
/* container */
scroll-snap-type: “mandatory” vs. “proximity”
/* 例子 */
scroll-snap-type: y mandatory;

/* child */
scroll-snap-align: start;

```

- mandatory 值表示，在用户停止滚动时，浏览器必须 滚动到一个捕捉点；
- proximity 属性就没有严格——除非当前滚动的位置合适，否则 不会强制浏览器 滚动到捕捉点。以我的经验，当滚动停止在距离某个捕捉点几百像素内时，捕捉才会发生。

> 我在工作中发现，mandatory 能提供更一致的用户体验。


## scroll-padding  吸附偏移


默认情况下，内容元素会吸附到容器的最边缘。我们可以通过设置容器的 scroll-padding 属性来做修改。它的语法与 padding 属性一样。

如果布局中出现有可能妨碍内容元素展示的物件（比如，固定标题），使用它就比较有用。


## 子元素属性

scroll-snap-align ： start、center 和 end。


通过这个属性，可以指定元素的哪一部分吸附到容器上。


## scroll-snap-stop：“normal” vs. “always”

默认情况下，滚动捕捉只会在用户停止滚动时发生，这表示如果滚动过猛，中间可能会跳过几个捕捉点，然后才会停止。

可以通过给子元素设置 scroll-snap-stop: always 来改变这一行为。这会将强制滚动容器在用户继续滚动之前停留在在就近的一个元素上。

> 还没有浏览器原生支持 scroll-snap-stop 属性，尽管 Chrome 有一个 tracking bug 在。


## tailwindcss

在tailwindcss同时有此属性的原子化实现 

[https://www.tailwindcss.cn/docs/scroll-snap-type](https://www.tailwindcss.cn/docs/scroll-snap-type)