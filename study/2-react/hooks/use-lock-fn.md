# 对一个异步函数进行锁定(锁机制的异步函数)

```ts
import { useRef, useCallback } from 'react'

function useLockFn<P extends any[] = any[], V = any>(
  fn: (...args: P) => Promise<V>
) {
    // 使用useRef 保证随更新改变
  const lockRef = useRef(false)

  return useCallback(
    async (...args: P) => {
      if (lockRef.current) return
      // 调用之前进行上锁
      lockRef.current = true
      try {
        const ret = await fn(...args)
        lockRef.current = false
        return ret
      } catch (e) {
        lockRef.current = false
        throw e
      }
    },
    [fn]
  )
}

export default useLockFn
```

使用示例

```ts
import React from 'react'
import useLockFn from './useLockFn'

const fetchData = async () => {
  console.log('Fetching data...')
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Data fetched')
      resolve('data')
    }, 2000)
  })
}

const MyComponent = () => {
    //调用未完成之前一直有锁
  const fetchLockedData = useLockFn(fetchData)

  return (
    <div>
      <button onClick={fetchLockedData}>Fetch Data</button>
    </div>
  )
}

export default MyComponent

```