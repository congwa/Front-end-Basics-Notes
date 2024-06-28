# 总是能够访问到最新的状态的值，且不影响组件的重新渲染流程

```ts
import { useCallback, useRef, useState } from 'react'
import type { Dispatch, SetStateAction, MutableRefObject } from 'react'
import { isFunction } from '../utils'

type StateType<T> = T | (() => T)

export default function useRefState<T>(
  initialState: StateType<T>
): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>] {
  const [state, setState] = useState<T>(initialState)  // 声明状态
  const ref = useRef(state)  // 创建一个 ref，初始值为 state
  const setRafState = useCallback(
    patch => {
      setState(prevState => {
        // 使用 ref.current 存储最新的状态值
        return (ref.current = isFunction(patch) ? patch(prevState) : patch)
      })
    },
    [state]  // 确保 useCallback 使用最新的 state
  )
  return [state, setRafState, ref]
}

```

将 useState 和 useRef 结合在一起，使得状态的变化不仅可以触发组件重新渲染，还可以同时更新一个 ref，从而在状态变更后可以立即访问最新的状态值，而无需依赖于组件的重新渲染

示例：

```ts
import React from 'react';
import useRefState from './useRefState';

function ExampleComponent() {
  const [count, setCount, countRef] = useRefState(0);

  const increment = () => {
    setCount(prevCount => prevCount + 1);
    console.log('Current count from ref:', countRef.current);  // 总是输出最新的 count
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

export default ExampleComponent;
```

useRefState 使得你可以在状态更新后立即获取最新的 count 值，而无需等待组件的重新渲染
