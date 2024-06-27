# props的监听

如果props的值给value，那么就是受控组件
如果props的值是空的，那么就是非受控组件， 非受控组件之后需要配合`onChange`来通知状态变化给父组件

```ts
function usePropsValue<T>(options: Options<T>) {
  const { value, defaultValue, onChange } = options

  const update = useUpdate()
 
  // TODO 一定要使用useRef? 使用useState是否可以？
  const stateRef = useRef<T>(value !== undefined ? value : defaultValue)
  if (value !== undefined) {
    stateRef.current = value
  }

  const setState = useMemoizedFn(
    (v: SetStateAction<T>, forceTrigger?: boolean) => {
      // `forceTrigger` means trigger `onChange` even if `v` is the same as `stateRef.current`
      const nextValue =
        typeof v === 'function'
          ? (v as (prevState: T) => T)(stateRef.current)
          : v
      if (!forceTrigger && nextValue === stateRef.current) return
      stateRef.current = nextValue
      update()
      onChange?.(nextValue)
    }
  )
  return [stateRef.current, setState] as const
}
```
