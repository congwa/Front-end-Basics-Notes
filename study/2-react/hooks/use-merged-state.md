# 合并状态钩子(受控和非受控动态切换)

不传入参数时为非受控模式，传入参数的时候为受控模式

```ts
const useMergedState = <T, R = T>(option?: {
  defaultValue?: T | (() => T)
  value?: T
}): [R, (value: T) => void] => {
  const { defaultValue, value } = option || {}

  const [innerValue, setInnerValue] = useState<T>(() => {
    if (value !== undefined) {
      return value
    }
    if (defaultValue !== undefined) {
      return typeof defaultValue === 'function'
        ? (defaultValue as any)()
        : defaultValue
    }
    return undefined
  })

  const mergedValue = value !== undefined ? value : innerValue

  function triggerChange(newValue: T) {
    setInnerValue(newValue)
  }

  return [mergedValue as unknown as R, triggerChange]
}
```

核心思想是允许组件在受控和非受控模式之间灵活切换。组件的状态可以由外部传入的 value 控制，也可以使用内部状态管理。在受控模式下（即 value 有值的情况下），内部状态 innerValue 的变更不会影响实际显示的状态，因为显示状态由外部 value 控制