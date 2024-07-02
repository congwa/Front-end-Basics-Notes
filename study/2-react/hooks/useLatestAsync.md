# 并发请求处理

```ts
import { useCallback, useRef } from 'react';

function useLatestAsync<P extends any[] = any[], V = any>(
  fn: (...args: P) => Promise<V>
) {
  const requestIdRef = useRef(0); // 用于追踪每个请求的唯一标识

  return useCallback(
    async (...args: P) => {
      // 增加请求ID
      const currentRequestId = ++requestIdRef.current;

      try {
        // 执行传入的异步函数
        const result = await fn(...args);

        // 如果当前请求的ID与最新请求ID不一致，忽略结果
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        // 返回结果
        return result;
      } catch (error) {
        // 如果发生错误，忽略错误
        if (currentRequestId === requestIdRef.current) {
          throw error;
        }
      }
    },
    [fn] // useCallback的依赖是传入的异步函数
  );
}

export default useLatestAsync;

```