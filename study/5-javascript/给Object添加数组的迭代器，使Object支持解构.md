# 给Object添加数组的迭代器，使Object支持解构

让以下代码成立：var [a, b] = {a: 1, b: 2}

```js
Object.prototype[Symbol.iterator] = function() {
  return Object.values(this)[Symbol.iterator]()
}

var [a, b] = {a: 1, b: 2}
console.log(a, b) // 1 2
```

将 Object.prototype 的 Symbol.iterator 属性定义为一个函数。该函数返回调用 Object.values(this) 所得数组的迭代器。这里的关键点是：

Object.values(this) 返回一个包含对象自身所有可枚举属性值的数组。
[Symbol.iterator]() 调用返回的数组的迭代器。

这意味着现在所有的对象都可以通过 for...of 循环或其他迭代机制进行迭代。
