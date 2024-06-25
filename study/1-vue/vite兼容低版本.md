# vite兼容低版本

按照鱿鱼须(尤雨溪)的说法

![vite](/study/imgs/vite-target.jpg)

```js
// 兼容低版本答案 总结
// 总结完了就是  targets: ['chrome 67'],
legacy({
      targets: ['chrome 67'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
```
