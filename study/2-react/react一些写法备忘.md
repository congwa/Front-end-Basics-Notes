# 写法备忘

## 定时器 - 定时器与useEffect

```jsx
import React, { useEffect, useRef } from 'react'

const Counter = () => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1) // 打破闭包
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return <div>{count}</div>
}

```
