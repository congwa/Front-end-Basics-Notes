# tailwindcss


## jit
Tailwind CSS 2.1.0 版本引入了 Just-in-Time (JIT) 编译模式
在编译 CSS 文件时能够实现即时地根据 HTML 中使用的 CSS 类名生成对应的 CSS 样式，无需预生成一个大型的 CSS 文件

```js
module.exports = {
  mode: 'jit', // 开启 JIT 模式
  purge: [],
  theme: {},
  variants: {},
  plugins: [],
}
```

### jit实现原理

1. 解析 HTML，JIT 模式需要分析 HTML 中使用了哪些 Tailwind 的类名，以便仅生成与这些类名相关的 CSS 样式。在解析 HTML 的过程中，Tailwind 使用 PostCSS 解析器和一个自定义的插件@tailwindcss/jit来提取类名

2. 根据需要生成 CSS 样式。这一过程会根据类名生成对应的 CSS 样式，并将这些样式转化为字符串形式，以便后面的步骤进行处理。由于 JIT 模式只生成相关的 CSS 样式，因此可以避免生成未使用的样式，减小 CSS 文件的体积

3. 将生成的 CSS 样式插入到最终的 CSS 文件中。这一步骤需要将生成的 CSS 样式字符串插入到原有的 CSS 文件中，从而得到最终的 CSS 文件。在 JIT 模式下，Tailwind 使用 PostCSS 插件来完成这一步骤，从而保证生成的 CSS 文件与预处理器语法和配置选项保持一致

总结: 解析 HTML 中使用的 Tailwind 类名 , 按需生成相关的 CSS 样式, 并将其插入到最终的 CSS 文件中。这一模式可以大大减小 CSS 文件的大小，加快编译速度，并使得 Tailwind 更加易于使用和维护.

- @tailwindcss/jit 使用 postcss-selector-parser 插件来解析 HTML 中的类名，并创建一组对应的 CSS 规则。这些规则被存储在一个称为 "Layer" 的数据结构中
- @tailwindcss/jit 会根据 Layer 中存储的规则，自动生成对应类名的 CSS 样式。这些样式将被添加到输出的 CSS 文件中，以供网页使用。
- 为了提高性能和减少文件大小，@tailwindcss/jit 对生成的 CSS 进行了一些优化处理。例如，它会移除未使用的样式，压缩 CSS 文件大小等等。


### postcss-selector-parser使用示例

```js
<!-- index.html -->
<html>
  <head>
    <title>PostCSS Selector Parser Example</title>
    <link rel="stylesheet" href="main.css">
  </head>
  <body>
    <h1 class="title">Hello, World!</h1>
    <p class="paragraph">This is a paragraph.</p>
    <button class="btn btn-primary">Click me!</button>
  </body>
</html>



```

```js
// main.js
const fs = require('fs');
const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');

// 读取 HTML 文件内容
const html = fs.readFileSync('index.html', 'utf-8');

// 解析 HTML 文件中的类名
const parsedSelector = selectorParser((selectors) => {
  selectors.walkClasses((classNode) => {
    console.log(`Found class: ${classNode.value}`);
  });
});

const root = parsedSelector.astSync(html);

// 处理类名并生成对应的样式
const processedCss = postcss()
  .use((css) => {
    css.walkRules((rule) => {
      rule.selector = parsedSelector.process(rule.selector);
    });
  })
  .process(fs.readFileSync('main.css', 'utf-8'))
  .toString();

// 输出处理后的 CSS 样式
console.log(processedCss);

```





