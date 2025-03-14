# asyncio

1. 3.4引入asyncio
2. 3.5引入async await关键字
3. ...

```python
import asyncio
import itertools as it
import os
import random
import time

async def makeitem(size: int = 5) -> str:
    return os.urandom(size).hex()

async def randsleep(caller=None) -> None:
    i = random.randint(0, 10)
    if caller:
        print(f"{caller} sleeping for {i} seconds.")
    await asyncio.sleep(i)

async def produce(name: int, q: asyncio.Queue) -> None:
    n = random.randint(0, 10)
    for _ in it.repeat(None, n):  # Synchronous loop for each single producer
        await randsleep(caller=f"Producer {name}")
        i = await makeitem()
        t = time.perf_counter()
        await q.put((i, t))
        print(f"Producer {name} added <{i}> to queue.")

async def consume(name: int, q: asyncio.Queue) -> None:
    while True:
        await randsleep(caller=f"Consumer {name}")
        i, t = await q.get()
        now = time.perf_counter()
        print(f"Consumer {name} got element <{i}>"
              f" in {now-t:0.5f} seconds.")
        q.task_done()

async def main(nprod: int, ncon: int):
    q = asyncio.Queue()
    producers = [asyncio.create_task(produce(n, q)) for n in range(nprod)]
    consumers = [asyncio.create_task(consume(n, q)) for n in range(ncon)]
    await asyncio.gather(*producers)
    await q.join()  # Implicitly awaits consumers, too
    for c in consumers:
        c.cancel()

if __name__ == "__main__":
    import argparse
    random.seed(444)
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--nprod", type=int, default=5)
    parser.add_argument("-c", "--ncon", type=int, default=10)
    ns = parser.parse_args()
    start = time.perf_counter()
    asyncio.run(main(**ns.__dict__))
    elapsed = time.perf_counter() - start
    print(f"Program completed in {elapsed:0.5f} seconds.")


# _StoreAction(option_strings=['-p', '--nprod'], dest='nprod', nargs=None, const=None, default=5, type=<class 'int'>, choices=None, help=None, metavar=None)
# _StoreAction(option_strings=['-c', '--ncon'], dest='ncon', nargs=None, const=None, default=10, type=<class 'int'>, choices=None, help=None, metavar=None)
# Producer 0 sleeping for 4 seconds.
# Producer 2 sleeping for 7 seconds.
# Consumer 0 sleeping for 7 seconds.
# Consumer 1 sleeping for 8 seconds.
# ...
# Producer 0 added <4c215641e9> to queue.
# Producer 0 sleeping for 10 seconds.
# Producer 3 added <7ad6097316> to queue.
# Producer 3 sleeping for 0 seconds.
# ...
# Consumer 1 sleeping for 10 seconds.
# Program completed in 40.01253 seconds.
```

## asyncio的功能与使用技巧

Python的`asyncio`是一个用于编写并发代码的库，使用`async/await`语法。它是Python标准库的一部分，专为处理网络IO等高延迟操作而设计。

## 基本概念

### 1. 协程 (Coroutines)

协程是可以在执行过程中暂停和恢复的函数。

```python
import asyncio

async def hello_world():
    print("Hello")
    await asyncio.sleep(1)  # 非阻塞的等待
    print("World")

# 运行协程
asyncio.run(hello_world())
```

### 2. 任务 (Tasks)

任务是协程的高级封装，可以并发执行多个协程。

```python
async def main():
    # 创建任务
    task1 = asyncio.create_task(asyncio.sleep(1))
    task2 = asyncio.create_task(asyncio.sleep(2))
    
    # 等待任务完成
    await task1
    await task2

asyncio.run(main())
```

### 3. 事件循环 (Event Loop)

事件循环是asyncio的核心，它管理和调度所有的协程和任务。

```python
# 获取当前事件循环
loop = asyncio.get_event_loop()

# 在事件循环中运行协程
loop.run_until_complete(hello_world())

# 关闭事件循环
loop.close()
```

## 实用功能

### 1. 并发执行多个协程

```python
async def fetch_data(url):
    # 模拟网络请求
    await asyncio.sleep(1)
    return f"Data from {url}"

async def main():
    urls = ["url1", "url2", "url3"]
    tasks = [fetch_data(url) for url in urls]
    
    # 并发执行所有任务
    results = await asyncio.gather(*tasks)
    print(results)

asyncio.run(main())
```

### 2. 超时控制

```python
async def long_operation():
    await asyncio.sleep(10)
    return "Operation completed"

async def main():
    try:
        # 设置3秒超时
        result = await asyncio.wait_for(long_operation(), timeout=3)
        print(result)
    except asyncio.TimeoutError:
        print("Operation timed out")

asyncio.run(main())
```

### 3. 异步迭代器和异步上下文管理器

```python
# 异步迭代器
async def async_generator():
    for i in range(5):
        await asyncio.sleep(0.5)
        yield i

async def main():
    # 使用异步for循环
    async for number in async_generator():
        print(number)
    
    # 异步上下文管理器
    async with asyncio.timeout(5):
        await asyncio.sleep(3)
        print("Operation completed within timeout")

asyncio.run(main())
```

## 在LangChain中的应用

LangChain使用了asyncio来实现异步操作。例如：

```python
async def aadd(addables: AsyncIterable[Addable]) -> Optional[Addable]:
    """Asynchronously add a sequence of addable objects together."""
    final: Optional[Addable] = None
    async for chunk in addables:
        final = chunk if final is None else final + chunk
    return final
```

使用`async for`来异步迭代一个可迭代对象，处理大量数据或网络请求时

LangChain还提供了一些辅助函数来检测函数是否是异步的：

```python
def is_async_generator(func: Any) -> TypeGuard[Callable[..., AsyncIterator]]:
    """Check if a function is an async generator."""
    return (
        inspect.isasyncgenfunction(func)
        or hasattr(func, "__call__")
        and inspect.isasyncgenfunction(func.__call__)
    )

def is_async_callable(func: Any) -> TypeGuard[Callable[..., Awaitable]]:
    """Check if a function is async."""
    return (
        asyncio.iscoroutinefunction(func)
        or hasattr(func, "__call__")
        and asyncio.iscoroutinefunction(func.__call__)
    )
```

## 最佳实践

1. **使用`asyncio.run()`作为入口点**：它会创建新的事件循环并在完成后关闭它。

2. **避免在协程中使用阻塞调用**：使用`await`调用其他协程或异步函数。

3. **使用`asyncio.gather()`并发执行多个协程**

4. **使用`asyncio.wait_for()`添加超时控制**：防止协程无限期运行。

5. **使用`async with`和`async for`**：处理异步上下文管理器和异步迭代器。

处理I/O密集型任务时，如网络请求、文件操作使用