# utils函数

## 节流

    ```javascript

        const throttle = function (func, time , isImmediate = true) {
        
            let oldTime = isImmediate ? 0 : Date.now()
            return function (...args) {
                const newTime = Date.now()
                const timeOut = newTime - oldTime
                if (timeOut >= time) {
                    oldTime = newTime
                    func.apply(this, args)
                }
            }
        }

    ```

## 防抖

    ```javascript
        const debounce = function (func, time , isImmediate = true) {
            let timer
            return function (...args) {
                const init = isImmediate && !timer;
                clearTimeout(timer)
                timer = setTimeout(() => {
                    timer = undefined
                    !Immediate && func.apply(this,args)
                }, time)
                init && func.apply(this,args)
            }
        }

    ```

## 异步防抖

    ```js
    // 在debounceAsync里，如果任务没有执行则会返回一个always pending promise
    // debounceAsync 处理异步任务的执行时机
    export function debounceAsync(fn, ms = 300) {
      let timeoutId;
      return function debouncedFiltered(...args) {
        return new Promise((resolve, reject) => {
          if (timeoutId !== void 0) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            fn.call(this, ...args)
              .then(resolve)
              .catch(reject);
          }, ms);
        });
      };
    }
    ```

## 异步防抖处理

```js

// debounceAsyncResult 处理已经执行的异步任务的结果
export function debounceAsyncResult(fn) {
  let lastFetchId = 0;
  return function asyncDebounced(...args) {
    const fetchId = ++lastFetchId;
    return new Promise((resolve, reject) => {
      fn.call(this, ...args)
        .then((...rez) => {
          if (fetchId === lastFetchId) {
            resolve(...rez);
          }
        })
        .catch((...err) => {
          if (fetchId === lastFetchId) {
            reject(...err);
          }
        });
    });
  };
}


```

## 异步节流处理

  ```js

  //  异步节流：上一次的promise pending期间，不会再次触发(上一次请求没有结束，下一次的不会进行请求)
  export function throttleAsyncResult(fn, { useSamePromise = false } = {}) {
    let isPending = false;
    let theLastPromise = null;
    return function asyncThrottled(...args) {
      if (isPending) {
        if (useSamePromise && theLastPromise) {
          return theLastPromise;
        }
        // 此promise会永远等待下去
        return new Promise(() => {});
      } else {
        const ret = fn
          .call(this, ...args)
          .then((...a1) => {
            isPending = false;
            theLastPromise = null;
            return Promise.resolve(...a1);
          })
          .catch((...a2) => {
            isPending = false;
            theLastPromise = null;
            return Promise.reject(...a2);
          });
        theLastPromise = ret;
        isPending = true;
        return ret;
      }
    };
  }
  ```

## 重试

```js
export function withRetryAsync(fn, {
  maxCount = 3,
  retryInterval = 1000,
  onRetry = (i) => {},
  onFailed = (i, lastFailedReason) => {},
} = {}) {
  return function withRetryedAsync(...args) {
    return new Promise((resolve, reject) => {
      let retriedCount = 0;

      const that = this;
      execTask();

      function execTask() {
        onRetry(++retriedCount);
        fn.call(that, ...args)
          .then((...r) => {
            resolve(...r);
          })
          .catch((...e) => {
            if (retriedCount >= maxCount) {
              onFailed(retriedCount, e);
              reject(...e);
            } else {
              onFailed(retriedCount, e);
              setTimeout(execTask, retryInterval);
            }
          });
      }
    });
  };
}

```

## 扇出

```js
// 将一个数据源分发到多个目标
function fanOut(sourcePromise, ...targets) {
  return sourcePromise
    .then(data => {
      return Promise.all(targets.map(target => {
        return new Promise((resolve, reject) => {
          try {
            target(data);
            resolve(); 
          } catch (error) {
            reject(error);
          }
        });
      }));
    })
    .catch(error => {
      console.error('Error in sourcePromise:', error);
    });
}
```

## 扇入

