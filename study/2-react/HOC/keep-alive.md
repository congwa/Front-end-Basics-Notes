# keep-alive

```jsx
import React from 'react';

function withKeepAlive(Component) {
  class KeepAlive extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        cached: null,
      };
    }

    componentDidMount() {
      if (!this.state.cached) {
        this.setState({
          cached: React.cloneElement(this.props.children),
        });
      }
    }

    componentDidUpdate(prevProps) {
      if (prevProps.location.pathname !== this.props.location.pathname) {
        this.setState({
          cached: React.cloneElement(this.props.children),
        });
      }
    }

    render() {
      return this.state.cached;
    }
  }

  return (props) => {
    return (
      <KeepAlive {...props}>
        <Component {...props} />
      </KeepAlive>
    );
  };
}

export default withKeepAlive;

```

这个实现非常简单：

1. 首先，我们创建一个高阶组件 (HOC) withKeepAlive，它接受一个组件作为参数。
2. 然后，我们创建一个 KeepAlive 组件作为 withKeepAlive 的返回值。
3. KeepAlive 组件包装 Component 组件。
4. KeepAlive 组件会缓存 Component 组件，并在切换路由时，重新渲染缓存组件。

使用：

```jsx
import withKeepAlive from './withKeepAlive';

function MyComponent() {
// ...
}

export default withKeepAlive(MyComponent);
```

## 插件

[https://www.npmjs.com/package/react-keep-alive](https://www.npmjs.com/package/react-keep-alive)
React.createPortal API 完成任意组件的keep-alive组件包裹

[Activity](https://juejin.cn/post/7312304122535149604)

## 总结

- router下自己记录位置再还原
- 组件级别的可以使用Suspense为核心的[插件](https://github.com/kylvia/Activity) [插件2](https://github.com/IVLIU/react-offscreen)

