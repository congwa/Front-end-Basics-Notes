# webpack热更新缓慢问题分析

网上一搜这个问题，基本都是培训机构让学生背诵的小白文，实际问题没有分析。在读了”范文杰“大佬的webpack原理文章后，还是百思不得其解。这里开一个坑。

## 传统的优化方式

- 缓存
  - cache-loader: 在一些性能开销较大的 loader 之前添加 cache-loader，以便将结果缓存到磁盘里
  - HardSourceWebpackPlugin 为模块提供中间缓存，缓存默认存放的路径是 node_modules/.cache/hard-source，配置了 HardSourceWebpackPlugin 之后，首次构建时间并没有太大的变化，但是第二次开始，构建时间将会大大的加快
- 多进程
  - thread-loader 放置在其它 loader 之前，那么放置在这个 loader 之后的 loader 就会在一个单独的 worker 池中运行。这样做的好处是把原本需要串行执行的任务并行执行
  - HappyPack 可利用多进程对文件进行打包, 将任务分解给多个子进程去并行执行，子进程处理完后，再把结果发送给主进程，达到并行打包的效果、HappyPack 并不是所有的 loader 都支持, 比如 vue-loader 就不支持
- 寻址优化
  - 对于寻址优化，总体而言提升并不是很大, 它的核心即在于，合理设置 loader 的 exclude 和 include 属性
  - 通过配置 loader 的 exclude 选项，告诉对应的 loader 可以忽略某个目录
  - 通过配置 loader 的 include 选项，告诉 loader 只需要处理指定的目录，loader 处理的文件越少，执行速度就会更快

- 分模块构建
  Webpack 在收集依赖时会去分析代码中的 require（import 会被 bebel 编译成 require） 语句，然后递归的去收集依赖进行打包构建


- dynamic-import-node 模块是什么？
- 为什么页面路由比较多，热更新就会慢？ 所谓的路由懒加载是否能解决问题？


**Webpack 的热更新会以当前修改的文件为入口重新 build 打包，所有涉及到的依赖也都会被重新加载一次**

**Vite 实现热更新的方式与 Webpack 大同小异，也通过创建 WebSocket 建立浏览器与服务器建立通信，通过监听文件的改变向客户端发出消息，客户端对应不同的文件进行不同的操作的更新。**

**Vite 通过 chokidar 来监听文件系统的变更，只用对发生变更的模块重新加载，只需要精确的使相关模块与其临近的 HMR 边界连接失效即可，这样 HMR 更新速度就不会因为应用体积的增加而变慢而 Webpack 还要经历一次打包构建。所以 HMR 场景下，Vite 表现也要好于 Webpack**

**通过不同的消息触发一些事件。做到浏览器端的即时热模块更换（热更新）**

TODO: webpack热更新缓慢问题分析



## 参考资料

[coco大佬的-前端构建效率优化之路](https://zhuanlan.zhihu.com/p/548881329)