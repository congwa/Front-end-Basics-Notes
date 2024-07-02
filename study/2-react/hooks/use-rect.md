# use rect

```ts
function isWindow(val: unknown): val is Window {
  return val === window
}
interface Rect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

const useRect = (elementRef: Element | Window): Rect => {
  const element = elementRef
 
  // 注意区分下windows 很细
  if (isWindow(element)) {
    const width = element.innerWidth
    const height = element.innerHeight

    return {
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
    }
  }

  if (element && element.getBoundingClientRect) {
    return element.getBoundingClientRect()
  }

  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
  }
}

export { useRect as getRect }

export default useRect
```

这个hook在组件中每次渲染的时候都重新获取一遍就好啦。
