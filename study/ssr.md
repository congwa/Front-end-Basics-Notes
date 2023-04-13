# 服务端渲染

## 下发html和state

对于 SSR 来说，数据请求的操作放在了服务端做。当请求到数据后，转化为组件所需的状态（ State），然后把 状态 + 模版（JSX） 转化为 HTML 返回给浏览器端

## 数据脱水dehydrate

生成html片段的过程

## 同构

一套代码需要在服务端执行一遍、在客户端也执行一遍
比如 JSX，在服务端执行就是调用 renderToString(jsx)去生成 html string，在客户端执行就是为生成的 html 绑定事件

## 数据注水hydrate

TODO：猜测触发渲染钩子后，才会进行注水操作

客户端“浸泡”的过程实际上是重新创建了组件树，将新生的水（state、props、context等）注入其中，并将鲜活的组件树塞进服务端渲染的干瘪躯壳里
所以在 SSR 模式下，客户端有一段时间是无法正常交互的，注水完成之后才能彻底复活（单向数据流和交互行为都恢复正常）

## 预渲染

对可以预渲染的组件进行写成静态

## SSG Static Site Generation

SSG 也就是静态站点生成, 在构建时生成静态页面

next getStaticPaths

我们可以使用 getStaticPaths 获得所有文章的路径，返回的paths 参数会传递给getStaticProps，在 getStaticProps中，通过 params 获得文章 id， Next.js 会在构建时，将paths 遍历生成所有静态页面


Vue 会检查客户端代码生成的虚拟 DOM 和服务器端渲染生成的 HTML 是否一致，如果不一致，则会使用 hydrate 方法对其进行协调，保证两者一致性。传统的 Vue 客户端渲染方式中，使用的是 mount 方法，而非 hydrate 方法

在协调过程中，Vue 会检查客户端代码和服务器端渲染生成的 HTML 中每个节点的属性和事件等信息是否一致，如果不一致，则会进行更新，最终达到客户端和服务器端渲染结果完全一致的效果。更新的具体实现方式，因为 SSR 的特殊性质，需要使用复杂的算法进行 diff。

当客户端代码与预先生成的 HTML 标记相遇时，就会发生注水。Vue 会检查现有的 DOM 并重新把应用，这个过程与 Vue 客户端渲染中所发生的过程非常相似，不同的是，SSR 版本的 Vue 会尝试重用已经预先渲染的 DOM 元素以保留一部分客户端渲染的性能优势。重用过程中，也需要使用相应的算法进行 diff。

注水完成之后，就可以使用客户端代码重新绑定事件处理器，并让组件重新进行交互和渲染。


## ISR Incremental Static Regeneration

SR，增量静态生成，在访问时生成静态页面，在 Next.js 中，它比 SSG 方案只需要加了一个参数revalidate

TODO:


## React 18 Streaming SSR 流式服务端渲染

把html分为一小段一小段的向下发，渐进式渲染

TODO:

## 选择性注水 

传统的 SSR 渲染方式会等待所有组件及其子组件都准备就绪后再进行注水

  - 完整的下发html
  - 因此在服务端渲染时需要等待所有组件及其子组件都准备就绪后才能进行注水
  
选择性注水的实现方法是利用 React 18 中新增的 lazy 和 Suspense 特性，可以通过判断组件是否可渲染来决定是否进行注水。

在实际使用中用户只需要选择性地引入<Suspense>就能享受到 Streaming SSR 带来的巨大提升
https://juejin.cn/post/7064759195710521381
TODO: