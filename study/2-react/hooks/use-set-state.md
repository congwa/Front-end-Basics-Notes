# object的state

```ts
const useSetState = <T extends object>(
  initialState: T = {} as T
): [
  T,
  (patch: Partial<T> | ((prevState: T) => Partial<T>)) => void,
  React.MutableRefObject<T>
] => {
  const unmountedRef = useUnmountedRef()
  const [state, setState, ref] = useRefState<T>(initialState)

  const setMergeState = useCallback(patch => {
    // 确保组件没有卸载
    if (unmountedRef.current) return
    // 每次设置新的值都确保覆盖上一次的值
    setState(prevState => ({
      ...prevState,
      ...(isFunction(patch) ? patch(prevState) : patch),
    }))
  }, [])

  return [state, setMergeState, ref]
}

```
