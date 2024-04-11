# skyline - beta 

(这个起名可真的是霸道，由此可见小程序团队的信心)

 AppService 和 WebView 的双线程模型，基于 WebView 和原生控件混合渲染的方式，小程序优化扩展了 Web 的基础能力,但由于其繁重的历史包袱和复杂的渲染流程，使得 Web 在移动端的表现与原生应用仍有一定差距。
 所以在 WebView 渲染之外新增了一个渲染引擎 Skyline,其使用更精简高效的渲染管线，并带来诸多增强特性，让 Skyline 拥有更接近原生渲染的性能体验

## 架构

小程序基于 WebView 环境下时，WebView 的 JS 逻辑、DOM 树创建、CSS 解析、样式计算、Layout、Paint (Composite) 都发生在同一线程，在 WebView 上执行过多的 JS 逻辑可能阻塞渲染，导致界面卡顿。小程序同时考虑了性能与安全，采用了目前称为「双线程模型」的架构。

在 Skyline 环境下

Skyline 创建了一条渲染线程来负责 Layout, Composite 和 Paint 等渲染任务，并在 AppService 中划出一个独立的上下文，来运行之前 WebView 承担的 JS 逻辑、DOM 树创建等逻辑，这种新的架构相比原有的 WebView 架构，有以下特点：

- 界面更不容易被逻辑阻塞，进一步减少卡顿
- 无需为每个页面新建一个 JS 引擎实例（WebView），减少了内存、时间开销
- 框架可以在页面之间共享更多的资源，进一步减少运行时内存、时间开销
- 框架的代码之间无需再通过 JSBridge 进行数据交换，减少了大量通信时间开销

![skyline](/study/imgs/%E5%B0%8F%E7%A8%8B%E5%BA%8F-skyline.png)


从介绍来看，和flutter的方案非常类似

## 特性

TODO: skyline特性
## Worklet机制

TODO: Worklet机制
