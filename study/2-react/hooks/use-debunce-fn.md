# 防抖

```ts

function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value

  return ref
}

interface DebounceOptions {
  wait?: number
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

type noop = (...args: any) => any

function useDebounceFn<T extends noop>(fn: T, options?: DebounceOptions) {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      devWarning(
        'useDebounceFn',
        `expected parameter is a function, got ${typeof fn}`
      )
    }
  }

  // 希望总是调用最新的fn回调函数。 注意以下闭包陷阱问题。
  const fnRef = useLatest(fn)

  const wait = options?.wait ?? 1000
  
  // useMemo进行缓存下来，防止防抖每次都重新执行而导致的防抖失效
  const debounced = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...(args as any))
        },
        wait,
        options
      ),
    []
  )

  useUnmount(() => {
    debounced.cancel()
  })

  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush,
  }
}
```

1. useLatest 希望总是调用最新的fn回调函数。 注意以下闭包陷阱问题。
2. useMemo useMemo进行缓存下来，防止防抖每次都重新执行而导致的防抖失效