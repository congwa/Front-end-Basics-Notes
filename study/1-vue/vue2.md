# vue2

## 数组部分

<details>
  <summary>起因：被问vue2的直接使用数组的下标改值，会不会更改</summary>

思考了一下：内心活动vue2在数组进行拦截的时候，可以对数组进行循环，依次对数组下标进行defineProperty,遂很肯定的回答 **会**
</details>

### vue为什么不对数组的下标进行响应式监听

从知乎上搜索到的答案是 **因为性能影响**

### 尝试

#### 并非不能实现下标响应式

```js

export class Observer {
  // ....
  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
      this.walk(value)    // 保留原有的数组监听方式下，增加对下标的监听响应
    } else {
      this.walk(value)
    }
  }
  // ......
}

```

使用数组下标响应式

```html

<template>
  <div>
    <span v-for="i in arr">{{ i }}</span>
    <button @click="updateIndex">改变下标对应的值</button>
  </div>
</template>
<script>
// import modified vue
export default {
  data() {
    return {
      arr: new Array(100).fill(0)
    }
  },
  methods: {
    updateIndex() {
      console.time('updateIndex')
      for (let i = 0; i < TIMES; i++) {
        this.arr[0]++
      }
      console.timeEnd('updateIndex')
    }
  }
}
</script>

```

使用原版

```html

<template><!-- 和上面一样 --></template>
<script>
// import origin vue
export default {
  data() { /* 和上面一样 */ },
  methods: {
    updateIndex() {
      console.time('updateIndex')
      for (let i = 0; i < TIMES; i++) {
        this.arr[0]++
      }
      this.arr.splice(0, 0)    // 通过 splice 实现视图更新
      console.timeEnd('updateIndex')
    }
  }
}
</script>


```

[性能图](https://img-blog.csdnimg.cn/img_convert/aaa42f13b3ea958c4df8b5fd14161d64.png)
[折线图](https://img-blog.csdnimg.cn/img_convert/5ebc21a348f5ccc4a634610308f9a2c2.png)

[此例子来源csdn](https://blog.csdn.net/Vera_Gao/article/details/118979459)

非常不能理解，如果对10万个数组的下标遍历会占用时间和内存，但是不太理解为什么响应的时候会性能降低，有大佬可以帮我解惑。谢谢。

### 思考

如果10万个数组的下标进行监听，在5万的地方进行删除一个下标，那么5万之后的下标前移之后，怎么处理已经收集的响应式依赖重新绑定或者重新监听也是一个复杂的问题。

## vue2数组拦截简单实现

```js
// array.js
const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);

const methodsToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method];
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args);
    // 自定义逻辑，触发依赖、通知更新
    return result;
  });
});

function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true,
  });
}

class Observer {
  constructor (value) {
    this.value = value
    if (Array.isArray(value)) { 
      // 拦截数组 value 原型方法
      if (hasProto) {
        value.__proto__ = arrayMethods
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 侦测数组元素变化
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
  // 侦测数组中的每一项
  observeArray(items) {
    for (let i = 0, len = items.length; i < len; i++) {
        observe(items[i])
    }
  }
}
```

observeArray仅仅只做了对新加数据的observe

## provide inject

provide 和 inject 绑定并不是可响应的。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的属性还是可响应的

问题：无法追溯在哪改变了状态的特性，用的时候要比较小心。
使用场景: 使用它进行编写组件

### provide

1. provide传递**值类型**     
2. provide传递**对象类型**
3. provide传递**响应式类型值**   

    - 变成非响应式

4. provide传递**响应式类型对象** 

    - 对象变成非响应式，里面的值是响应式     

5. provide传递**响应式类型和函数** 
   
    - 通过里面的函数改变值，继续向下传递响应式 
    > 如果传递对象类型，这种方式比较推荐，但是会让provide所在组件的update函数方法又臭又长，因为所有的遍历改值处理都在这进行了
    > 如果传递对象类型，在子组件改变了响应性，会变的数据流不可追溯，这也是官方推荐使用vuex的原因

6. provide传递**computed**
  
    - 响应式的