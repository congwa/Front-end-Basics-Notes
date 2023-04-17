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

## v-model使用computed

[vuex-forms示例](https://vuex.vuejs.org/zh/guide/forms.html)

## props透传原理

### 值类型

>vue中子组件的props收到的数据，在父组件的标签差不多就是在父组件注册了一个watch,当父组件的set触发的的时候，触发watch的回调函数，在回调函数中对子组件中的对应的响应式数据进行更新。

1. 父组件依赖收集：在父组件render函数执行过程中，会访问到这个prop数据。并将父组件的Render Watcher(下面的updateComponent函数)添加到这个prop数据的dep.subs中
2. 子组件初始化： 子组件对所有的Props添加相应监听
3. 父组件改变值，触发父组件的setter，其中一个watcher触发父组件的Render Watch对每个子组件的props的值进行重新赋值，触发子组件的setter监听

### 对象类型

1. 父组件依赖收集：在父组件render函数执行过程中，会访问到这个prop数据。并将父组件的Render Watcher(下面的updateComponent函数)添加到这个prop数据的dep.subs中
2. 子组件初始化：子组件不做处理，直接使用这个已经在父加了响应式监听的object
3. 父组件改变值，触发父组件的setter，子组件依旧相应，但是依赖收集在父组件的deps中

```js

function updateChildComponent (
  vm: Component, // 子组件实例
  propsData: ?Object,
  listeners: ?Object,
  parentVnode: MountedComponentVNode, // 组件 vnode
  renderChildren: ?Array<VNode>
) {
  if (process.env.NODE_ENV !== 'production') {
    // 设置成 true 的目的是，给 props[key] 赋值时，触发 set 方法，不会让 customSetter 函数报错
    isUpdatingChildComponent = true
  }
  // ...

  // 更新 props
  if (propsData && vm.$options.props) {
    toggleObserving(false)
    // 之前的 propsData
    const props = vm._props
    // 子组件定义的 props 的属性集合
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions: any = vm.$options.props // wtf flow?
      // 在这里修改props的值触发 组件更新
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    // keep a copy of raw propsData
    vm.$options.propsData = propsData
  }
  
  // ...

  if (process.env.NODE_ENV !== 'production') {
    // 更新完成后，置为 false
    isUpdatingChildComponent = false
  }
}


```

## 释放依赖

在getter的时候进行收集依赖，那么如何释放依赖呢？

在watcher中有个cleanupDeps方法，进行释放依赖。

### 收集依赖的过程

依赖收集的过程 new watcher -> get() -> defineProperty.get() -> dep.depend() ->  Dep.target.addDep(this) this是当前dep的实例 -> watcher的 newDeps.push(dep); dep.addSub(this) 把watcher放到dep的subs数组里面

### 释放依赖分析

收集依赖的时候，生成一个新的watcher，
watcher的 newDeps.push(dep); 里面收集了当前watcher所关联的所有dep
> 上面这句话挺难理解的。 一个watcher代表一个标签表达式语句template，或者computed，都是可以关联过个watcher的，但是里面用的每个响应式值都是要有dep的，那么每个dep都需要收集这个watcher，这同一个watcher也需要去记录谁收集了这个watcher。

#### 新newDeps的生成，在旧的deps已经存在的情况下

一个watcher对应一个表达式，一个表达式里面可能会有多个响应式变量

在此表达式发生的其中一个set的时候，经过notify触发update函数，加入更新队列，触发更新队列（此时Dep.target = 当前watcher），调用run方法重新渲染页面，接下来就是重新收集依赖。

run方法中调用了get()方法，get()方法中调用getter方法触发字符表达式或者函数（返回新值用于更新页面），字符或者表达式保存了当前使用的响应式变量，通过执行进入收集依赖流程，那么就知道这时候watcher中应该有哪些依赖生成新newDeps, 然后进行新旧deps对比，释放掉不需要的dep，在dep中释放掉这个watcher的引用


#### 调用cleanupDeps的时机

1. 初始化的时候执行字符串或者表达式
2. 某个set触发的时候，进入update流程，最后导致表达式重新执行
   
上面两种情况导致收集依赖，触发defineProperty.get()
当defineProperty.get() 发生调用的时候，总是会去触发。


```js
cleanupDeps() {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }
```
