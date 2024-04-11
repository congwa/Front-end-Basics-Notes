# webpack

[范文杰webpack系列文章](https://zhuanlan.zhihu.com/p/425076452)

## 流程

![webpack流程](/study/imgs/webpack%E6%B5%81%E7%A8%8B.webp)

**compiler**
- entryOption:webpack开始读取配置文件的Entries,递归遍历所有的入口文件.
- run: 程序即将进入构建环节
- compile: 程序即将创建compilation实例对象
- make: compilation实例启动对代码的编译和构建
- emit: 所有打包生成的文件内容已经在内存中按照相应的数据结构处理完毕,下一步会将文件内容输出到文件系统,emit钩子会在生成文件之前执行(通常想操作打包后的文件可以在emit阶段编写plugin实现).
- done: 编译后的文件已经输出到目标目录,整体代码的构建工作结束时触发

compilation实例主要负责代码的编译和构建.每进行一次代码的编译(例如日常开发时按ctrl + s保存修改后的代码),都会重新生成一个compilation实例负责本次的构建任务.

**compilation**

compiler执行到make和emit之间时,compilation对象便出场了,它会依次执行它定义的一系列钩子函数,像代码的编译、依赖分析、优化、封装正是在这个阶段完成的.

- buildModule: 在模块构建开始之前触发,这个钩子下可以用来修改模块的参数
- seal: 构建工作完成了,compilation对象停止接收新的模块时触发
- optimize: 优化阶段开始时触发


compiler进入make阶段后,compilation实例被创建出来,它会先触发buildModule阶段定义的钩子,此时compilation实例依次进入每一个入口文件(entry),加载相应的loader对代码编译.

代码编译完成后,再将编译好的文件内容调用 acorn 解析生成AST语法树,按照此方法继续递归、重复执行该过程.

所有模块和和依赖分析完成后,compilation进入seal 阶段,对每个chunk进行整理,接下来进入optimize阶段,开启代码的优化和封装.

webpack基于插件的架构体系.我们编写的plugin就是在上面这些不同的时间节点里绑定一个事件监听函数,等到webpack执行到那里便触发函数.

发布-订阅的事件机制,webpack内部借助了`Tapable`第三方库实现了事件的绑定和触发.

> 插件的钩子始终在整个生命周期中

### loader基础

loader本质上是一个函数,参数content是一段字符串,存储着文件的内容,最后将loader函数导出就可以提供给webpack使用了.

```js
// loader函数
module.exports = function (content){
  console.log(this.query); // { name: 'hello' }
  return content;
}

// loader使用this.callback方法
module.exports = function (content){
  this.callback(null,content);  
}

//webpack.config.js
//webpack配置
module.exports = {
   module:{
    rules:[
      {
        test:/\.js$/, // 正则筛选.js结尾的文件
        use:[
          {
            loader:path.resolve(__dirname,"./error-loader.js"),
            options:{
              name:"hello"
            }
          }
        ]
      }
    ]
  }
}
```

项目一旦启动打包,webpack检测到.js文件,它就会把文件的代码字符串传递给error-loader.js导出的loader函数执行.

我们上面编写的loader函数并没有对代码字符串content做任何操作,直接返回了结果.那么我们自定义loader的目的就是为了对content源代码做各种数据操作,再将操作完的结果返回.

比如我们可以使用正则表达式将content中所有的console.log语句全部去掉,那么最后我们生成的打包文件里就不会包含console.log.

另外我们在开发一些功能复杂的loader时,可以接收配置文件传入的参数.例如上面webpack.config.js中给error-loader传入了一个对象{name:"hello"},那么在自定义的loader函数中可以通过this.query获取到参数.

loader函数除了直接使用return将content返回之外,还可以使用this.callback(代码如下)达到相同的效果.

this.callback能传递以下四个参数.第三个参数和第四个参数可以不填.this.callback传递的参数会发送给下一个loader函数接受,每一个loader函数形成了流水线上的一道道工序,最终将代码处理成期待的结果.

- 第一个参数为错误信息,没有出错可以填null
- 第二个参数为content,也是要进行数据操作的目标
- 第三个参数为sourceMap,选填项.它将打包后的代码与源码链接起来,方便开发者调试,一般通过babel生成.
- 第四个参数为meta额外信息,选填项.

以上介绍的内容都是使用同步的方式编写,万一**loader函数里面需要做一些异步的操作**就要采用如下方式

this.async()调用后返回一个callback函数,等到异步操作完,就可以继续使用callback将content返回.

```js
//上一个loader可能会传递sourceMap和meta过来,没穿就为空
module.exports = function (content,sourceMap,meta){
  const callback = this.async();
  setTimeout(()=>{ // 模拟异步操作
     callback(null,content);  
  },1000)
}
```

#### 异常捕捉的loader编写

loader函数的第一个参数content,我们可以利用正则表达式修改content.但如果实现的功能比较复杂,正则表达式会变得异常复杂难以开发.

主流的方法是将代码字符串转化对象,我们对对象进行数据操作,再将操作完的对象转化为字符串返回.

这就可以**借助babel相关的工具帮助我们实现这一目的**,代码如下.(如果对babel不熟悉的同学可以忽略这一小节,以后有机会单独对babel展开分析)

- @babel/parser模块首先将源代码content转化成ast树,再通过@babel/traverse遍历ast树,寻找async函数的节点.
- async函数的节点被寻找到后,通过@babel/types模块给async函数添加try,catch表达式包裹,再替换原来的旧节点.
- 最后使用@babel/generator模块将操作后的ast树转化成目标代码返回.

```js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require('@babel/generator').default;
const t = require("@babel/types");

const ErrorLoader =  function (content,sourceMap,meta){
  
  const ast = parser.parse(content); // 将代码转换成为ast树

  traverse(ast,{
    //遍历函数表达式
    FunctionDeclaration(path){ 
        
        //判断当前节点是不是async函数
        const isAsyncFun = t.isFunctionDeclaration(path.node,{async:true});

        if(!isAsyncFun){ // 不是async函数就停止操作
          return ;
        }

        const bodyNode = path.get("body");

        // 是不是大括号表达式
        if(t.isBlockStatement(bodyNode)){

           const FunNode = bodyNode.node.body;

           if(FunNode.length == 0) { // 空函数
             return; 
           }

           if(FunNode.length !== 1 || t.isTryStatement(FunNode[0])){ // 函数内没有被try ... catch 包裹
            
            // 异常捕捉的代码
            const code = `    
                 console.log(error);
            `;

            //使用try、catch包裹,生成目标节点
            const resultAst = t.tryStatement(
              bodyNode.node,
              t.catchClause(t.identifier("error"),
              t.blockStatement(parser.parse(code).program.body) 
              )
            )
            
            //将转化后的节点替换原来的节点
            bodyNode.replaceWithMultiple([resultAst]);
           
          }

        }
     }
  })
  
  //将目标ast转化成代码
  this.callback(null,generate(ast).code,sourceMap,meta);

}

module.exports = ErrorLoader;
```

大佬实现的参考代码地址：[https://github.com/kaygod/custome_loader](https://github.com/kaygod/custome_loader)

大佬的文章地址、包含vue-loader、file-loader、css-loader等loader的源码解析:[https://zhuanlan.zhihu.com/p/397174187](https://zhuanlan.zhihu.com/p/397174187)

## plugin基础

plugin(插件)是webpack的支柱功能,webpack整体的程序架构也是基于插件系统之上搭建的,plugin的目的在于解决loader无法实现的其他功能.

plugin使用方式如下面代码.通常我们需要集成某款plugin时,会先通过npm安装到本地,然后在配置文件(webpack.config.js)的头部引入,在plugins那一栏使用new关键字生成插件的实例注入到webpack.

webpack注入了plugin之后,那么在webpack后续构建的某个时间节点就会触发plugin定义的功能.

狭义上理解,webpack完整的打包构建流程被切割成了流水线上的一道道工序,第一道工序处理完,马上进入第二道工序,依此类推直至完成所有的工序操作.

每一道工序相当于一个生命周期函数,plugin一旦注入到webpack中后,它会在对应的生命周期函数里绑定一个事件函数,当webpack的主程序执行到那个生命周期对应的处理工序时,plugin绑定的事件就会触发.

简而言之,plugin可以在webpack运行到某个时刻帮你做一些事情. plugin会在webpack初始化时,给相应的生命周期函数绑定监听事件,直至webpack执行到对应的那个生命周期函数,plugin绑定的事件就会触发.

不同的plugin定义了不同的功能,比如`clean-webpack-plugin`插件,它会在webpack重新打包前自动清空输出文件夹,它绑定的事件处于webpack生命周期中的emit

再以下面代码使用的插件`HtmlWebpackPlugin`举例,它会在打包结束后根据配置的模板路径自动生成一个html文件,并把打包生成的js路径自动引入到这个html文件中.这样便刨去了单调的人工操作,提高了开发效率.

```js
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 通过 npm 安装
const webpack = require('webpack'); // 访问内置的插件
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /.(js|jsx)$/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }) // 
  ]
};
```

### 自定义插件

plugin本质上是一个对外导出的class，类中包含一个固定方法名apply

apply函数的第一个参数就是compiler,我们编写的插件逻辑就是在apply函数下面进行编写

既然程序中已经获取了compiler参数,理论上我们就可以在compiler的各个钩子函数中绑定监听事件.比如下面代码会在emit阶段绑定一个监听事件.

主程序一旦执行到emit阶段,绑定的回调函数就会触发.通过上面的介绍可知,主程序处于emit阶段时,compilation已经将代码编译构建完了,下一步会将内容输出到文件系统.

此时compilation.assets存放着即将输出到文件系统的内容,如果这时候我们操作compilation.assets数据,势必会影响最终打包的结果


```js
//copyRight.js compilation.assets上新增一个属性名copyright.txt,并定义好了文件内容和长度.
class CopyRightPlugin {
  apply(compiler){
      compiler.hooks.emit.tapAsync("CopyRightPlugin",(compilation,next)=>{
        setTimeout(()=>{ // 模拟ajax获取版权信息
            compilation.assets['copyright.txt'] = {
                source:function(){
                    return "this is my copyright"; // //文件内容
                },
                size:function(){
                    return 20;  // 文件大小
                }
            }
            next();
        },1000)
      })
  }
}
module.exports = CopyRightPlugin;
```

这里需要引起注意,由于程序中使用tapAsync(异步序列)绑定监听事件,那么回调函数的最后一个参数会是next,异步任务执行完成后需要调用next,主程序才能进入到下一个任务队列.

最终打包后的目标文件夹下会多出一个copyright.txt文件,里面存放着字符串this is my copyright.



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

> 参考 tree-shaking优化 - 对组件库引用优化的 hash位置，就在本文

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


## 参考资料

[webpack热更新原理](https://zhuanlan.zhihu.com/p/539415763)
> TODO: 由于 webpack import实现机制问题，会产生一定的副作用。如上面的写法就会导致@/views/下的 所有.vue 文件都会被打包。不管你是否被依赖引用了，会多打包一些可能永远都用不到 js 代码
> webpack参数 --progress --watch --colors --profile 构建进度 实时监测 编译过程中的步骤耗时时间
