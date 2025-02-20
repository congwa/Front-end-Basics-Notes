# uvloop

uvloop 是一个用于 Python 的事件循环实现，它是 asyncio 的替代品，具有以下主要特点：

1. **高性能**
   - 基于 libuv 构建（同样被 Node.js 使用的库）
   - 性能比 Python 默认的 asyncio 事件循环快 2-4 倍， ，主要是因为它通过 Cython 和 libuv 将关键性能路径移到了 C 语言层面，减少了 Python 解释器的开销，同时利用了操作系统提供的高效 I/O 机制
   - 在某些基准测试中，性能接近于 Go 程序

2. **完全兼容性**
   - 与 asyncio 完全兼容
   - 可以无缝替换默认的事件循环
   - 支持所有 asyncio 的特性和 API

3. **使用方式**

   ```python
   import asyncio
   import uvloop
   # 将asyncio默认的事件循环替换为 uvloop
   asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
   ```

4. **适用场景**
   - 高并发网络应用
   - Web 服务器
   - 异步数据库操作
   - 需要高性能 IO 操作的场景

5. **限制**
   - 仅支持 Unix-like 系统（Linux, macOS 等）
   - 不支持 Windows
   - 需要额外安装（`pip install uvloop`）
