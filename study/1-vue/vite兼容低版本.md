# vite兼容低版本

[查看目标百分比](https://browsersl.ist/#q=%3E0.3%25%2C+chrome+%3E+67)

```js
// 兼容低版本答案 总结
// 总结完了就是  targets: ['chrome 67'],
legacy({
      targets: ['chrome 67'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
```

因为 plugin-legacy内部只包含了core-js相关的polyfills，如果开发者希望添加非corejs的polyfill，可以通过additionalLegacyPolyfills添加

```js
legacy({
    targets: ['chrome > 57', 'edge < 15'],
    additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    renderLegacyChunks:true,
    polyfills:[
        'es.symbol',
        'es.array.filter',
        'es.promise',
        'es.promise.finally',
        'es/map',
        'es/set',
        'es.array.for-each',
        'es.object.define-properties',
        'es.object.define-property',
        'es.object.get-own-property-descriptor',
        'es.object.get-own-property-descriptors',
        'es.object.keys',
        'es.object.to-string',
        'web.dom-collections.for-each',
        'esnext.global-this',
        'esnext.string.match-all'
    ]
})
```
