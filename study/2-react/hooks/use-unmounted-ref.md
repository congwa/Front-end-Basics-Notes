# 当前组件是否已经卸载

```ts
const useUnmountedRef = () => {
  const unmountedRef = useRef(false)
  useEffect(() => {
    unmountedRef.current = false

    return () => {
      unmountedRef.current = true
    }
  }, [])
  return unmountedRef
}
```
