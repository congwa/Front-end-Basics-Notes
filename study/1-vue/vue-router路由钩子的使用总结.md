# vue-router路由钩子的使用总结

TODO: vue-router路由钩子的使用总结


## beforeEach

路由未进入前，也未跳转

一般情况下在这里进行鉴权

```js
router.beforeEach((to, from) => {
  // 而不是去检查每条路由记录
  // to.matched.some(record => record.meta.requiresAuth)
  if (to.meta.requiresAuth && !auth.isLoggedIn()) {
    // 此路由需要授权，请检查是否已登录
    // 如果没有，则重定向到登录页面
    return {
      path: '/login',
      // 保存我们所在的位置，以便以后再来
      query: { redirect: to.fullPath },
    }
  }
})
```

--- 

## afterEach

进入：路由已经进入，访问不了dom

离开：路由已经销毁，访问不了dom

---
## beforeResolve

**同时在所有组件内守卫和异步路由组件被解析之后**，解析守卫就被正确调用

和beforeEach类似，只是执行时机不同

是获取数据或执行任何其他操作（如果用户无法进入页面时你希望避免执行的操作）的理想位置。


---
## beforeEnter

路由独享守卫，只在进入路由时候触发，不会在params、query或hash改变时候触发

可以给beforeEnter传递一个函数数组，在进入路由前做一些事情

```js
// 改变url的解析
function removeQueryParams(to) {
  if (Object.keys(to.query).length)
    return { path: to.path, query: {}, hash: to.hash }
}

// 改变url的解析
function removeHash(to) {
  if (to.hash) return { path: to.path, query: to.query, hash: '' }
}

const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: [removeQueryParams, removeHash],
  },
  {
    path: '/about',
    component: UserDetails,
    beforeEnter: [removeQueryParams],
  },
]


```

---
## beforeRouteEnter

组件内的守卫

- 在渲染该组件的对应路由被验证前调用
- 不能获取组件实例 `this` ！
- 因为当守卫执行时，组件实例还没被创建！

---
## beforeRouteUpdate

组件内的守卫

mounted之后触发，此时还页面还没有渲染，虚拟dom已经建立完成

- 在当前路由改变，但是该组件被复用时调用
- 举例来说，对于一个带有动态参数的路径 `/users/:id`，在 `/users/1` 和 `/users/2` 之间跳转的时候，
- 由于会渲染同样的 `UserDetails` 组件，因此组件实例会被复用。而这个钩子就会在这个情况下被调用。
- 因为在这种情况发生的时候，组件已经挂载好了，导航守卫可以访问组件实例 `this`

---
## beforeRouteLeave

组件内的守卫

- 在导航离开渲染该组件的对应路由时调用
- 与 `beforeRouteUpdate` 一样，它可以访问组件实例 `this`

---
## 执行时机

由首页进入user页面：
global beforeEach > router beforeEnter > component beforeRouteEnter > global beforeResolve > global afterEach > mounted

由user回到首页：
component beforeRouteLeave => global beforeEach => global beforeResolve => global afterEach

![路由守卫](https://img2018.cnblogs.com/blog/1384940/201809/1384940-20180905105407928-594613295.jpg)
![生命周期](https://images2018.cnblogs.com/blog/1384940/201809/1384940-20180904114306984-898239871.jpg)


## 路由过渡动画

### 官网文档上的过渡

想要在你的路径组件上使用转场，并对导航进行动画处理，你需要使用 v-slot API：

```html
<router-view v-slot="{ Component }">
  <transition name="fade">
    <component :is="Component" />
  </transition>
</router-view>
```

```html
<!-- 单个路由的过渡 -->
<router-view v-slot="{ Component, route }">
  <!-- 使用任何自定义过渡和回退到 `fade` -->
  <transition :name="route.meta.transition || 'fade'">
    <component :is="Component" />
  </transition>
</router-view>
```

```html
<!-- 基于路由的动态过渡  -->
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transition">
    <component :is="Component" />
  </transition>
</router-view>
```

```html
<!-- 强制在复用的视图之间进行过渡 -->
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

---

### 基于gsap的路由过渡动画

```vue
<template>
  <transition
    @before-enter="beforeEnter"
    @before-leave="beforeLeave"
  >
    <router-view />
  </transition>
</template>

<script>
import { gsap } from 'gsap'

export default {
  methods: {
    beforeEnter(el) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1 })
    },
    beforeLeave(el, done) {
      gsap.to(el, { opacity: 0, onComplete: done })
    }
  }
}
</script>
```

<transition> 标签，它会监听路由切换并触发过渡动画

将 beforeEnter 和 beforeLeave 方法分别绑定到该标签的 before-enter 和 before-leave 事件中，它们会在路由组件进入或离开时分别被调用。


---
## 实验性功能 - 类型化路由 对路由的动态化提示

这个实验性功能通过 Vite/webpack/Rollup 插件启用。

