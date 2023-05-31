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

客户端"浸泡"的过程实际上是重新创建了组件树，将新生的水（state、props、context等）注入其中，并将鲜活的组件树塞进服务端渲染的干瘪躯壳里
所以在 SSR 模式下，客户端有一段时间是无法正常交互的，注水完成之后才能彻底复活（单向数据流和交互行为都恢复正常）

注水操作需要三个前提：

1. 完整标签已经传输完、
2. 数据已经加载完
3. 需要注水的js代码已经加载完

总结： 

1. 注水会执行create hydrate过程，区别crtateRoot/App,create hydrate不会直接替换标签，而是对比。
2. 对比服务端下发的html结构是否和虚拟dom有出入，如有出入，以虚拟dom的为准
3. 与hydrate标记进行关联， 这个过程中尽量保证不会重新render

## 预渲染

对可以预渲染的组件进行写成静态
不变部分可以生成静态html一直存着，不用每次走react渲染流程，节省资源

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

TODO: 示例代码

## React 18 Streaming SSR 流式服务端渲染 (跳过花费时间长的区域)

仅有Suspense的时候，没有lazy的时候

把html分为一小段一小段的向下发，渐进式渲染。

遇到Suspense，下传占位的Spinner。 每个被Suspense的组件都有一个用户不可见的带注释和id的template占位符用来记录已经传输的状态的块(Chunks),这些占位符后续会被有效的组件填充。

> template 可以用于任意标签类型组件的子组件，因此被用作占位符。

- Completed（已完成）：<!--$-->
- Pending（等待中）：<!--$?-->
- ClientRendered（客户端已渲染）：<!--$!-->
- End 结束 <!--/$-->

```html
<div hidden id="comments">
  <!-- Comments -->
  <p>foo</p>
  <p>bar</p>
</div>
<script>
  // 新的替换子元素API
  document
    .getElementById("sections-spinner")
    .replaceChildren(document.getElementById("comments"));
</script>

```

总结：

1. 不阻断渲染：有些标签需要渲染时间会比较长。比如出现渲染10万个div。 那么我们可以把部分使用Suspense包裹。这样不阻断其它的时间比较短的渲染。这时候下传占位符和占位loading
2. Suspense包裹的不会被丢弃： Suspense部分的加载完，下传浏览器和一段插入script代码，script代码执行，把下传的真实标签替换掉loading
这样就做到了优先时间短的页面先展示在用户屏幕上

## 选择性注水 

TODO: 选择性注水和qwik框架的特性进行对比

传统的 SSR 渲染方式会等待所有组件及其子组件都准备就绪后再进行注水

- 完整的下发html
- 因此在服务端渲染时需要等待所有组件及其子组件都准备就绪后才能进行注水
  
选择性注水的实现方法是利用 React 18 中新增的 lazy 和 Suspense 特性，可以通过判断组件是否可渲染来决定是否进行注水。

在实际使用中用户只需要选择性地引入<Suspense>就能享受到 Streaming SSR 带来的巨大提升(如上)

选择性注水需要满足的条件

- use包裹数据 -- 目的是如果某个接口需要很长时间，那么对接口异步进行use包裹让react知道
- lazy进行分包
- Suspense包裹标签

无use：这里如果没有use也可以，效果就是分包后的js和html一起流式下发，最快注水，能够交互。
有use： 等待use异步完成开始下发

注水选择优先级：

如果用户对某个区域进行了交互，优先注水。
React 通过维护几个优先队列，能够记录用户的交互点击来优先给对应组件注水，**在注水完成后组件就会响应这次交互**，即事件重放（event replay）

总结： lazy组件是为了把注水的js代码分包，能够和Suspense占位替换后的真实html直接关联。
