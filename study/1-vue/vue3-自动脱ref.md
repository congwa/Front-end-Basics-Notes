# vue3-自动脱ref

## toRefs去解决响应式丢失的问题，但是又带来了一个新的问题，如何自动脱ref？

比如我们把一个值用在模板里，我们其实是不需要写.value的,我们假设有这样2句伪代码，如果我们不能实现自动脱ref，那么我们是不是需要在模板中每个变量都写.value,这样显然不对，vue3中也并不需要，我们来看看如何实现

```js
const div = <div>{{a.value}}</div>
const { a }= toRefs(props)

```

所谓自动ref是指，如果访问一个对象的属性，这个对象是ref，则直接返回.value。我们可以通过proxy实现这个功能.

```js
const a = ref(0)
const proxyRef = (obj)=>new Proxy(obj,{
    get(target,key,receiver){
        const value = Reflect.get(target,key,receiver)
        return value.__v_isRef ? value.value : value
    }
})
const a2 = proxyRef(a)
```

proxy大家都应该很熟练了，上面这个段代码应该几分钟就能写好。原理就是我们代理了，ref的访问操作，然后当访问的时候，我们判断一下这个对象是不是ref,这时候就用到了我们之前给ref定义的那个属性了__v_isRef，其实看到这段逻辑我是想到了unref的。

```jsx
const btn = <button onClick="a=2">Test</button>

```

那么我们自然要再代理set方法，方法和上面的get类似，就不再赘述，文章结尾再把全部代码奉上。

其实，在vue3中很多地方都是使用了自动脱钩，比如在创建新的reactive时，当我们把ref传入reative中时，就会自动脱ref，这点好像在之前的代码中没有体现。

```js
const a=ref(0)
const obj = reactive({a})
obj.a // 0
```

这样的设计就是为了方便用户，尽量减少我们写.value时的心智负担。

ref是一个比较简单的结构，我之前以为ref是一套重写的响应系统，但是现在看来,ref是最大限度的复用了reactive，只是增加了一个自动脱ref的方法罢了。

![proxyRef](/study/imgs/proxyRef.png)


## 举例说明

```vue
<script setup>
import { reactive, ref, watch } from 'vue';

defineProps({
  msg: {
    type: String,
    required: true
  }
})


const react = reactive({
  proxyRef: {
    proxyRefB: 'proxyRef b'
  }
})

const rRef = ref({
  rRefC:'rRef c'
})

console.log('react', react)
console.log('rRef', rRef) 

const onClick = () => {
  react.proxyRef = rRef;
  console.log('CLICK react', react)
  console.log('CLICK rRef', rRef) 
}

const onClick2 =  () => {
  rRef.value = 'onClick2';
}

const onClick3 =  () => {
  react.proxyRef = 'onClick3'
}

const onClick4 = () => {
  react.onClick4 = 'onClick4'
}



watch(() => { 
  return react.proxyRef
}, () => {
  alert('watch到了 react.proxyRef')
})
</script>

<template>
  <div class="greetings">
    <div style="margin: 10px; cursor: pointer; background: #fff; color: #000; padding: 30px;" @click="onClick">测试1</div>
    <div style="margin: 10px;cursor: pointer; background: #fff; color: #000; padding: 30px;" @click="onClick2">测试2</div>
    <div style="margin: 10px;cursor: pointer; background: #fff; color: #000; padding: 30px;" @click="onClick3">测试3</div>
    <div style="margin: 10px;cursor: pointer; background: #fff; color: #000; padding: 30px;" @click="onClick4">测试4</div>
    <h1>{{ JSON.stringify(react) }}</h1>
    <div> {{react.proxyRef }}</div>
    <h1>{{ JSON.stringify(rRef) }}</h1>
    <div>{{  react?.proxyRef?.proxyRefB }}</div>
  </div>
</template>
```

如上，我们先点击“测试1“按钮，把 `react.proxyRef` 给重新赋值一个完整的ref对象`rRef`，实际被`proxyRef`包裹，watch重新建立监听，调用watch的函数，react.proxyRef， 这时候触发`proxyRef`的get函数，取出来的rRef.value的值,**`watch`的响应式收集实际收集的是rRef的变化依赖**

**这时候再点击“测试2”，改变了rRef.value的值，那么watch会触发**

如果没有点击”测试2“，在点击”测试1“的基础上点击”测试3“，改变”proxyRef“的值，触发`proxyRef`的set函数，实际改变的是 `rRef.value`的值，触发watch的监听回调。