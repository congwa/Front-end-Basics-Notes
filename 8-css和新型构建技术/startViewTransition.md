# startViewTransition

```ts
// element-plus 炫酷换肤动画源码 https://github1s.com/element-plus/element-plus/blob/dev/docs/.vitepress/vitepress/components/common/vp-theme-toggler.vue#L17-L59
const switchTheme = (event: MouseEvent) => {
  const isAppearanceTransition =
    // @ts-expect-error
    document.startViewTransition &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!isAppearanceTransition || !event) {
    resolveFn(true)
    return
  }
  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  )
  // @ts-expect-error: Transition API
  const transition = document.startViewTransition(async () => {
    resolveFn(true)
    await nextTick()
  })
  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ]
    document.documentElement.animate(
      {
        clipPath: isDark.value ? [...clipPath].reverse() : clipPath,
      },
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: isDark.value
          ? '::view-transition-old(root)'
          : '::view-transition-new(root)',
      }
    )
  })
}
```


## 示例参考

- [View Transition API —— 给 Web 动效锦上添花](https://juejin.cn/post/7255675484938256441#heading-4)
- [iew-transition-demos](https://github.com/JaxQian/view-transition-demos)