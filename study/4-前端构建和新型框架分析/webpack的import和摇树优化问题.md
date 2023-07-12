# webpack的import和摇树优化问题


在使用react-vant和umi的时候，发现react-vant打包的时候被全量引入包体中了。这非常不理解。开一个坑详细分析


这里有几个角度

- 由于 webpack import实现机制问题，会产生一定的副作用。如上面的写法就会导致@/views/下的 所有.vue 文件都会被打包。不管你是否被依赖引用了，会多打包一些可能永远都用不到 js 代码
- babel-plugin-import-fix类似的插件减少副作用 

    ```javascript
    // 引入的时候执行静态语句分析，转换成无副作用的写法
    // 转换前
    import {Button} from 'antd'
    // 转换后
    import Button from 'antd/button'
    import 'antd/button/style'
  ```

- 使用sideEffects对当前组件标记
  虽然 webpack 可以找到 单个组件 对应的入口模块，然后不打包其它组件(Button，Message)等，其它组件虽然没被打包，但是它们产生的副作用的代码却被保留下来了，所以有个 hack 的方法就是通过引入 babel-plugin-import 将模块路径进行替换 -- 为什么？



TODO:webpack的import和摇树优化问题