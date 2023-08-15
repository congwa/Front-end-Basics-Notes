# ESBuild

## config

具体的配置可以参考官网的 [配置文档](https://esbuild.github.io/api/#build)

## esbuild的三个api

- transform
- build
- service

### transform

`transform/transformSync` 对单个字符串进行操作，不需要访问文件系统。非常适合在没有文件系统的环境中使用或作为另一个工具链的一部分，它提供了两个参数：

```ts
/**
 * str：字符串（必填），指需要转化的代码
 * options：配置项（可选），指转化需要的选项
 */
transformSync(str: string, options?: Config): Result
transform(str: string, options?: Config): Promise<Result>

// 官网地址 https://esbuild.github.io/api/
interface Config {
  define: object # 关键词替换
  format: string # js 输出规范（iife/cjs/esm）
  loader: string | object # transform API 只能使用 string
  minify: boolean # 压缩代码，包含删除空格、重命名变量、修改语法使语法更简练
  # 通过以下方式单独配置，上述功能
  minifyWhitespace: boolean # 删除空格
  minifyIdentifiers: boolean # 重命名变量
  minifySyntax: boolean # 修改语法使语法更简练
  sourcemap: boolean | string
  target: string[] # 设置目标环境，默认是 esnext（使用最新 es 特性）
}

interface Result {
	warnings: string[] # 警告信息
	code: string # 编译后的代码
	map: string # source map
}
```

### build


`Build API`调用对文件系统中的一个或多个文件进行操作。这使得文件可以相互引用，并被编译在一起（需要设置`bundle: true`）

```ts
buildSync(options?: Config): Result
build(options?: Config): Promise<Result>

interface Config {
  bundle: boolean # 将所有源码打包到一起
  entryPoints: string[] | object # 入口文件，通过对象方式可以指定输出后文件名，和 webpack 类似
  outdir: string # 输出文件夹，不能和 outfile 同时使用；多入口文件使用 outdir
  outfile: string # 输出的文件名，，不能和 outdir 同时使用；单入口文件使用 outfile
  outbase: string # 每个入口文件构建到不同目录时使用
  define: object # define = {K: V}  在解析代码的时候用V替换K 
  platform: string # 指定输出环境，默认为 browser 还有一个值是 node，
  format: string # js 输出规范（iife/cjs/esm），如果 platform 为 browser，默认为 iife；如果 platform 为 node，默认为 cjs
  splitting: boolean # 代码分割(当前仅限 esm模式)
  loader: string | object # transform API 只能使用 string
  minify: boolean # 压缩代码，包含删除空格、重命名变量、修改语法使语法更简练
  # 通过以下方式单独配置，上述功能
  minifyWhitespace: boolean # 删除空格
  minifyIdentifiers: boolean # 重命名变量
  minifySyntax: boolean # 修改语法使语法更简练
  sourcemap: boolean | string
  target: string[] # 设置目标环境，默认是 esnext（使用最新 es 特性）
  jsxFactory: string # 指定调用每个jsx元素的函数
  jsxFragment: string # 指定聚合一个子元素列表的函数
  assetNames: string # 静态资源输出的文件名称（默认是名字加上hash）
  chunkNames: string # 代码分割后输出的文件名称
  entryNames: string # 入口文件名称
  treeShaking: string # 默认开启，如果设置 'ignore-annotations'，则忽略 /* @__PURE__ */ 和 package.json 的 sideEffects 属性
  tsconfig: string # 指定 tsconfig 文件
  publicPath: string # 指定静态文件的cdn，比如 https://www.example.com/v1 （对设置loader为file 的静态文件生效）
  write: boolean # 默认 false，对于cli和js API，默认是写入文件系统中，设置为 true 后，写入内存缓冲区
  inject: string[] # 将数组中的文件导入到所有输出文件中
  metafile: boolean # 生成依赖图 
}

interface BuildResult {
  warnings: Message[]
  outputFiles?: OutputFile[] # 只有在 write 为 false 时，才会输出，它是一个 Uint8Array
}
```

```js
require('esbuild').build({
    entryPoints: ['index.js'],
    bundle: true,
    metafile: true,
    format: 'esm',
    outdir: 'dist',
    plugins: [],
}).then(res => {
    console.log(res)
})
```

## esbuild热更新

Estrella 是一个轻量级且多功能的构建工具，基于出色的 esbuild TypeScript 和 JavaScript 编译器

[https://github.com/rsms/estrella](https://github.com/rsms/estrella)
## esbuild插件

插件API属于上面提到的API调用的一部分，插件API允许你将代码注入到构建过程的各个部分。与API的其他部分不同，它不能从命令行中获得。你必须编写JavaScript或Go代码来使用插件API。

> 插件API只能用于Build API，不能用于Transform API
>

[esbuild插件列表](https://github.com/esbuild/community-plugins)

如何写一个插件在参考资料《esbuild使用中有描述》

## esbuild结构

![结构](/study/imgs/esbuild.png)



## 参考文档

- [esbuild使用](https://juejin.cn/post/7043777969051058183)
- [架构篇](https://www.breword.com/evanw-esbuild/architecture)
- [pkg-esbuild](https://pkg.go.dev/github.com/evanw/esbuild/pkg/api)
- [为什么 esbuild 很快？- 官网解答](https://esbuild.github.io/faq/#why-is-esbuild-fast)  捆绑器 原译文 是 Bundler
  - 它是用 Go 编写的并编译为本机代码。大多数其他捆绑器都是用 JavaScript 编写的，但对于 JIT 编译语言来说，命令行应用程序是最糟糕的性能情况。每次运行捆绑器时，JavaScript VM 都会第一次看到捆绑器的代码，而没有任何优化提示。当 esbuild 忙于解析您的 JavaScript 时，node 正忙于解析您的捆绑器的 JavaScript。当节点完成解析您的捆绑程序的代码时，esbuild 可能已经退出，并且您的捆绑程序甚至还没有开始捆绑。
  - 另外，Go 从本质上就是为了并行而设计的，而 JavaScript 则不然。 Go 在线程之间共享内存，而 JavaScript 必须在线程之间序列化数据。 Go 和 JavaScript 都有并行的垃圾收集器，但 Go 的堆在所有线程之间共享，而 JavaScript 的每个 JavaScript 线程都有一个单独的堆。根据我的测试，这似乎将 JavaScript 工作线程可能的并行量减少了一半，大概是因为一半的 CPU 核心正忙于为另一半收集垃圾。
  - 并行性被大量使用。esbuild 内部的算法经过精心设计，可在可能的情况下使所有可用的 CPU 核心完全饱和。大致分为三个阶段：解析、链接和代码生成。解析和代码生成是大部分工作，并且是完全可并行的（链接在很大程度上是本质上的串行任务）。由于所有线程共享内存，因此在捆绑导入相同 JavaScript 库的不同入口点时可以轻松共享工作。大多数现代计算机都有很多核心，因此并行性是一个巨大的胜利。
  - esbuild 中的所有内容都是从头开始编写的。自己编写所有内容而不是使用第三方库有很多性能优势。您可以从一开始就考虑性能，可以确保所有内容都使用一致的数据结构以避免昂贵的转换，并且可以在必要时进行广泛的架构更改。当然，缺点是工作量很大。例如，许多捆绑器使用官方 TypeScript 编译器作为解析器。但它是为了服务于 TypeScript 编译器团队的目标而构建的，他们并没有将性能作为首要任务。他们的代码大量使用了超态对象形状和不必要的动态属性访问（这都是众所周知的 JavaScript 减速带）。即使类型检查被禁用，TypeScript 解析器似乎仍然运行类型检查器。对于 esbuild 的自定义 TypeScript 解析器来说，这些都不是问题。
  - 内存得到有效利用。理想情况下，编译器的输入长度复杂度大多为 O(n)。因此，如果您正在处理大量数据，内存访问速度可能会严重影响性能。您需要对数据进行的处理越少（并且您需要将数据转换成的不同表示形式也越少），编译器的速度就越快。
    - 例如，esbuild 只触及整个 JavaScript AST 3 次：
    - 用于词法分析、解析、范围设置和声明符号的过程
    - 绑定符号、缩小语法、JSX/TS 到 JS 以及 ESNext 到 ES2015 的过程
    - 用于缩小标识符、缩小空白、生成代码和生成源映射的过程
    - 当 AST 数据在 CPU 缓存中仍然很热时，这可以最大限度地重用 AST 数据。其他捆绑器在单独的过程中执行这些步骤，而不是交错执行它们。它们还可以在数据表示之间进行转换，以将多个库粘合在一起（例如，字符串→TS→JS→字符串，然后字符串→JS→旧的JS→字符串，然后字符串→JS→缩小的JS→字符串），这会使用更多内存并减慢速度。
    - Go 的另一个好处是它可以在内存中紧凑地存储内容，这使得它能够使用更少的内存并更多地适应 CPU 缓存。所有对象字段都有类型，并且字段紧密地包装在一起，例如几个布尔标志每个只占用一个字节。 Go 还具有值语义，可以将一个对象直接嵌入到另一个对象中，因此它是“免费”的，无需另一次分配。 JavaScript 不具备这些功能，并且还具有其他缺点，例如 JIT 开销（例如隐藏类槽）和低效表示（例如非整数是用指针进行堆分配的）。