```js
// 扇入：多个promise，等待所有都完成 // 注意和promise.all的区别  rxjs有类似实现
function fanInReflect(...promises) { 
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    function handleResult(index, result) {
      results[index] = result;
      completed++;
      if (completed === promises.length) {
        resolve(results);
      }
    }
    promises.forEach((promise, index) => {
      promise
        .then(result => handleResult(index, { result, status: 'fulfilled' }))
        .catch(error => handleResult(index, { error, status: 'rejected' }));
    });
  });
}
```

## 数据是否为空

```javascript
    
      const emptyType =  {
        Array: data => data.length === 0,
        String: data => data === '',
        Object: data => Object.keys(data).length === 0,
        Undefined: data => data === undefined,
        Null: data => data === null
      }
      const isNoEmpty = data => {
        try {
          const type = Object.prototype.toString.call(data).slice(8, -1)
          if(emptyType[type]) {
            return emptyType[type](data)
          }
          return false
        } catch (error) {
          return false
        }
      }

```

## 判断是否是对象

```javascript

      // typeof null === 'object'
      const isObject = val => !== null && typeof val === 'object';
      
```

## 判断对象是否存在某属性

```javascript
  //hasOwnProperty方法可以检查对象是否真正"自己拥有"某属性或者方法
  // in in运算符只能检查某个属性或方法是否可以被对象访问，不能检查是否是自己的属性或方法
  const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target,key)
```

## 深拷贝

```javascript
  


```

## 交换数组内的值

```javascript

  const swap = (array, a, b) => {
    [array[a], array[b]] = [array[b], array[a]]
  }
  
```

## 数组扁平化

```javascript

  const flat = (arr, depth = 1) => {
    if(depth > 0) {
      return arr.reduce((target, current) => {
        return target.concat(Array.isArray(current)? flat(current, depth -1): [current])
      },[])
    }
    return arr.slice()
  }

  console.log(flat([1,[2], [3]], 3))

  const flatWhile = (arr) => {
      while(arr.some((item) => Array.isArray(item) )) {
        arr = [].concat(...arr)
      }
      return arr.slice()
  }

```

## LRU(最近最少使用)

```javascript

class LRUCache  {
  constructor(length) {
    this.length = length
    // Map 的遍历顺序就是插入顺序 阮一峰书上的话：https://es6.ruanyifeng.com/#docs/set-map  
    // 经过测试，遍历顺序，先入先出
    this.data = new Map()
  }

  //往 map 里面添加新数据，如果添加的数据存在了，则先删除该条数据，然后再添加。如果添加数据后超长了，则需要删除最久远的一条数据。
  set(key,value) {
    const data = this.data
    if(data.has(key)) {
      data.delete(key)
    }
    // 删除重新添加，放在迭代器的的最前面
    data.set(key, value)

    if(data.size > this.length) {
      // data.keys().next().value 便是获取最后一条数据的意思
      const delKey = data.keys().next().value
      data.delete(delKey)
    }
  }

  // 首先从 map 对象中拿出该条数据，然后删除该条数据，最后再重新插入该条数据，确保将该条数据移动到最前面
  get(key) {
    const data = this.data
    if(!data.has(key)) {
      return null
    }

    const value = data.get(key)

    data.delete(key)
    data.set(key,value)
  }
}
/**
 * 
    let m = new Map()
    m.set(1,1)
    Map(1) {1 => 1}
    m.set(2,2)
    Map(2) {1 => 1, 2 => 2}
    m.set(3,3)
    Map(3) {1 => 1, 2 => 2, 3 => 3}
    m.keys().value
    undefined
    m.keys().next()
    {value: 1, done: false}
 */
```

## 缓存函数
>
>返回记忆化（缓存）函数。（可优化递归）
>通过实例化一个新Map对象来创建一个空缓存。
>通过首先检查该特定输入值的函数输出是否已经缓存，或者如果没有，则存储并返回它，从而返回一个函数，该函数将一个参数提供给记忆化函数。
>该function关键字必须以允许memoized功能有其使用this范围内，如果有必要改变。
>cache通过将其设置为返回函数的属性来允许访

```javascript

  const memoize = fn => {
    const cache = new Map()
    const cached = function(val) {
      // 这里要注意this 调用的地方的上下文
      return cache.has(val)? cache.get(val) : cache.set(val. fn.call(this, val)) && cache.get(val)
    }
    cached.cache = cache
    return cached
  }

```

## 浮点数操作

```javascript


```
