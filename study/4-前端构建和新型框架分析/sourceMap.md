# sourcemap

## sourcemap是什么

是一个以 .map 为后缀的文件
.map 文件里面的内容以 json 形式存储了 源代码 打包转换后的位置信息

- version：版本号，目前 sourcemap 标准的版本为 3
- file：指打包构建后的 文件名，即 bundle 文件名
- sources：指当前这个 bundle 文件所包含的所有 源码文件，因为存在分包等优化策略，一个 bundle 文件可能会包含 多个源码文件 的内容
- sourcesContent：指上述 sources 中每个 源码文件 所对应的源码内容字符
- names：指在代码在经历 混淆压缩 之前的 变量名，这个变量名包含 导入模块名、常用方法名
- mappings：直接进行翻译就是 映射 的意思，即根据以上信息实现的源码代码位置和构建产物之间的一一映射关系
- sourceRoot：指源码目录

sourcemap包含源代码与构建产物之间的映射关系。 使运行时代码和开发时代码有相同的信息提示。

## 开发代码和运行时代码

开发时代码 到 运行时代码
- 代码压缩 - 为了减小运行时代码的体积，会将源代码中的 换行符、无意义空格 等进行删除，使得代码紧凑在一起
- 代码混淆 - 实际上是指将源代码转换成一种功能上等价，但是难于阅读和理解的形式，例如开发时代码中定义的 "见名知意" 的 函数名、模块名、变量名 等转换为类似 "a、b、c、..." 等无意义的名字，使得即使运行时代码被人获取，也难以猜测其作用
- 代码分块 -实际上是指将源代码转换成一种功能上等价，但是难于阅读和理解的形式，例如开发时代码中定义的 "见名知意" 的 函数名、模块名、变量名 等转换为类似 "a、b、c、..." 等无意义的名字，使得即使运行时代码被人获取，也难以猜测其作用

在现代前端构建工具（webpack、vite 等）中都支持将多个源代码文件合并成一个 bundle 文件，目的就是减少 http 请求数量，以实现优化效果

## 产出sourcemap文件

### [vite](https://cn.vitejs.dev/config/build-options.html#build-sourcemap)

vite构建工具有build.sourcemap配置

- boolean: true | false  false是默认值 当设置为 true 时，就会生成单独的 .map 文件，并且在对应的 bundle 文件中通过 注释 来指明对应的 .map 文件，
- inline sourcemap作为一个data URI法甲在文件中
- hidden  与true类似，只是bundle文件中的注释不背保留

### webpack

配置devtool配置
- none 默认值
- eval -  速度很快，不生成.map文件，运行代码 映射开发代码 只需要提供对应的原文件地址在注释中，缺点就是映射少，因为安全问题不推荐使用
- source-map - 单独生成.map文件 包含行列等信息  缺点比较慢 
- cheap  - cheap只映射源代码的行信息，不产生列信息，不包含loader的sourcemap  速度比较快。 不生成loader的信息，一个文件经过多次loader处理，所以最后的信息可能不准确。
- module  - 包含loader
- inline - 就是会将原本生成的 .map 文件的内容作为 DataURL（base64 形式） 嵌入 bundle 文件中，不单独生成 .map 文件
- hidden - 会生成单独的 .map 文件，但是相比于 source-map 的形式，其会在对应的 bundle 文件中隐藏 sourceMappingURL 的路径
- nosources - 在 source-map 生成的 .map 文件中的 sourceContent 存储的是源码内容,nosources在路径确定的情况下，省略掉sourceContent部分

生产推荐： hidden-nosources-source-map  nosources-source-map source-map


## sourcemap编码原理

可以通过 BASE64 VLQ CODEC这个网站了解具体的映射关系.
[https://www.murzwin.com/base64vlq.html](https://www.murzwin.com/base64vlq.html)

在 .map 文件中有 mappings 字段,mappings 以 Base64 VLQ 编码形式存储了映射到源代码 行、列 等相关信息


### 为什么使用 Base64 VLQ 编码？
>减小文件体积
源代码通常都是很庞大的，单纯使用 数字 表示 行信息 和 列信息 会使得整个 .map 文件体积变大，而 Base64 VLQ 是一种 压缩数字 内容的编码方式，因此可以用来减少文件体积。

mappings 的内容主要由三部分组成：

- 英文串
运行时代码所在的列，通常源代码经压缩后只有 1行，因此不需要存储行信息，只需要存储列信息
对应 sources 字段下标，即对应哪个源文件
开发时代码的第几行
开发时代码的第几列
对应 names 字段下标，即对应哪个变量名
每段英文串表示 运行时代码 和 开发时代码 位置关联的 base64VLQ 编码内容
每段英文串拥由 5 部分组成：
- 逗号 ,
用于分隔一行代码中的内容或位置，例如 "var a = 1;console.log(a);" 相当于 "var, a, =, 1, console, log"
- 分号 ;
表示 运行时代码 的行信息，用来定位是编译后代码的第几行，如果启用代码压缩那么就不会有 分号，因为代码会被压缩在一行上

{
  "version": 3,
  "file": "main.js",
  "mappings": "AAAAA,QAAQC,IAAI",
  "sources": ["webpack://vue3-wp5/./src/main.js"],
  "sourcesContent": ["console.log(1);\n"],
  "names": ["console", "log"],
  "sourceRoot": ""
}

对  "mappings": "AAAAA,QAAQC,IAAI"分析，发现每个分号中的第一串英文 是用来表示代码的 第几行、第几列 的绝对位置外，后面的都是相对于之前的位置来做 加减法 的

## 使sourcemap生效

sourcemap生效依赖浏览器、sentry或者手动映射

### 浏览器

浏览器中基本上会默认启用 sourcemap 映射功能，即只要对应的 bundle 文件中有 sourceMappingURL 或 sourceURL 等指向的注释内容即可
[chrome](/study/imgs/%E5%BC%80%E5%90%AFsourcemap.png)

### sentry中开启sourcemap，有接入 sourcemap 的错误信息在 sentry 中也无法进行快速定位

[sentry中开启sourcemap,上传文档](https://docs.sentry.io/platforms/javascript/guides/vue/sourcemaps/uploading/webpack/)

### 手动映射可用于生产上sourceMap定位

[source-map库](https://www.npmjs.com/package/source-map)

```js
 // 新建一个sourcemap.js文件
 const { SourceMapConsumer } = require('source-map')
 const fs = require('fs')
 
 // 传入此文件的app.dde017e5.js.map源文件
 const rawSourceMap = fs.readFileSync('./dist/js/app.dde017e5.js.map', 'utf-8')

 // 填入错误信息
 originalPositionFor('app.dde017e5.js:1:11871')

 function originalPositionFor(errInfo) {
   const [budleName, line, column] = errInfo.split(':')

   SourceMapConsumer.with(rawSourceMap, null, (consumer) => {
  
     const originalPosition = consumer.originalPositionFor({
       line: parseInt(line),
       column: parseInt(column),
     })

    // 输出源文件信息
     console.log('bundle name = ', budleName)
     console.log('original position = ', originalPosition)
  })
```

