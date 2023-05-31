# webpack

[范文杰webpack系列文章](https://zhuanlan.zhihu.com/p/425076452)

## 流程

> compile、make、build、seal、emit
> 
- compile: 将参数初始化为compiler，初始化完成插件生命周期， 调用run方法
- make: 分析入口文件，创建为一个个的compilation实例
- build: 生成ast，调用loader
- seal: 对模块进行封装，生成chunk
- emit: 输出文件，处理模版 

> 插件的钩子始终在整个生命周期中

## 模块 module

## 联邦模块

### 联邦模块 - 特点

- 每个应用块都是一个独立的构建，这些构建都将编译成容器
- 容器可以被其他应用或者其他容器应用
- 一个被引用得容器或称为remote，引用者被称为host，remote暴露模块给host，host则可以使用这些暴露的模块，这些模块被称为remote模块

### Module Federation -- 功能

- 应用间组件互用--  exposes暴露组件
- host 应用和 remote 应用组件的依赖共享-- shared:{}形成sharedScope 共享作用域-- 内部包含可共享的依赖

### 注意事项

- webpack和vite用联邦模块能互相分享各自的组件吗
  > 不能。 (目前理解不了 "vite打包出来的chunk，浏览器请求完无法直接解析" 这句话， 猜测是 <script type='moudle" /> 无法兼容吧 或者就是 包含大量的es6的代码，没有type="module")
  >vite能引用webpack分享的组件，但webpack不能引用vite分享的组件，vite之间能互相引用。
  >  原因：vite打包出来的chunk，浏览器请求完无法直接解析，而联邦模块说到底就是通过浏览器请求这份chunk，然后解析。
  >  解决办法：​
  >
  >  1. 使用webpack打包vite项目。
  >  2. 使用插件，浏览器请求完这个chunk后，通过插件去解析。

- 在使用 Module Federation 时，Host、Remote 必须同时配置 shared，且一致
- module federation 是否可以做到与技术栈无关
  > module federation 在初始化 shareScope 时，会比较 host 应用和 remote 应用之间共享依赖的版本，将 shareScope 中共享依赖的版本更新为较高版本。在加载共享依赖时，如果发现实际需要的版本和 shareScope 中共享依赖的版本不一致时，会根据 share 配置项的不同做相应处理

- 共享依赖的版本控制
  > module federation 在初始化 shareScope 时，会比较 host 应用和 remote 应用之间共享依赖的版本，将 shareScope 中共享依赖的版本更新为较高版本。在加载共享依赖时，如果发现实际需要的版本和 shareScope 中共享依赖的版本不一致时，会根据 share 配置项的不同做相应处理:
  - 如果配置 singleton 为 ture，实际使用 shareScope 中的共享依赖，控制台会打印版本不一致警告
  - 如果配置 singleton 为 ture，且 strictVersion 为 ture，即需要保证版本必须一致，会抛出异常
  - 如果配置 singleton 为 false，那么应用不会使用 shareScope 中的共享依赖，而是加载应用自己的依赖
  > 综上，如果 host 应用和 remote 应用共享依赖的版本可以兼容，可将 singleton 配置为 ture；如果共享依赖版本不兼容，需要将 singleton 配置为 false
- 多个应用(超过 2 个) 是否可共用一个 shareScope ？

> 假设有这么一个场景， 三个应用 - app1、app2、app3， app2 是 app1 的 remote 应用， app3 是 app2 的 remote 应用， 那么他们是否可共用一个 shareScope ？ 使用 module federation 功能以后，所有建立联系的应用，共用一个 shareScope。

## 分包 chunk

而 Chunk 则是输出产物的基本组织单位，在生成阶段 webpack 按规则将 entry 及其它 Module 插入 Chunk 中，之后再由 SplitChunksPlugin 插件根据优化规则与 ChunkGraph 对 Chunk 做一系列的变化、拆解、合并操作，重新组织成一批性能(可能)更高的 Chunks 。运行完毕之后 webpack 继续将 chunk 一一写入物理文件中，完成编译工作

著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
Module 主要作用在 webpack 编译过程的前半段，解决原始资源"如何读"的问题；而 Chunk 对象则主要作用在编译的后半段，解决编译产物"如何写"的问题，两者合作搭建起 webpack 搭建主流程

### 默认分包规则

到了生成(seal) 阶段，webpack 会根据模块依赖图的内容组织分包 —— Chunk 对象，默认的分包规则有：

- 同一个 entry 下触达到的模块组织成一个 chunk
- 异步模块单独组织为一个 chunk
- entry.runtime 单独组织成一个 chunk （Webpack 5 之后还能根据 entry.runtime 配置单独打包运行时代码）

  ```javascript
    // runtime示例
    module.exports = {
      entry: {
        index: { import: "./src/index", runtime: "solid-runtime" },
      }
    };
  ```

  支撑特性的运行时代码(基于 Dependency 子类)，例如
  - 需要 __webpack_require__.f、__webpack_require__.r 等功能实现最起码的模块化支持(模块化动态支持代码)
  - 如果用到动态加载特性，则需要写入 __webpack_require__.e 函数 (动态加载代码)
  - 如果用到 Module Federation 特性，则需要写入 __webpack_require__.o 函数 (联邦模块支持代码)

*默认分包规则最大的问题是无法解决模块重复*，如果多个 chunk 同时包含同一个 module，那么这个 module 会被不受限制地重复打包进这些 chunk。比如假设我们有两个入口 main/index 同时依赖了同一个模块

### SplitChunksPlugin分包规则

## 懒加载

## 按需引入

> 参考 tree-shaking优化 - 对组件库引用优化一文

## css在一个文件和在多个文件

- css样式抽离 MiniCssExtractPlugin  css-minimizer-webpack-plugin(css文件压缩)

## tree-shaking优化

### 对组件库引用优化

- babel-plugin-import-fix类似的插件减少副作用
  
>原理: 引入的时候执行静态语句分析，转换成无副作用的写法

```javascript
  // 转换前
  import {Button} from 'antd'
  // 转换后
  import Button from 'antd/button'
  import 'antd/button/style'
```

- 使用sideEffects对当前组件标记

> 虽然 webpack 可以找到 单个组件 对应的入口模块，然后不打包其它组件(Button，Message)等，其它组件虽然没被打包，但是它们产生的副作用的代码却被保留下来了，所以有个 hack 的方法就是通过引入 babel-plugin-import 将模块路径进行替换

### css tree-shaking

- webpack-css-treeshaking-plugin

> 原理：使用Postcss进行静态语句ast分析，找出匹配不到的选择器语句，进行优化

### bundle文件去重

分包的插件的使用

### sideEffects参数

>确定当前包里的模块不包含副作用，然后将发布到 npm 里的包标注为 sideEffects: false ，我们就能为使用方提供更好的打包体验。原理是 webpack 能将标记为 side-effects-free 的包由 import {a} from xx 转换为 import {a} from 'xx/a'，从而自动修剪掉不必要的 import，作用同 babel-plugin-import。
查看一些组件库的源码，会发现他们的package.json里面有sideEffects参数。一般作用与*/es/index.js模块下

## 文件hash

> hash是在输出文件时配置的,格式是filename: "[name].[chunkhash:8][ext]",[xx] 格式是webpack提供的占位符, :8是生成hash的长度

- hash
- chunkhash
- contenthash

|  占位符   | 解释  |
|  ----  | ----  |
| ext  | 文件后缀名 |
| name  | 文件名 |
| path  | 文件相对路径 |
| folder  | 文件所在文件夹 |
| hash  | 每次构建生成的唯一 hash 值 |
| chunkhash  | 根据 chunk 生成 hash 值 |
| contenthash  | 根据文件内容生成hash 值 |

### 资源预加载

webpack v4.6.0+ 增加了对预获取和预加载的支持,使用方式也比较简单,在import引入动态资源时使用webpack的魔法注释

```javascript

  // 单个目标
  import(
    /* webpackChunkName: "my-chunk-name" */ // 资源打包后的文件chunkname
    /* webpackPrefetch: true */ // 开启prefetch预获取
    /* webpackPreload: true */ // 开启preload预获取
    './module'
  );

```

### 资源懒加载

- react lazy配合import()
- vue ?? 
  
### 打包时候生成gzip

- compression-webpack-plugin 插件的使用

### sourcemap

devtool的命名规则为 ^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$
|  关键字   | 描述  |
|  ----  | ----  |
| inline  | 代码内通过 dataUrl 形式引入 SourceMap |
| hidden  | 生成 SourceMap 文件,但不使用 |
| eval  | eval(...) 形式执行代码,通过 dataUrl 形式引入 SourceMap |
| nosources  | 不生成 SourceMap |
| cheap  | 只需要定位到行信息,不需要列信息 |
| module  | 展示源代码中的错误位置 |

开发环境推荐：eval-cheap-module-source-map

- 本地开发首次打包慢点没关系,因为 eval 缓存的原因,  热更新会很快
- 开发中,我们每行代码不会写的太长,只需要定位到行就行,所以加上 cheap
- 我们希望能够找到源代码的错误,而不是打包后的,所以需要加上 module

```javascript
  // webpack.dev.js
  module.exports = {
    // ...
    devtool: 'eval-cheap-module-source-map'
  }
```

### 持久化存储缓存

#### webpack4

- babel-loader: babel-loader缓存解决js的解析结果
- cache-loader : cache-loader缓存css等资源的解析结果
- hard-source-webpack-plugin: 配置好缓存后第二次打包,通过对文件做哈希对比来验证文件前后是否一致,如果一致则采用上一次的缓存,可以极大地节省时间

#### webpack5

新增了持久化缓存、改进缓存算法等优化,通过配置 webpack 持久化缓存,来缓存生成的 webpack 模块和 chunk,改善下一次打包的构建速度,可提速 90% 左右

```javascript
  // webpack.base.js
  // ...
  module.exports = {
    // ...
    cache: {
      type: 'filesystem', // 使用文件缓存
    },
  }
```

缓存的存储位置在node_modules/.cache/webpack,里面又区分了development和production缓存

### 开启多线程loader

webpack的loader默认在单线程执行,现代电脑一般都有多核cpu,可以借助多核cpu开启多线程loader解析,可以极大地提升loader解析的速度,thread-loader就是用来开启多进程解析loader的

```javascript
  // webpack.base.js
  module.exports = {
    // ...
    module: {
      rules: [
        {
          test: /.(ts|tsx)$/,
          use: ['thread-loader', 'babel-loader']
        }
      ]
    }
  }

```

### 配置alias别名

配置修改完成后,在项目中使用 @/xxx.xx,就会指向项目中src/xxx.xx,在js/ts文件和css文件中都可以用

```javascript
  module.export = {
    // ...
    resolve: {
      // ...
      alias: {
        '@': path.join(__dirname, '../src')
      }
    }
  }
  // tsconfig.json
  {
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  }
}
```


### babel预设处理js兼容

- babel-loader: 使用 babel 加载最新js代码并将其转换为 ES5（上面已经安装过）
- @babel/corer: babel 编译的核心包
- @babel/preset-env: babel 编译的预设,可以转换目前最新的js标准语法
- core-js: 使用低版本js语法模拟高版本的库,也就是垫片

```javascript
  // webpack.base.js
  module.exports = {
    // ...
    module: {
      rules: [
        {
          test: /.(ts|tsx)$/,
          use: {
            loader: 'babel-loader',
            options: {
              // 执行顺序由右往左,所以先处理ts,再处理jsx,最后再试一下babel转换为低版本语法
              presets: [
                [
                  "@babel/preset-env",
                  {
                    // 设置兼容目标浏览器版本,这里可以不写,babel-loader会自动寻找上面配置好的文件.browserslistrc
                    // "targets": {
                    //  "chrome": 35,
                    //  "ie": 9
                    // },
                    "useBuiltIns": "usage", // 根据配置的浏览器兼容,以及代码中使用到的api进行引入polyfill按需添加
                    "corejs": 3, // 配置使用core-js低版本
                    }
                  ],
                '@babel/preset-react',
                '@babel/preset-typescript'
              ]
            }
          }
        }
      ]
    }
  }

```

### 处理图片文件

#### 处理图片文件 - webpack4

webpack4使用file-loader和url-loader来处理
##### url-loader 
url-loader 是一个基于 file-loader 的 webpack 加载器，可以将文件转换成 Data URL，然后将其嵌入到打包后的 JavaScript 代码中。

具体来说，url-loader 在加载指定的资源时，会根据指定的大小阈值和 MIME 类型，将小于阈值的文件转换为 Data URL 格式，大于阈值的文件则使用 file-loader 将其复制到输出目录，并返回其位置的 URL。这样做的好处是，将小文件转换为 Data URL 可以避免额外的请求，提高页面的加载速度；而对于大文件，则使用常规的 URL 引用方式。

在 URL 转换过程中，url-loader 还可以配置一些参数，比如：

- limit：指定文件大小阈值，小于该阈值的文件将被转换为 Data URL，默认为 2048 字节。
- mimetype：指定 MIME 类型，用于设置 Data URL 中的 Content-Type 头信息。
- fallback：指定当文件超出大小阈值时要使用的 loader，比如 file-loader。

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192, // 文件大小阈值为 8 KB
              mimetype: 'image/png' // 设置 MIME 类型
            }
          }
        ]
      }
    ]
  }
};
// 使用 url-loader 加载了所有后缀为 .png、.jpg 或 .gif 的图片文件。其中，指定了大小阈值为 8 KB，超过该阈值的文件将会被转换成 URL 引用的方式。同时，为了更好地利用浏览器缓存，可以指定不同的 MIME 类型来区分不同的图片类型。
```

#### 处理图片文件 - webpack5

采用自带的asset-module来处理

```javascript
  module.exports = {
  module: {
    rules: [
      // ...
      {
        test:/.(png|jpg|jpeg|gif|svg)$/, // 匹配图片文件
        type: "asset", // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          }
        },
        generator:{ 
          filename:'static/images/[name][ext]', // 文件输出目录和命名
        },
      },
    ]
  }
}
```

### 处理css3前缀兼容

- postcss-loader：处理css时自动加前缀
- autoprefixer：决定添加哪些浏览器前缀到css中

```javascript

  module.exports = {
    // ...
    module: { 
      rules: [
        // ...
        {
          test: /.(css|less)$/, //匹配 css和less 文件
          use: [
            'style-loader',
            'css-loader',
            // 新增
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: ['autoprefixer']
                }
              }
            },
            'less-loader'
          ]
        }
      ]
    },
    // ...
  }
```


### innerGraph

optimization.innerGraph 告知 webpack 是否对未使用的导出内容，实施内部图形分析(graph analysis)
相对于webpack4, webpack5在生产模式下是默认启用的，它可以对模块中的标志进行分析，找出导出和引用之间的依赖关系
但是webpack非常奇怪的一点是，引入三方库的代码不太一样，如下面的例子

```javascript
  // 非常奇怪的是，这里当做活代码引入了整个库
  import 'element-plus'

   // 非常奇怪的是，这里当做活代码引入了整个库
  import {Button} from 'vant'
```

