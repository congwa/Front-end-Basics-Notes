# 既然函数可以防抖，那么副作用effect也可以防抖

```ts
import type { DependencyList, EffectCallback } from 'react'
function useDebounceEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: DebounceOptions
) {
  const [flag, setFlag] = useState({})
  // 利用防抖进行过滤调用来改变flag的值
  const { run } = useDebounceFn(() => {
    setFlag({})
  }, options)

  useEffect(() => {
    return run()
  }, deps)

  // 初始化前不进行调用（首次渲染不进行调用），之后每次flag变化就进行调用
  useUpdateEffect(effect, [flag])
}

```
