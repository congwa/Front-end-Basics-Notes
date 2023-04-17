# react hooks

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
