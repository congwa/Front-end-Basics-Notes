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
  //hasOwnProperty方法可以检查对象是否真正“自己拥有”某属性或者方法
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
