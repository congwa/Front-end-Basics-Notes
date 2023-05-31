# react18的[一些改进](https://react.dev/blog/2022/03/29/react-v18#gradually-adopting-concurrent-features)

react18支持并发模式，在使用新功能的时候自动开启

## Concurrent 模式

通过使用 useTransition、useDeferredValue，更新对应的 reconcile 过程变为可中断，不再会因为长时间占用主线程而阻塞渲染进程，使得页面的交互过程可以更加流畅。
在我们使用诸如 redux、mobx 等第三方状态库时，如果开启了 Concurrent 模式，那么就有可能会出现状态不一致的情形，给用户带来困扰。 tearing（视图撕裂）问题
React18 提供了一个新的 hook - useSyncExternalStore，来帮助我们解决此类问题

## [自动批处理](https://github.com/reactwg/react-18/discussions/21) - 更少渲染的自动批处理

```js
// Before: only React events were batched.
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React will render twice, once for each state update (no batching)
}, 1000);

// After: updates inside of timeouts, promises,
// native event handlers or any other event are batched.
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React will only re-render once at the end (that's batching!)
}, 1000);

```

## 扩展fetch以提供自动请求重复数据删除

TODO: 做了哪些事情
## use函数

> [Suspense for data fetching](https://17.reactjs.org/docs/concurrent-mode-suspense.html) react17中的概念，在18中没有了但是在useSWR中有具体实现


React 团队建议，同样是获取并展示数据的场景，服务端组件应该使用 [Async Component](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)，而客户端组件可以选用的新 Hook——[use](https://zhuanlan.zhihu.com/p/614722970)。


使用use 分为两步，第一步构造 Promise，第二步把结果传递给 use

第一步和第二步没有必要放在一起调用，可以把第一步放到状态管理库里，也可以把第二步放到控制流里。

当提前调用第一步，而需要展示的时候再调用第二步的时候，就是"提前请求"，React 团队认为这能够极大地提升用户体验，减少用户等待时间。

当 Promise 改变时，use 会在其 resolve 后 rerender 组件，因此要求开发者使用 useMemo 等形式缓存 Promise 或其返回值，这就是 React 团队希望的，鼓励开发者进行"缓存"。

注意： **use 位于的那个函数必须是 React 组件**

1. 和Suspense配合使用
  
  ```jsx

  function LoadingErrorWrapper({ children }) {
    return <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  }

  function Note({id}) {
    // return new promise when id changes
    const fetchNotePromise = useMemo(() => fetchNote(id), [id]);
    const note = use(fetchNotePromise);
    return (
      <div>
        <h1>{note.title}</h1>
        <section>{note.body}</section>
      </div>
  );

  // 然后使用 LoadingErrorWrapper 包裹 Node
  // ....
  ```

  当 id 改变时，重新执行 fetchNode 这个功能。 类似于useSWR的Suspense for data fetching实现
2. 在控制流中调用 - 可以在控制流中调用，也就是 if、switch、for 等表达式

  ```jsx

  function Note({id, shouldIncludeAuthor}) {
    // return new promise when id changes
    const fetchNotePromise = useMemo(() => fetchNote(id), [id]);
    const note = use(fetchNotePromise);
    let byline = null;
    if ( shouldIncludeAuthor ) {
      const author = use(fetchNoteAuthor(note.authorId))
      byline = <h2>{author.displayName}</h2>;
    }
    return (
      <div>
        <h1>{note.title}</h1>
        {byline}
        <section>{note.body}</section>
      </div>
  );
  ```

在[next13中的使用,use client包裹后，还想实现类似server components的类似结果](./next13.md)






## suspense[文档](https://react.dev/reference/react/Suspense#providing-a-fallback-for-server-errors-and-server-only-content)

suspense 和 lazy 和 管道流共同实现选择性注水的结果

next13在此技术上做出了server components的设计

TODO: 官网的各种使用方式

TODO: 错误上报、错误恢复、防止 Loading 闪烁等一系列功能

### 配合swr的使用 -- 不需要必须在react18，在react17也可以，其实就是类似react18 的use的语法
> [swr](https://zhuanlan.zhihu.com/p/93824106)允许依赖于其他请求的数据，且可以确保最大程度的并行avoiding waterfalls
> 其原理是通过约定key为一个函数进行try{}处理，并巧妙的结合React的UI = f(data)模型来触发请求，以此最大程度的并行。

```jsx
// 父组件使用 Suspense包裹子组件

// 子组件
export default url => {
  return useSWR(url, fetcher, { suspense: true });
};

```


## flushSync

想要让 setState 变为同步，我们可以使用 flushSync 方法


```js

// react18中，就想让setState它为同步【可以，但不要在生产中去用，不建议】
// setState它就是同步的
flushSync(() => {
  this.setState(state => ({ count: state.count + 1 }))
})
```

## useSyncExternalStore[文档](https://react.dev/reference/react/useSyncExternalStore)

用于将状态管理库触发的更新以同步的方式执行。用于订阅外部源

为了解决tearing（视图撕裂）而出的钩子。
造成tearing的原因是 -- 外部状态(状态管理库维护的状态) 与 React内部状态的同步时机出问题。[并发渲染问题](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)。

useSyncExternalStore 的参数包括：

- subscribe: 一个接受单个callback参数并将其订阅到store的函数。当store发生变化时，它应该调用提供的callback. 这将导致组件重新渲染。该subscribe函数应返回一个清理订阅的函数
- getSnapshot: 返回组件所需的存储中数据快照的函数。虽然store没有改变，但重复调用getSnapshot必须返回相同的值。如果 store 发生变化并且返回值不同（与 相比Object.is），React 会重新渲染组件
- getServerSnapshot: 可选 getServerSnapshot，返回存储中数据的初始快照的函数。它将仅在服务器渲染期间和客户端上服务器渲染内容的混合期间使用。服务器快照在客户端和服务器之间必须是相同的，并且通常被序列化并从服务器传递到客户端。如果省略此参数，则在服务器上渲染组件将引发错误

useSyncExternalStore 它返回存储中数据的快照

### 订阅浏览器状态

```jsx
// 当订阅到
function getSnapshot() {
  return navigator.onLine;
}

// 订阅副作用回调， callback作为外部数据源同步回调
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getServerSnapshot() {
  return true; // Always show "Online" for server-generated HTML
}

// 功能getServerSnapshot类似于getSnapshot，但它只在两种情况下运行：
// 它在生成 HTML 时在服务器上运行。
// 它在hydration期间在客户端上运行，即当 React 获取服务器 HTML 并使其交互时。

const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

// 个人理解：订阅callback触发的时候，去调用getSnapshot，通过Object.is对比获取的值是否相等，如果不相等，进行render

```





### redux8兼容了useSyncExternalStore这个api

reconcile 过程变为不可中断的

### 使用useSyncExternalStore代替useEffect

```jsx
// 使用useSyncExternalStore同步外部数据
const Store = () => {
  const isConnected = useSyncExternalStore(
    storeApi.subscribe,
    () => storeApi.getStatus() === 'connected',
    true
  )
}

// 使用useEffect同步外部数据
const Store = () => {
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    const sub = storeApi.subscribe(({ status }) => {
      setIsConnected(status === 'connected')
    })

    return () => {
      sub.unsubscribe()
    }
  }, [])

  // ...
}

```


## useDeferredValue

useDeferredValue 可以让我们延迟渲染不紧急的部分。

类似于防抖但没有固定的延迟时间，延迟的渲染会在紧急的部分先出现在浏览器屏幕以后才开始，并且可中断不会阻塞用户输入


## useTransition() startTransition  useTransition [文档](https://react.dev/reference/react/useTransition)

过渡是 React 中的一个新概念，用于区分紧急和非紧急更新。
- 紧急更新反映了直接交互，例如键入、单击、按下等。
- 转换更新将 UI 从一个视图转换到另一个视图。

Transitions 将选择并发渲染，这允许中断更新。如果内容重新挂起，转换还会告诉 React 在后台渲染转换内容的同时继续显示当前内容（有关更多信息，请参阅[Suspense RFC](https://github.com/reactjs/rfcs/blob/main/text/0213-suspense-in-react-18.md) ）。

```jsx
function App() {
  const [isPending, startTransition] = useTransition();
  const [filterTerm, setFilterTerm] = useState('');
  
  const filteredProducts = filterProducts(filterTerm);
  
  function updateFilterHandler(event) {
    // 改变列表的时候包裹， React 给这个状态更新代码一个较低的优先级 耗时的时候这么干，可以保证其它的高优先级不被卡住
    startTransition(() => {
      setFilterTerm(event.target.value);
    });
  }
 
  return (
    <div id="app">
      <input type="text" onChange={updateFilterHandler} />
      <ProductList products={filteredProducts} />
    </div>
  );
}

```

注意：不应该开始使用 startTransition 来结束所有状态更新。仅当您的用户界面较慢时才使用它，尤其是在旧设备上，或者在您没有其他解决方案可使用的情况下。这是因为它占用了额外的性能。

### isPending 是做什么的？

```jsx
function App() {
  const [isPending, startTransition] = useTransition();
  const [filterTerm, setFilterTerm] = useState('');
  
  const filteredProducts = filterProducts(filterTerm);
  
  function updateFilterHandler(event) {
    // 改变列表的时候包裹， React 给这个状态更新代码一个较低的优先级 耗时的时候这么干，可以保证其它的高优先级不被卡住
    startTransition(() => {
      setFilterTerm(event.target.value);
    });
  }
 
  return (
    <div id="app">
      <input type="text" onChange={updateFilterHandler} />
      {isPending && <p style={{color: 'white'}}>Updating list..</p>}
      <ProductList products={filteredProducts} />
    </div>
  );
}

```

isPending : 告诉当前是否有一些状态更新仍处于待处理状态（React 尚未执行，并且优先级较低。您可以使用 isPending 更新 UI 以在等待主要状态时显示一些后备内容更新完成

### useTransition 和 Spusense的配合使用

TODO: useTransition 和 Spusense的配合使用
