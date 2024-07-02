# 并发请求处理

```js
import { ref } from 'vue';

export function useLatestAsync(fn) {
  const requestId = ref(0); // 用于追踪每个请求的唯一标识

  const execute = async (...args) => {
    // 增加请求ID
    const currentRequestId = ++requestId.value;

    try {
      // 执行传入的异步函数
      const result = await fn(...args);

      // 如果当前请求的ID与最新请求ID不一致，忽略结果
      if (currentRequestId !== requestId.value) {
        return;
      }

      // 返回结果
      return result;
    } catch (error) {
      // 如果发生错误，忽略错误
      if (currentRequestId === requestId.value) {
        throw error;
      }
    }
  };

  return { execute };
}
```
