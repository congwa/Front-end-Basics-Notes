# react18的一些改进

## 选择性注水

suspense 和 lazy 和 管道流共同实现选择性注水的结果

next13在此技术上做出了server components的设计

## 扩展fetch以提供自动请求重复数据删除

TODO: 做了哪些事情
## use函数

TODO: 在nest13中的使用

## Concurrent 模式

通过使用 useTransition、useDeferredValue，更新对应的 reconcile 过程变为可中断，不再会因为长时间占用主线程而阻塞渲染进程，使得页面的交互过程可以更加流畅。
在我们使用诸如 redux、mobx 等第三方状态库时，如果开启了 Concurrent 模式，那么就有可能会出现状态不一致的情形，给用户带来困扰。 tearing（视图撕裂）问题
React18 提供了一个新的 hook - useSyncExternalStore，来帮助我们解决此类问题

## flushSync

想要让 setState 变为同步，我们可以使用 flushSync 方法


```js

// react18中，就想让setState它为同步【可以，但不要在生产中去用，不建议】
// setState它就是同步的
flushSync(() => {
  this.setState(state => ({ count: state.count + 1 }))
})
```

## suspense结合异步组件实现条件渲染


TODO: 需要找到详细的示例