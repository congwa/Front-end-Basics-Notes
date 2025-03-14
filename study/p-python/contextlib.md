# contextlib

## Python异步上下文管理器

异步上下文管理器是Python中用于管理异步代码中资源的一种机制，它是传统上下文管理器(`with`语句)的异步版本，使用`async with`语法。

@contextmanager 仅提供上下文管理功能，并不能解决并发访问冲突的问题，需要额外的同步机制来确保资源安全

### 基本概念

异步上下文管理器允许你在进入和退出异步上下文时执行异步操作，这对于需要异步获取或释放资源的场景非常有用。

## 实现方式

要创建一个异步上下文管理器，需要实现两个特殊方法：

1. `__aenter__`: 异步进入上下文时调用
2. `__aexit__`: 异步退出上下文时调用

## 基本示例

```python
import asyncio

class AsyncContextManager:
    async def __aenter__(self):
        print("进入异步上下文")
        await asyncio.sleep(1)  # 模拟异步操作
        return self  # 返回值会被赋给as后的变量
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("退出异步上下文")
        await asyncio.sleep(1)  # 模拟异步操作
        # 返回True可以抑制异常传播

async def main():
    async with AsyncContextManager() as manager:
        print("在异步上下文中执行操作")
        await asyncio.sleep(0.5)

asyncio.run(main())
```

## 实际应用场景

### 1. 异步数据库连接

```python
class AsyncDBConnection:
    async def __aenter__(self):
        self.conn = await create_db_connection()  # 异步连接数据库
        return self.conn
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.conn.close()  # 异步关闭连接

async def fetch_data():
    async with AsyncDBConnection() as conn:
        return await conn.execute("SELECT * FROM users")
```

### 2. 异步锁

```python
async def worker(lock, name):
    async with lock:  # 异步获取锁
        print(f"{name} 获得了锁")
        await asyncio.sleep(1)
    print(f"{name} 释放了锁")

async def main():
    lock = asyncio.Lock()
    await asyncio.gather(
        worker(lock, "任务1"),
        worker(lock, "任务2"),
        worker(lock, "任务3")
    )
```

### 3. 异步超时控制

```python
async def long_operation():
    await asyncio.sleep(5)
    return "操作完成"

async def main():
    try:
        async with asyncio.timeout(2):  # Python 3.11+
            result = await long_operation()
            print(result)
    except asyncio.TimeoutError:
        print("操作超时")
```

## 使用contextlib创建异步上下文管理器

除了定义类，还可以使用`contextlib.asynccontextmanager`装饰器创建异步上下文管理器：

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def managed_resource():
    # 获取资源
    resource = await acquire_resource()
    try:
        yield resource  # 提供资源
    finally:
        # 释放资源
        await release_resource(resource)

async def use_resource():
    async with managed_resource() as resource:
        await resource.do_something()
```

## 异步上下文管理器与异常处理

`__aexit__`方法接收三个参数，用于处理上下文内发生的异常：

```python
async def __aexit__(self, exc_type, exc_val, exc_tb):
    # exc_type: 异常类型
    # exc_val: 异常值
    # exc_tb: 异常的追踪信息
    
    if exc_type is not None:
        print(f"处理异常: {exc_val}")
        return True  # 返回True表示异常已处理，不再传播
    
    # 正常退出
    await self.cleanup()
```

## Python contextlib

`contextlib` 是 Python 标准库中的一个模块，提供了用于创建和使用上下文管理器的工具。上下文管理器是实现了 `__enter__` 和 `__exit__` 方法的对象，用于在代码块执行前后执行特定操作，通常用于资源管理。

### 基本功能

#### 1. contextmanager 装饰器

最常用的功能是 `@contextmanager` 装饰器，它可以将生成器函数转换为上下文管理器：

```python
from contextlib import contextmanager

@contextmanager
def file_manager(filename, mode):
    try:
        f = open(filename, mode)
        yield f  # 将控制权交给 with 语句块
    finally:
        f.close()  # 无论 with 块是否发生异常，都会执行

# 使用
with file_manager('test.txt', 'w') as f:
    f.write('Hello, World!')
```

#### 2. asynccontextmanager 装饰器

用于创建异步上下文管理器：

```python
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def async_file_manager(filename, mode):
    try:
        f = open(filename, mode)
        yield f
    finally:
        f.close()

# 使用
async def main():
    async with async_file_manager('test.txt', 'r') as f:
        content = f.read()
        print(content)

asyncio.run(main())
```

#### 3. closing 函数

用于确保对象在退出上下文时调用其 `close()` 方法：

```python
from contextlib import closing
from urllib.request import urlopen

with closing(urlopen('http://www.python.org')) as page:
    for line in page:
        print(line)
# 自动调用 page.close()
```

#### 4. suppress 上下文管理器

用于临时忽略特定异常：

```python
from contextlib import suppress
import os

# 忽略文件不存在的异常
with suppress(FileNotFoundError):
    os.remove('不存在的文件.txt')
    print("文件已删除")  # 如果文件不存在，这行不会执行，但程序会继续运行
```

#### 5. redirect_stdout 和 redirect_stderr

重定向标准输出和标准错误流：

```python
from contextlib import redirect_stdout
import io

f = io.StringIO()
with redirect_stdout(f):
    print('Hello, World!')
    
output = f.getvalue()
print(f"捕获的输出: {output}")  # 捕获的输出: Hello, World!
```

#### 6. ExitStack 类

管理多个上下文管理器：

```python
from contextlib import ExitStack

with ExitStack() as stack:
    files = [stack.enter_context(open(f'file{i}.txt', 'w')) for i in range(3)]
    # 所有文件都会在退出 with 块时自动关闭
    for f in files:
        f.write('Hello, World!')
```

#### 7. nullcontext

创建一个什么都不做的上下文管理器：

```python
from contextlib import nullcontext

# 条件性地使用上下文管理器
use_lock = False
lock = threading.Lock() if use_lock else nullcontext()

with lock:
    # 如果 use_lock 为 True，获取锁
    # 如果为 False，什么都不做
    print("执行关键代码")
```

## 在 LangChain 中的应用

```python
from contextlib import contextmanager
from langchain_core.chat_history import BaseChatMessageHistory

@contextmanager
def chat_history_context(history: BaseChatMessageHistory):
    # 进入上下文：加载历史消息
    messages = history.messages.copy()
    try:
        yield messages  # 将消息传递给 with 块
    finally:
        # 退出上下文：保存新消息
        # 这里可以添加保存逻辑
        pass
```


## 并发场景下

如果多个线程或进程同时访问同一个文件或资源，可能会导致数据竞争、文件损坏或读取异常


```py
## 使用锁来防止访问
import fcntl
from contextlib import contextmanager

@contextmanager
def file_manager(filename, mode):
    with open(filename, mode) as f:
        fcntl.flock(f, fcntl.LOCK_EX)  # 加独占锁，防止其他进程访问
        try:
            yield f
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)  # 释放锁

# 多进程安全写入
import multiprocessing

def write_to_file():
    with file_manager('test.txt', 'a') as f:
        f.write('File lock write\n')

processes = [multiprocessing.Process(target=write_to_file) for _ in range(5)]

for p in processes:
    p.start()

for p in processes:
    p.join()

```