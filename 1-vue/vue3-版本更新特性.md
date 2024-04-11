
# 记录vue3.2以上的新版本特性

## Reactivity Transform vue3.4正式废弃

目前vue的版本在3.2，此功能已经收集在了[vue-macros](https://vue-macros.sxzz.moe/zh-CN/features/reactivity-transform.html),在上面有使用教程

[目前官网也有一个介绍](https://cn.vuejs.org/guide/extras/reactivity-transform.html#refs-vs-reactive-variables),在官网上说

- 这个语法糖曾经是一个实验性功能，且已经被废弃，[废弃原因](https://github.com/vuejs/rfcs/discussions/369#discussioncomment-5059028),总结尤雨溪的话就是说，对新手不友好，学习曲线高，心智曲线高。

- 在3.3以下版本目前在官方core中支持，如果启用这个语法糖
  
  - vite中显示的启用
    - 需要 @vitejs/plugin-vue@>=2.0.0
    - 应用于 SFC 和 js(x)/ts(x) 文件。在执行转换之前，会对文件进行快速的使用检查，因此不使用宏的文件不会有性能损失。
    - 注意 reactivityTransform 现在是一个插件的顶层选项，而不再是位于 script.refSugar 之中了，因为它不仅仅只对 SFC 起效。
    > SFC: SFC 是 Single-File Component 的缩写，指的是 ".vue" 文件格式，是 Vue.js 开发中常用的组件化开发方式。
    
    ```js
    // vite.config.js
    export default {
      plugins: [
        vue({
          reactivityTransform: true
        })
      ]
    }

    ```

  - vue-cli中显示的启用
  
    ```js
    // vue.config.js
    module.exports = {
      chainWebpack: (config) => {
        config.module
          .rule('vue')
          .use('vue-loader')
          .tap((options) => {
            return {
              ...options,
              reactivityTransform: true
            }
          })
      }
    }

    ```

  - 仅用 webpack + vue-loader
    - 目前仅对SFC起效
    - 需要vue-loader@>=17.0.0

  ```js
    // webpack.config.js
    module.exports = {
      module: {
        rules: [
          {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
              reactivityTransform: true
            }
          }
        ]
      }
    }

  ```

- 在3.4之后的使用

```bash
npm i -D @vue-macros/reactivity-transform
```

```js
// vite.config.ts
import ReactivityTransform from '@vue-macros/reactivity-transform/vite'

export default defineConfig({
  plugins: [ReactivityTransform()],
})
```

[TypeScript 支持](https://vue-macros.sxzz.moe/zh-CN/features/reactivity-transform.html)

```ts
// tsconfig.json
{
  "compilerOptions": {
    // ...
    "types": ["@vue-macros/reactivity-transform/macros-global" /* ... */]
  }
}
```