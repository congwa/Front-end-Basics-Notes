# 稳定的函数

需要一个**稳定**的函数，确保传入函数在整个生命周期内引用保持一致

```ts
function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}
type noop = (this: any, ...args: any[]) => any

type PickFunction<T extends noop> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>

function useMemoizedFn<T extends noop>(fn: T) {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.waring(
        'useMemoizedFn',
        `expected parameter is a function, got ${typeof fn}`
      )
    }
  }

  const fnRef = useRef<T>(fn)

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo(() => fn, [fn])

  const memoizedFn = useRef<PickFunction<T>>()
  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args)
    }
  }

  return memoizedFn.current as T
}
```

确保传入函数在整个生命周期内引用保持一致, 且总是能拿到当前最新一次的参数

注意: 需要与useCallback区分

useCallback相对它，useCallback总是会缓存执行的时候的那次函数组件调用的闭包(上下文)值，而useMemoizedFn可以拿到最新的值
