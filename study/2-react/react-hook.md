# react hooks

## 官方

### useSyncExternalStore

用于将状态管理库触发的更新以同步的方式执行。用于订阅外部源

为了解决tearing（视图撕裂）而出的钩子。
造成tearing的原因是 -- 外部状态(状态管理库维护的状态) 与 React内部状态的同步时机出问题。[并发渲染问题](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)。

useSyncExternalStore 的参数包括：

- store: 同步存储库对象。该对象应该暴露 getState 和 dispatch 两个方法，分别用于获取当前状态和派发状态更新；
- selector: 状态选择器函数，用于从存储库中获取所需的状态值；
- actions: 状态更新器对象，各属性为更新状态的 action creator 函数；
- isEqual: 可选的自定义比较函数，用于比较状态是否变化，如果未提供，则使用默认的比较逻辑。

useSyncExternalStore 返回一个数组，其中包含两个元素：

- 经过 selector 处理后的当前状态值；
- dispatch 方法，用于派发状态更新操作。

#### redux8兼容了useSyncExternalStore这个api

reconcile 过程变为不可中断的

#### 使用useSyncExternalStore代替useEffect

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

### useDeferredValue

useDeferredValue 可以让我们延迟渲染不紧急的部分。

类似于防抖但没有固定的延迟时间，延迟的渲染会在紧急的部分先出现在浏览器屏幕以后才开始，并且可中断不会阻塞用户输入

### useTransition()

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


## 自定义

## useEvent

> 它接收一个回调函数handler作为参数，提供给你一个稳定的函数（始终只有一个引用）并且调用时都是用的你传入的最新的参数...args——比如前面案例中的text，始终都是最新的、正确的、恰当的
>

```javascript

  function useEvent(handler) {
    const handleRef = useRef(null)

    useLayoutEffect(() => {
      handleRef.current = handler
    })

    return useCallback((...args) => {
      const fn = handleRef.current
      return fn(...args)
    },[])
  }
```
