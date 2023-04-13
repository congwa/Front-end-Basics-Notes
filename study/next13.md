# next13

## 构建改进

使用Turbopack

- 增量计算： Turbopack 是建立在 Turbo 之上的，Turbo 是基于 Rust 的开源、增量记忆化框架，除了可以缓存代码，还可以缓存函数运行结果
- 懒编译：例如，如果访问 localhost:3000，它将仅打包 pages/index.jsx，以及导入的模块。
为什么不选择 Vite 和 Esbuild？
- vite: Vite 依赖于浏览器的原生 ES Modules 系统，不需要打包代码，这种方法只需要转换单个 JS 文件，响应更新很快，但是如果文件过多，这种方式会导致浏览器大量级联网络请求，会导致启动时间相对较慢。
- Esbuild: Esbuild 是一个非常快速的打包工具，但它并没有做太多的缓存，也没有 HMR（热更新），所以在开发环境下不适用

## 由next<=12基于文件的路由系统 改为 app 目录的基于目录的page.tsx

```js
./app       // 新增app文件夹来实现 约定式路由，完美地实现了持久化缓存
├── GlobalNav.tsx
├── layout.tsx
├── page.tsx
├── layouts
│   ├── CategoryNav.tsx
│   ├── [categorySlug]
│   │   ├── SubCategoryNav.tsx
│   │   ├── [subCategorySlug]
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── template.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── template.tsx

// 每个目录下有个page.tsx
```

我们看到每个文件下都有 3 个文件 layout.tsx、page.tsx 、template.tsx、

- layout.tsx 该路由下的公共导航，切换路由时，不会刷新，我们可以看箭头处的 Count 组件，并没有刷新
- template.tsx 该路由下的公共部分，切换路由时，会刷新
page.tsx 该路由的主页面

以上除了 page.tsx 其他文件都是可选的，除了这些约定名称的文件外，我们可以建立任意文件，比如 components.tsx、 test.tsx 等自定义文件。app 目录可以很好地将页面、组件、测试文件放在一起，管理代码目录，避免开发时全局查找。

这么改的目的：

- 实现嵌套路由和持久化缓存
- 支持 React 18 中的 React server Component，实现 Streaming（流渲染）
- 实现代码目录分组，将当前路由下的测试文件、组件、样式文件友好地放在一起，避免全局查找

### 路由分组

app 同层级目录下还支持多个 layout， 使用 （文件夹）区分，（文件夹）不会体现在路由上，只是单纯用来做代码分组。

```js
./app
├── (checkout)
│   ├── checkout
│   │   └── page.tsx
│   ├── layout.tsx
│   └── template.tsx
├── (main)
│   ├── layout.tsx
│   ├── page.tsx
│   └── template.tsx
```

## React Server Components

> **在 app 目录下的组件默认都是 React Server Components**

app 目录下的组件默认都是 React Server Components，意味着

- 每个组件都是被lazy和Suspense包裹
- 流式下发、无顺序、js和html局部一起下发
- 选择性注水
  
### page页面实现React Server Components

在app目录下所有组件都是 Server Components,在page中也能实现

组件外层使用 Suspense

```jsx

import { SkeletonCard } from '@/ui/SkeletonCard';
import { Suspense } from 'react';
import Description from './description';

export default function Posts() {
  return (
    <section>
      <Suspense
        fallback={
          <div className="w-full h-40 ">
            <SkeletonCard isLoading={true} />
          </div>
        }
      >
        <Description />
      </Suspense>
    </section>
  );
}
```

组件数据请求使用 use API，就可以实现流渲染了

```tsx
import { use } from 'react'; // 注意use方法

async function fetchDescription(): Promise<string> {
  return fetch('http://www.example.com/api/data').then((res)=>res.text())
}

export default function Description() {
  let msg = use(fetchDescription());
  return (
    <section>
      <div>{msg}</div>
    </section>
  );
}
```

## 服务端组件和客户端组件区分

在 Next13 中 ， 在 app 目录下，如要使用 useState 等状态管理的 hook，那么该组件只在客户端执行，需要在首行加入 'use client' 指令

```js
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```