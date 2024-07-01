# 一直能访问最新的引用

```ts
function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value

  return ref
}

```
