# vue的jsx中支持指令

[vue-macros新出了一个功能，jsxDirective，目前处于实验性。](https://vue-macros.dev/zh-CN/features/jsx-directive.html)

配置方式

```json
// tsconfig.json
{
  "vueCompilerOptions": {
    "target": 3,
    "plugins": [
      "@vue-macros/volar/jsx-directive",
      // ...更多功能
    ],
  },
}
```
