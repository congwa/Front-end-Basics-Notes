# 用一个条件控制是否render（延迟render）

希望根据一个变量来控制render，当这个变量是true的时候才render，否则不render。

```ts
function useLazyRender(
  show: boolean
): (render: () => React.ReactNode) => () => ReactNode {
  const [inited, setInited] = useState<boolean>(false)

  useEffect(() => {
    if (show) {
      setInited(show)
    }
  }, [show])

  return render => () => inited ? render() : null
}
```

改装一下： 希望根据多个变量控制render，当这些变量都是true的时候才render，否则不render。

```ts
function useLazyRender(
  conditions: boolean[]
): (render: () => React.ReactNode) => () => React.ReactNode {
  const [inited, setInited] = useState<boolean>(false);

  useEffect(() => {
    if (conditions.every(cond => cond)) {
      setInited(true);
    }
  }, [conditions]);

  return (render) => () => (inited ? render() : null);
}
```

上面的实现`conditions`需要注意一定的引用问题，那么如何避免呢？

```ts
import { useState, useEffect, useMemo } from 'react';

function useLazyRender(
  conditions: boolean[]
): (render: () => React.ReactNode) => () => React.ReactNode {
  const [inited, setInited] = useState<boolean>(false);

  // Use useMemo to memoize conditions to prevent unnecessary rerenders.
  const memoizedConditions = useMemo(() => [...conditions], [JSON.stringify(conditions)]);

  useEffect(() => {
    if (memoizedConditions.every(cond => cond)) {
      setInited(true);
    }
  }, [memoizedConditions]);

  return (render) => () => (inited ? render() : null);
}

```

使用 JSON.stringify 将数组转换为字符串,确保值变化，能够重新构造memoizedConditions的引用，能够刷新