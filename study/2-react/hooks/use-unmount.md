# 组件卸载的时候确保回调执行，且是最新的

```ts
function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}
const useUnmount = (fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.warn(
        'useUnmount',
        `expected parameter is a function, got ${typeof fn}`
      )
    }
  }
  // 确保组件卸载的时候，确保fn是最新的
  const fnRef = useLatest(fn)

  useEffect(
    () => () => {
      fnRef.current()
    },
    []
  )
}

```