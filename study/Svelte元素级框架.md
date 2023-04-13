# Svelte

作者同时也是Rollup.Reactive的作者, Rich Harris

Svelte是一个重度依赖AOT的元素级框架。

## 先看代码

```html

<h1>{count}</h1>
<script>
  let count = 0;
</script>

```

```js
// 省略部分代码…
function create_fragment(ctx) {
  let h1; 
  return {
    c() {
      h1 = element("h1");
      h1.textContent = `${count}`;
    },
    m(target, anchor) {
      insert(target, h1, anchor);
    },
    d(detaching) {
      if (detaching) detach(h1);
    }
  };
} 
let count = 0; 
class App extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, null, create_fragment, safe_not_equal, {});
  }
} 

function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}

function detach(node) {
  node.parentNode.removeChild(node);
}
export default App;
```

create_fragment:他是编译器根据App的UI编译而成,提供该组件与浏览器交互的方法

- c，代表create，用于根据模版内容，创建对应DOM Element。例子中创建H1对应DOM Element：
- m，代表mount，用于将c创建的DOM Element插入页面，完成组件首次渲染。例子中会将H1插入页面：insert方法会调用target.insertBefore：
- d，代表detach，用于将组件对应DOM Element从页面中移除。例子中会移除H1： detach方法会调用parentNode.removeChild：

### SvelteComponent

每个组件对应一个继承自SvelteComponent的class，实例化时会调用init方法完成组件初始化，create_fragment会在init中调用：



## 可改变demo

```html
<h1 on:click="{update}">{count}</h1> 
<script>
  let count = 0;
  function update() {
    count++;
  }
</script>
```

```js
// 从module顶层的声明语句
let count = 0; 
// 变为instance方法
function instance($$self, $$props, $$invalidate) {
  let count = 0; 
  function update() {
    $$invalidate(0, count++, count);
  } 
  return [count, update];
}
```



编译产物出现了instance，
count从module顶层的声明语句变为instance方法内的变量。之所以产生如此变化是因为App可以实例化多个，所以每个App需要有独立的上下文保存count

Svelte编译器会追踪<script>内所有变量声明，

一旦发现，就会将该变量提取到instance中，instance执行后的返回值就是组件对应ctx。

同时，如果执行如上操作的语句可以通**过模版被引用**，则该语句会**被$$invalidate包裹**。

### 标记dirty

```js

// 源代码中的update
function update() {
  count++;
} 
// 编译后instance中的update
function update() {
  $$invalidate(0, count++, count);
}

```

```js

c() {
  h1 = element("h1");
  // count的值变为从ctx中获取
  t = text( ctx[0]);
},
m(target, anchor) {
  insert(target, h1, anchor);
  append(h1, t);
  // 事件绑定
  dispose = listen(h1, "click",  ctx[1]);
},
p(ctx, [dirty]) {
  // set_data会更新t保存的文本节点
  if (dirty &  1) set_data(t,  ctx[0]);
},
d(detaching) {
  if (detaching) detach(h1);
  // 事件解绑
  dispose();
}

```

- 标记App UI中所有和count相关的部分将会发生变化
- 调度更新： 在microtask中调度本次更新，所有在同一个Macrotask中执行的$$invalidate都会在该macrotask执行完成后被统一执行，最终会执行组件fragment中的p方法

完整流程

- 点击H1触发回调函数update
- update内调用$$invalidate，更新ctx中的count，标记count为dirty，调度更新
- 执行p方法，进入dirty的项（即count）对应if语句，执行更新对应DOM Element的方法

总结： 无虚拟dom，通过极限的AOT语法分析&编译的形式，把每个响应式变量做成和dom直接关联的对象进行控制。

优势：

- 在代码较少的时候，打包体积更有优势。打包前体积在120kb的时候，包体更小，代表着需要加载的js文件更小。但是在打包前超过120kb不如react的包体积更小了。 小项目更有优势
- 无虚拟dom，直接把响应式变量和ui关联的方式进行细粒度更新，整体的更新路径更短。意味减少无用计算，性能更好些。 但是虚拟dom方案经过优化，和这种方案随有差距，但是实测10000行表格数据的时候，差距不是非常明显。