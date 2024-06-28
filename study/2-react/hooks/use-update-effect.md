# 首次渲染不会执行的Effect

effect总是在首次渲染执行一次，封装一个hook让它在首次渲染不去执行

```ts
const useUpdateEffect: typeof useEffect = (effect, deps) => {
  // Why use useRef instead of useState ?
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
    } else {
      return effect()
    }
    return undefined
  }, deps)
}

```

1. Why use useRef instead of useState
   - useRef 不会触发渲染，但是使用useState会触发渲染
