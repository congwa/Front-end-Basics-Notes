## WeakMap

它通过保持对其键的"弱"引用来实现这一点，因此，如果这些对象键中的任何一个不再具有其他地方绑定的引用，则它有资格进行垃圾回收。因此，当不再需要该键时，**整个条目将自动从 WeakMap 中删除**，从而清除更多内存。它也适用于DOM节点。


观察的引用被垃圾回收时触发回调的例子

注意：[FinalizationRegistry 对象可以让你在对象被垃圾回收时请求一个回调](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)

```html

<ul>
  <li id="item1">first</li>
  <li id="item2">second</li>
  <li id="item3">third</li>
</ul>

```

把这些项目放入 WeakMap 中，并将 item2 注册为注册表监视的对象

之后将其删除，每当它被垃圾回收时，回调将被触发，我们将能够看到 WeakMap 如何发生变化

但是...垃圾收集是不可预测的，也没有官方的方法来触发它，因此为了测试，我们将定期生成一堆对象并将它们保存在内存中

```js
(async () => {
  // 创建一个 WeakMap，将每个列表项节点作为键，将其 ID 作为值存储在键的属性上。
  const listMap = new WeakMap();
  document.querySelectorAll('li').forEach((node) => {
  listMap.set(node, node.id);
  });

  // FinalizationRegistry 对象可以让你在对象被垃圾回收时请求一个回调
  // 此处创建 FinalizationRegistry 并注册要监视的节点元素及其关联的 WeakMap
  const registry = new FinalizationRegistry((heldValue) => {
  // 垃圾回收发生了！
  console.log('After collection:', heldValue);
  });
  registry.register(document.getElementById('item2'), listMap);

  // 打印当前存储在 WeakMap 中的内容
  console.log('Before collection:', listMap);

  // 移除节点，释放引用
  document.getElementById('item2').remove();

  // 定期创建大量对象，触发垃圾回收
  const objs = [];
  while (true) {
    for (let i = 0; i < 100; i++) {
      objs.push(...new Array(100));
    }
    // 让程序进入休眠状态 10 毫秒，以便其他任务有机会运行。这样循环会一直持续下去，每次创建大量的对象和休眠，从而不断触发 JavaScript 引擎的垃圾回收机制。
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
})();
```

## 结论

刚开始,WeakMap 如预期的那样包含三个项

在DOM中删除第二项并进行垃圾回收之后，就出现了不同

![WeakMap](/study/imgs/WeakMap%E7%BB%93%E8%AE%BA.png)


由于节点引用在DOM中不再存在，整个条目已从 WeakMap 中删除，从而释放了更多的内存。


这是一个很 nice 功能，有助于使环境的内存更加整洁