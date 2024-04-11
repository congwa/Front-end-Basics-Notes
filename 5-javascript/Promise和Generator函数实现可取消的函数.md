# 设计一个可取消函数

![cancel](/study/imgs/cancelfunction.png)


```js
function cancelable(fn) {
  // 将 Generator 函数转换成迭代器对象
  const gen = fn()

  // 定义 cancel 方法用于取消操作
  const cancel = () => {
    // 如果已完成或已取消，则直接返回
    if (done || canceled) return

    // 标记为已取消
    canceled = true

    // 如果迭代器存在 return 方法，则调用之
    if (typeof gen.return === 'function') {
      gen.return()
    }
  }

  // 定义 done 和 canceled 变量，用于判断是否完成或取消
  let done = false
  let canceled = false

  // 定义一个递归的 next 方法，用于执行迭代器中的下一步并返回 Promise
  const next = () => {
    // 如果已完成或已取消，则直接返回 resolved Promise
    if (done || canceled) {
      return Promise.resolve()
    }

    // 执行迭代器中的下一步，并将结果包装成 Promise
    const result = gen.next()
    const promise = Promise.resolve(result.value)

    // 如果已完成，则将 done 标记为 true 并返回 resolved Promise
    if (result.done) {
      done = true
      return promise
    }

    // 返回一个新的 Promise，用于处理取消操作
    return promise.then(
      value => {
        // 如果已取消，则直接返回 resolved Promise
        if (canceled) {
          return Promise.resolve()
        }

        // 继续执行迭代器的下一步
        return next()
      },
      error => {
        // 如果已取消，则直接返回 resolved Promise
        if (canceled) {
          return Promise.resolve()
        }

        // 将错误抛出
        throw error
      }
    )
  }

  return {
    next,
    cancel,
  }
}

```

使用示例

```js
function* test() {
  console.log('start')
  yield new Promise(resolve => setTimeout(resolve, 1000))
  console.log('end')
}

const c = cancelable(test)

c.next().then(() => {
  console.log('done')
})

c.cancel()

// start
```