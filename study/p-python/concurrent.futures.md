# `concurrent.futures` 模块详解

从 Python 3.2 开始，标准库提供了 `concurrent.futures` 模块，它为并发任务执行提供了更高级的接口。主要包含两个类：

- **`ThreadPoolExecutor`**：基于线程的并发执行。
- **`ProcessPoolExecutor`**：基于进程的并发执行。

相比 `threading` 模块，该模块通过 `submit` 返回一个 `Future` 对象，主线程可以通过它：

1. 获取某个线程或任务的执行状态。
2. 获取任务的返回值。
3. 在任务完成时立即收到通知。

---

## **`ThreadPoolExecutor`**

`ThreadPoolExecutor` 是线程池的实现，用于并发地执行多个任务，避免手动管理线程的创建和销毁。

### **基本方法**

1. **`submit(fn, \*args, **kwargs)`**  
提交任务到线程池，返回 `Future` 对象，用于跟踪任务状态和结果。

   ```python
   future = executor.submit(func, arg1, arg2)
   ```

2. **`map(func, *iterables, timeout=None)`**  
   对可迭代对象的每个元素并发地执行 `func`，返回的结果顺序与输入顺序一致。
3. **`shutdown(wait=True)`**  
   关闭线程池，`wait=True` 表示等待所有任务完成后再关闭。

### **示例：基本用法**

```python
import time
from concurrent.futures import ThreadPoolExecutor

def action(second):
    print(f"Task {second} starts")
    time.sleep(second)
    print(f"Task {second} ends")
    return second

# 创建线程池
with ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(action, sec) for sec in [4, 5, 2, 3]]
    results = [f.result() for f in futures]  # 获取所有任务的返回值
    print(f"Results: {results}")
```

**输出**

```
Task 4 starts
Task 5 starts
Task 4 ends
Task 2 starts
Task 5 ends
Task 3 starts
Task 2 ends
Task 3 ends
Results: [4, 5, 2, 3]
```

---

## **`wait` 方法**

`wait(fs, timeout=None, return_when=ALL_COMPLETED)` 用于主线程等待任务完成。

### **参数**

- **`fs`**：需要等待的任务序列。
- **`timeout`**：最大等待时间，超时后即使任务未完成也会返回。
- **`return_when`**：
  - `ALL_COMPLETED`：所有任务完成时返回（默认）。
  - `FIRST_COMPLETED`：第一个任务完成时返回。

### **示例：等待所有任务完成**

```python
from concurrent.futures import ThreadPoolExecutor, wait, ALL_COMPLETED

def action(second):
    print(f"Task {second} starts")
    time.sleep(second)
    print(f"Task {second} ends")
    return second

with ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(action, sec) for sec in [4, 5, 2, 3]]
    wait(futures, return_when=ALL_COMPLETED)
    print("All tasks completed")
```

### **示例：等待第一个任务完成**

```python
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED

def action(second):
    print(f"Task {second} starts")
    time.sleep(second)
    print(f"Task {second} ends")
    return second

with ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(action, sec) for sec in [4, 5, 2, 3]]
    wait(futures, return_when=FIRST_COMPLETED)
    print("First task completed")
```

---

## **`as_completed` 方法**

`as_completed` 是一个生成器，按任务完成顺序返回 `Future` 对象。

- 当一个任务完成时立即返回该任务的结果。
- 对于不需要等待所有任务完成的场景非常适用。

### **示例：按完成顺序处理任务**

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def action(second):
    print(f"Task {second} starts")
    time.sleep(second)
    print(f"Task {second} ends")
    return second

with ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(action, sec) for sec in [4, 5, 2, 3]]
    for future in as_completed(futures):
        print(f"Task completed with result: {future.result()}")
```

---

## **`map` 方法**

`map(func, *iterables, timeout=None)` 会将函数并发地应用于输入的可迭代对象，但结果的顺序与输入顺序一致。

### **特点**

- 返回值顺序与输入顺序一致。
- 如果某任务执行时间过长，后续任务的结果也会等待。

### **示例：顺序返回结果**

```python
from concurrent.futures import ThreadPoolExecutor

def action(second):
    print(f"Task {second} starts")
    time.sleep(second)
    print(f"Task {second} ends")
    return second

with ThreadPoolExecutor(max_workers=2) as executor:
    results = list(executor.map(action, [5, 1, 2, 3]))
    print(f"Results: {results}")
```

**输出**

```
Task 5 starts
Task 1 starts
Task 5 ends
Task 2 starts
Task 1 ends
Task 3 starts
Task 2 ends
Task 3 ends
Results: [5, 1, 2, 3]
```

---

## **注意事项**

1. **`submit` vs `map`**

   - `submit` 返回 `Future`，需要手动管理。
   - `map` 直接返回结果，顺序与输入一致。

2. **`wait` vs `as_completed`**

   - `wait`：可以选择等待全部任务完成或第一个任务完成。
   - `as_completed`：逐个返回完成任务，适合需要即时处理结果的场景。

3. **异常处理**
   如果任务抛出异常，`Future.result()` 会抛出对应的异常，需进行捕获。

   ```python
   from concurrent.futures import ThreadPoolExecutor

   def action(second):
       if second == 3:
           raise ValueError("Task failed")
       return second

   with ThreadPoolExecutor(max_workers=2) as executor:
       futures = [executor.submit(action, sec) for sec in [4, 5, 3, 2]]
       for future in as_completed(futures):
           try:
               print(f"Result: {future.result()}")
           except Exception as e:
               print(f"Task failed with exception: {e}")
   ```

4. **线程池复用**
   使用 `with` 语句可以确保线程池在任务完成后自动关闭。

5. **性能**
   - 适合 I/O 密集型任务（如文件操作、网络请求）。
   - 对于计算密集型任务，建议使用 `ProcessPoolExecutor`。

---

## **总结**

`concurrent.futures` 提供了简单且高效的线程池和进程池接口，通过 `ThreadPoolExecutor` 和 `as_completed` 等工具，可以方便地实现并发任务的调度与管理。在选择方法时，应根据具体场景需求：

- `submit`：灵活提交任务。
- `map`：简单遍历，保持顺序。
- `as_completed`：逐步处理结果。
- `wait`：根据需要等待任务完成。
