# [babel](https://babeljs.io/docs/en/presets#what-are-babel-presets)

## 工作原理

-   parseing(解析)
-   transfroming(转化)
-   生成(生成)

[参考图](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3721be091bd6413495b486e917b2e9bb~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp)

## babel 转义分类

-   语法层： let、const、class、箭头函数等，这些需要在**构建**时候进行转译，语法层的转译,(class... 转成 var function...)
-   api 层: Promise、includes、map 等，这些是在全局或者 Object、Array 等原型上新增的方法、它们可以由响应 es5 的方式重新定义。

babel 对这两个分类的转译的做法不一样，需要单独给配置。

-   babel-core: babel 的核心,包含各个核心的 api,供 Babel 插件和打包使用
-   babel-cli: 命令行对 js 代码转换的工具

## 插件（用于处理**语法层**）

Babel 的代码转换是通过将插件（或预设）应用到您的配置文件来启用的

```js
// .babelrc
{
  "parserOpts": {
    "plugins": ["jsx", "flow"]
  }
}
// babel.config.json
{
  "plugins": ["babel-plugin-myPlugin", "@babel/plugin-transform-runtime"]
}

```

## preset 预设

Babel presets 可以充当可共享的 Babel 插件和/或配置集 options

-   @babel/preset-env ：用于编译 ES2015+ 语法,不包含 stage 阶段
-   @babel/preset-typescript： 用于 TypeScript
-   @babel/preset-react： [用于 React](https://babeljs.io/docs/babel-preset-react), 包含了转换 React JSX 语法的插件，并且还可配置一些插件，如@babel/plugin-transform-react-jsx-self 和@babel/plugin-transform-react-jsx-source 等。该预设还启用了@babel/plugin-transform-react-pure-annotations 插件，可以将顶级的 React 方法调用标记为纯函数，以进行 Tree Shaking 优化
-   @babel/preset-flow ：用于 Flow

以上为官方预设足以可见 react 的在国外的地位

-   @vue/babel-preset-app： [@vue/babel-preset-app](https://www.npmjs.com/package/@vue/babel-preset-app)是一个 Babel 预设，用于在 Vue CLI 项目中使用。它的默认设置基于浏览器的目标，自动确定要应用的转换和 polyfills。需要注意的是，该预设仅适用于通过 Vue CLI 创建的项目，并不考虑外部使用情况


#### @babel/preset-env

-   @babel/preset-env： 包含的插件将支持所有最新的 JS 特性（ES2015,ES2016 等，不包含 stage 阶段 ）
-   配置

        ```js
        // .babelrc 或者 babelconfig.js
        {
            "presets": ["@babel/preset-env"]
        }

        ```

    <details> 
        <summary>stage 阶段</summary>
        正在为您搜索：stage 阶段、babel

在 Babel 中， stage 阶段指的是 ECMAScript 的提案阶段。TC39 是一个由 JavaScript 社区组成的技术委员会，负责 JavaScript 语言标准的发展。他们将不同阶段的 ECMAScript 提案分为以下四个 stage（阶段）：

-   Stage 0: “Strawman”（展示阶段）
-   Stage 1: “Proposal”（征求意见阶段）
-   Stage 2: “Draft”（草案阶段）
-   Stage 3: “Candidate”（候选人阶段）
-   Stage 4: “Finished”（正式发布阶段）

Babel 根据阶段的不同，对应地提供了一些插件（如@babel/plugin-proposal-class-properties、@babel/plugin-proposal-decorators），使得开发者可以使用实验性的 ECMAScript 特性，尽早体验和探索未来的语言特性。

[资料来源][https://babeljs.io/docs/en/presets#what-are-babel-presets]

</details>

#### @babel/preset-typescript

babel-plugin-transform-typescript 是 Babel 的一个插件，用于将 TypeScript 代码转换为 JavaScript 代码。这个插件可以帮助开发者在使用 Babel 转译 JavaScript 代码的同时也将 TypeScript 代码转译为 JavaScript 代码。相较于直接使用 TypeScript 编译器（tsc），Babel 可以提供更多的灵活性，例如自定义的插件、支持更多的 JavaScript 版本等。

虽然 tsc 也能将 TypeScript 代码转译为 JavaScript 代码，但它生成的代码会带有类型信息，而且输出的 JavaScript 代码可能只支持最新的 ES6 或 ES5 标准，无法兼容旧版浏览器，需要进行额外的配置。而使用 babel-plugin-transform-typescript 插件则能够将 TypeScript 代码转译为普通的 JavaScript 代码，同时又能使用 Babel 提供的各种功能和特性。

<details> 
    <summary>使用</summary>

1. 安装 `@babel/core`, `@babel/preset-env`, `@babel/cli` 和 `babel-plugin-transform-typescript`，可以通过运行以下命令进行安装：

    ```

    npm install --save-dev @babel/core @babel/preset-env @babel/cli babel-plugin-transform-typescript

    ```

2. 在项目的根目录下创建 `.babelrc` 文件，并添加以下内容：

    ```
    {
      "presets": [
        "@babel/env"
      ],
      "plugins": [
        "transform-typescript"
      ]
    }
    ```

    这样会启用 `@babel/preset-env` 预设和 `babel-plugin-transform-typescript` 插件。你也可以在其他配置文件中使用这些设置。

3. 在你的项目中使用 Babel 命令来转换 TypeScript 文件。例如，在命令行中执行以下命令：

    ```
    npx babel src --out-dir dist --extensions ".ts"
    ```

    这将会把 `src` 目录下的所有 TypeScript 文件转换成 JavaScript 文件，并存储在 `dist` 目录中。

[资料来源：](https://babeljs.io/docs/babel-plugin-transform-typescript)

</details>

####  @vue/babel-preset-app 

使用
```js
npm install --save-dev @vue/babel-preset-app

// 1 .babelrc
{
  "presets": [
    "@vue/app"
  ]
}

// 2 babel.config.js
module.exports = {
  presets: ["@vue/app"]
}

// Vue CLI 默认会自动将 @vue/babel-preset-app 加入到 babel-loader 的配置中,所以一般不需要手动配置 babel-loader
// 如果你需要覆盖默认设置，可以在 vue.config.js 中对 babel-loader 进行配置
module.exports = {
  chainWebpack: config => {
    // 使用 @vue/babel-preset-app 替代原来的 @babel/preset-env
    config.module
      .rule('js')
      .use('babel-loader')
        .loader('babel-loader')
        .tap(options => {
          // 修改已有的选项
          options.presets = ['@vue/app']
          return options
        })
  }
}


```
### 插件和预设**执行顺序**

-   插件在预设之前运行。
-   插件顺序从前到后。
-   预设顺序相反（从最后到第一个）

```js
// 插件
{
  "plugins": ["transform-decorators-legacy", "transform-class-properties"]
}

// 预设
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}

```

## polyfill (用于处理 api 层转译)

polyfill 的中文意思是垫片，顾名思义就是垫平不同浏览器或者不同环境下的差异，让新的内置函数、实例方法等在低版本浏览器中也可以使用。

<details> 
    <summary>使用</summary>

1. 安装

    ```js
        // 这是一个运行时依赖
        npm install --save @babel/polyfill

        // @babel/polyfill 模块包括 core-js 和一个自定义的 regenerator runtime 模块，可以模拟完整的 ES2015+ 环境
    ```

2. 引入

    ```js
    import "@babel/polyfill";
    const p = new Promise((resolve, reject) => {
        resolve(100);
    });
    ```

    ```js
    // 转译结果
    "use strict";

    require("@babel/polyfill");

    var p = new Promise(function (resolve, reject) {
        resolve(100);
    });
    ```

    虽然看起来 Promise 还是没有转译，但是我们引入的 polyfill 中已经包含了对 Promise 的 es5 的定义，所以这时候代码便可以在低版本浏览器中运行了

</details>

### 属性

#### useBuiltIns 属性 -- 主要为了解决不引入所有垫片，包不能太大的问题

-   false：不对 polyfills 做任何操作
-   entry：根据 target 中浏览器版本的支持，将 polyfills 拆分引入，仅引入有浏览器不支持的 polyfill
-   usage：检测代码中 ES6/7/8 等的使用情况，仅仅加载代码中用到的 polyfills

```js
//.babelrc
{
   "presets": [
       ["@babel/preset-env",{
           "useBuiltIns": "usage"
       }]
   ]
}

{
   "presets": [
       ["@babel/preset-env",{
           "useBuiltIns": "usage",
        	 "corejs":3 // 指定corejs的版本
       }]
   ]
}
```

#### @babel/plugin-transform-runtime - 解决代码冗余 @babel/runtime（运行时依赖）- 包含辅助函数

-   解决代码冗余
-   解决全局污染

<details>
    <summary>代码冗余</summary>
    代码冗余是出现在转译语法层时出现的问题。

该插件会开启对 Babel 注入的辅助函数（比如下边的\_classCallCheck）的复用，以节省代码体积

```js
//index.js es6-->class
class Student {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
}

// 转译后
("use strict");

require("core-js/modules/es.function.name");

// _classCallCheck每次使用都会出现，用一次出现一次，造成了代码冗余
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Student = function Student(name, age) {
    _classCallCheck(this, Student);

    this.name = name;
    this.age = age;
};
```

安装@babel/runtime 后

```js
"use strict";

require("core-js/modules/es.function.name");

// 相关的辅助函数是以require的方式引入而不是被直接插入进来的，这样就不会冗余了
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

// 相关的辅助函数是以require的方式引入而不是被直接插入进来的，这样就不会冗余了
var _classCallCheck2 = _interopRequireDefault(
    require("@babel/runtime/helpers/classCallCheck")
);

var Student = function Student(name, age) {
    (0, _classCallCheck2["default"])(this, Student);
    this.name = name;
    this.age = age;
};
```

</details>

<details>
<summary>全局污染</summary>
全局污染是出现在转译api层出现的问题

```js
new Promise(function (resolve, reject) {
    resolve(100);
});

//转译后

"use strict";

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

new Promise(function (resolve, reject) {
  resolve(100);
});
```
preset-env在处理例如Promise这种的api时，只是引入了core-js中的相关的js库，这些库重新定义了Promise，然后将其挂载到了全局。
然会造成全局变量污染，同理其他的例如Array.from等会修改这些全局对象的原型prototype，这也会造成全局对象的污染。

解决方式就是：将core-js交给transform-runtime处理。

```js

{
    "presets": [
        ["@babel/preset-env"]
    ],
    "plugins": [
        ["@babel/plugin-transform-runtime",{ // 配置插件处理， transform-runtime是利用plugin自动识别并替换代码中的新特性，检测到需要哪个就用哪个
            "corejs":3
        }]
    ]
}

```
注意：
1. corejs: 2仅支持全局变量（例如Promise）和静态属性（例如Array.from），corejs: 3还支持实例属性（例如[].includes）
2. useBuiltIns， babel7中已经将其设置为默认值（Babel 7 中的 useBuiltIns 选项的默认值为 false）
    - 在 Babel 6 中，默认情况下需要手动安装和引入 polyfills，以便支持 ES6+ 的 API 和特性
    - 在 Babel 7 中，@babel/preset-env 已经集成了 core-js（支持 ES 新特性的 polyfill 库）的功能，并且默认情况下不会自动添加 polyfills，而是通过使用 useBuiltIns 选项来控制哪些 polyfills 被添加到代码中
    - 如果将 useBuiltIns 设置为 true，则 Babel 会根据你的目标环境进行智能地添加 polyfills，以保证你的代码可以运行，而且不会添加多余的代码。如果你的代码中已经手动引入了某些 polyfills，那么 Babel 不会再次引入这些重复的 polyfills

```js
// 转译结果
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

// 定义了一个_promise["default"] ，这样便不会出现全局变量污染的情况
new _promise["default"](function (resolve, reject) {
  resolve(100);
});
```

**缺点**： 每个特性都会经历检测和替换，随着应用增大，可能会造成转译效率不高 [文档](https://www.babeljs.cn/docs/babel-plugin-transform-runtime#options)

</details>


## TODO

- TODO: target
- TODO: browserList配置
- TODO: esbuild
- TODO: SWC
- TODO: 压缩 css js常用配置
