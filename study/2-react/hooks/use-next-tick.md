# dom渲染后执行

```ts
const useNextTick = (fn?: () => void) => {
  // 把nextTick的执行放到useEffect中执行，当fn变化的时候,就会推推迟下一次事件循环
  const nextTick = useCallback((handler?: () => void) => {
    if (handler) {
      Promise.resolve().then(() => handler())
    }
  }, [])

  useEffect(() => {
    if (fn) {
      nextTick(fn)
    }
    return () => {}
  }, [fn, nextTick])

  return fn ?? nextTick
}

```

确保某些逻辑推迟下一次事件循环执行，参考的vue的nextTick

使用此hook需要注意以下几点

1. 使用 Promise.resolve().then() 将函数推迟到下一次事件循环。这适合需要等待 DOM 更新完成后再执行某些操作的情况，例如测量 DOM 节点的尺寸
2. 如果 fn 函数在每次渲染时都创建一个新函数（例如直接在 JSX 中定义匿名函数），会导致 useEffect 反复执行。可以通过 useCallback 或 useMemo 缓存 fn，减少不必要的重新渲染

思考： 此hook多数情况下使用useEffect就满足结果了

思考2：在react18开启时间切片后，有可能会导致“意外”结果