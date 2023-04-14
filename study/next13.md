# next13

[next13路线图](https://beta.nextjs.org/docs/app-directory-roadmap)

## react13官方使用建议(为什么这么建议，接着往下看)

- 使用服务器组件在服务器上获取数据。
- 并行获取数据以最小化瀑布并减少加载时间。
- 对于布局和页面，在使用的地方获取数据。Next.js 将自动对树中的请求进行重复数据删除。
- 使用Loading UI、Streaming 和 Suspense逐步呈现页面并在加载其余内容时向用户显示结果。

## next13在服务器上请求的建议

只要有可能，我们建议在Server Components中获取数据。服务器组件总是在服务器上获取数据。这使您可以：

- 可以直接访问后端数据资源（例如数据库）。
- 通过防止访问令牌和 API 密钥等敏感信息暴露给客户端，让您的应用程序更加安全。
- 获取数据并在同一环境中呈现。这减少了客户端和服务器之间的来回通信，以及客户端主线程上的工作。
- 使用单次往返而不是客户端上的多个单独请求执行多个数据提取。
- 减少客户端-服务器瀑布。
- 根据您所在的地区，数据提取也可能发生在离您的数据源更近的地方，从而减少延迟并提高性能。

## 在这个新模型中，您可以在**layouts、pages和 components中获取数据**。数据获取也与Streaming 和 Suspense兼容

之前只能在pages通过getServerSideProps、getStaticProps和。getInitialPropsapp获取数据

- 对于布局，无法在父布局与其子布局之间传递数据
  >建议直接在需要它的布局中获取数据，即使您在一个路由中多次请求相同的数据.在幕后，React 和 Next.js 将对请求进行缓存和重复数据删除，以避免多次获取相同的数据.

总结：官方不建议以vue ssr的方式那样，存到store中，然后只有第一次触发服务端渲染。 可以看出，next13推荐每个页面都交于服务端渲染，然后next帮忙做好每个页面局部刷新和相同请求多次请求的问题。 这样让用户(开发者)不用关注什么时候缓存什么时候不缓存，在next13中需要数据直接请求就好，框架帮你解决所有问题

## fetch的改进

fetch()新的数据获取系统建立在原生Web API之上，并在服务器组件中使用async/await

- React 扩展fetch以提供自动请求重复数据删除。
- Next.js 扩展fetch选项对象以允许每个请求设置自己的缓存和重新验证规则。
- 自动fetch()去重:果您需要在树中的多个组件中获取相同的数据（例如当前用户），Next.js 会**自动在临时缓存中缓存**具有相同输入的fetch请求（ ）。GET此优化可防止在渲染过程中多次获取相同的数据
  - 在服务器上，缓存持续服务器请求的生命周期，**直到呈现过程完成**。
  - 在客户端，**缓存会持续整个页面重新加载之前**的会话持续时间（可能包括多个客户端重新呈现）
- POST请求不会自动删除重复数据
- 如果您无法使用fetch，**React 提供了一个cache功能**，允许您在请求期间手动缓存数据

  ```js
    import { cache } from 'react';

    export const getUser = cache(async (id: string) => {
      const user = await db.user.findUnique({ id });
      return user;
    });
  ```

## 构建改进

使用Turbopack

- 增量计算： Turbopack 是建立在 Turbo 之上的，Turbo 是基于 Rust 的开源、增量记忆化框架，除了可以缓存代码，还可以缓存函数运行结果
- 懒编译：例如，如果访问 localhost:3000，它将仅打包 pages/index.jsx，以及导入的模块。
为什么不选择 Vite 和 Esbuild？
- vite: Vite 依赖于浏览器的原生 ES Modules 系统，不需要打包代码，这种方法只需要转换单个 JS 文件，响应更新很快，但是如果文件过多，这种方式会导致浏览器大量级联网络请求，会导致启动时间相对较慢。
- Esbuild: Esbuild 是一个非常快速的打包工具，但它并没有做太多的缓存，也没有 HMR（热更新），所以在开发环境下不适用

## 由next<=12基于文件的路由系统 改为 app 目录的基于目录的page.tsx

>新目录**不支持**以前的Next.js 数据获取方法，例如**getServerSideProps、getStaticProps和。getInitialPropsapp**

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

## 静态数据和动态数据获取

静态数据和动态数据由用户区分，最好使用get做静态，

### 静态数据获取 - 默认情况下，fetch将无限期地自动获取和缓存数据

**[如果缓存需要刷新怎么办,请看这](./fetch.md)**

```js
  fetch('https://...'); // cache: 'force-cache' is the default
```

- 定时重新验证数据- 接口: 要按时间间隔重新验证缓存数据next.revalidate，您可以使用中的选项fetch()来设置cache资源的生命周期（以秒为单位）。

```js
  fetch('https://...', { next: { revalidate: 10 } }); // 由此可见react13对fetch进行了继承重写
```

- 预加载模式 - next13建议有选择的预加载，使用preload()函数在**执行数据获取的实用程序**或**组件中公开导出**: 官方成为preload模式

```tsx
import { getUser } from "@utils/getUser";

export const preload = (id: string) => {
  // void evaluates the given expression and returns undefined
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void
  void getUser(id);
}
export default async function User({ id }: { id: string }) {
  const result = await getUser(id);
  // ...
}


import User, { preload } from '@components/User';

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  preload(id); // starting loading the user data now
  const condition = await fetchCondition();
  return condition ? <User id={id} /> : null;
}


```

- cache : 如果fetch不支持fetch参数，可以使用 react18的cache包裹

  ```tsx
    import { cache } from 'react';

    export const getUser = cache(async (id: string) => {
      const user = await db.user.findUnique({ id });
      return user;
    });

    import { getUser } from '@utils/getUser';

    export default async function UserLayout({ params: { id } }) {
      const user = await getUser(id);
      // ...
    }
    import { getUser } from '@utils/getUser';

    export default async function UserLayout({
      params: { id },
    }: {
      params: { id: string };
    }) {
      const user = await getUser(id);
      // ...
    }

  ```



- 定时重新验证数据- 页面:  使用路由段配置
  
  ```js
    export const revalidate = 60;// revalidate this page every 60 seconds
  ```

- 按需重新验证数据
    1. 传经一个Next.js秘钥 - 用于防止未经授权访问重新验证的 API 路由
    2. 拼到url上
    
        ```js
          https://<your-site.com>/api/revalidate?secret=<token>
        ```
        
    3. 创建验证api路由 (这是一个内置小功能)
   
    ```js
    export default async function handler(req, res) {
      // Check for secret to confirm this is a valid request
      if (req.query.secret !== process.env.MY_SECRET_TOKEN) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      try {
        // This should be the actual path not a rewritten path
        // e.g. for "/blog/[slug]" this should be "/blog/post-1"
        await res.revalidate('/path-to-revalidate');
        return res.json({ revalidated: true });
      } catch (err) {
        // If there was an error, Next.js will continue
        // to show the last successfully generated page
        return res.status(500).send('Error revalidating');
      }
    }
    ```

### 动态数据获取

要在每次请求时获取新数据fetch，请使用该**cache: 'no-store'**选项 (由此可见，不能让服务器对响应头做强制性缓存处理，而是由客户端控制)

```js

fetch('https://...', { cache: 'no-store' });

```

### 数据获取模式

- 并行数据获取： 为了最大限度地减少客户端-服务器瀑布，我们建议使用这种模式来并行获取数据：
  
  - **使用promise.all**： 使用promise.all在**两个请求到达之前**，**用户不会看到**呈现的结果, 为了解决这个问题，react18引入了**Suspense边界**打散渲染工作
- Suspense边界
  
  ```jsx
  export default async function Page({ params: { username } }) {
    // Initiate both requests in parallel
    const artistData = getArtist(username);
    const albumData = getArtistAlbums(username);

    // Wait for the artist's promise to resolve first
    const artist = await artistData;

    return (
      <>
        <h1>{artist.name}</h1>
        {/* Send the artist information first,
        and wrap albums in a suspense boundary */}
        <Suspense fallback={<div>Loading...</div>}>
          <Albums promise={albumData} />
        </Suspense>
      </>
    );
  }

  // Albums Component
  async function Albums({ promise }) {
    // Wait for the albums promise to resolve
    const albums = await promise;

    return (
      <ul>
        {albums.map((album) => (
          <li key={album.id}>{album.name}</li>
        ))}
      </ul>
    );
  }

  ```

  Albums组件中使用await请求自己的数据，Albums组件是一个async的组件，在使用Albums组件的时候用Suspense把Albums包裹。
  > 这里是真的厉害，在之前是不可以这么使用的，会报错

  总结： 可以通过其特性控制加载的顺序，将数据获取移动至较低的位置，最好在需要它的页面进行
  
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

## import 'server-only' 仅在服务端

```js
import 'server-only';
```

## router.refresh()

通过调用router.refresh()，当前路由将刷新并从服务器获取更新的待办事项列表， 这不会影响浏览器历史记录，但会从根布局向下刷新数据。使用时refresh()，客户端状态不会丢失，包括 React 和浏览器状态
我们可以使用useTransition钩子来创建内联加载 UI。我们将突变包装在一个startTransition函数中以将更新标记为转换，并使用isPending标志在转换挂起时显示加载 UI。

```jsx
"use client";

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export default function Todo(todo: Todo) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);

  // Create inline loading UI
  const isMutating = isFetching || isPending;

  async function handleChange() {
    setIsFetching(true);
    // Mutate external data source
    await fetch(`https://api.example.com/todo/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !todo.completed }),
    });
    setIsFetching(false);

    startTransition(() => {
      // Refresh the current route:
      // - Makes a new request to the server for the route
      // - Re-fetches data requests and re-renders Server Components
      // - Sends the updated React Server Component payload to the client
      // - The client merges the payload without losing unaffected
      //   client-side React state or browser state
      router.refresh();

      // Note: If fetch requests are cached, the updated data will
      // produce the same result.
    });
  }

  return (
    <li style={{ opacity: !isMutating ? 1 : 0.7 }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleChange}
        disabled={isPending}
      />
      {todo.title}
    </li>
  );
}
```


## 并行路由

并行路由是使用命名槽创建的。槽是按照@folder惯例定义的。 -- @开头

```js
dashboard
├── @audience
│   ├── demographics
│   │   └── page.js
│   ├── subscribers
│   │   └── page.js
│   └── page.js
├── @views
│   ├── impressions
│   │   └── page.js
│   ├── view-duration
│   │   └── page.js
│   └── page.js
├── layout.js
└── page.js

```

```tsx
function AudienceNav() {
  return <nav>...</nav>;
}

function ViewsNav() {
  return <nav>...</nav>;
}

export default function Layout({ children, audience, views }) {
  return (
    <>
      <h1>Tab Bar Layout</h1>
      {children}

      <h2>Audience</h2>
      <AudienceNav />
      {/* 并行路由的插槽 */}
      {audience}   

      <h2>Views</h2>
      <ViewsNav />
      {/* 并行路由的插槽 */}
      {views}
    </>
  );
}
```

### 并行路由的行为

#### 网址

插槽不影响 URL 结构。文件路径/dashboard/@views/subscribers可在/dashboard/subscribers.

#### 导航  -- 软导航

当向后和向前导航时（使用软导航），URL 将更新并且浏览器将恢复以前活动的插槽。

例如，如果用户导航到/dashboard/subscribers，然后导航到，则在返回时/dashboard/impressionsURL 将更新为。dashboard/subscribers

#### default.js

在刷新（或硬导航）时，浏览器将呈现与当前 URL 匹配的插槽，但不知道哪个其他并行插槽处于活动状态。

当浏览器无法恢复以前的状态时，您可以定义一个default.js文件作为**后备呈现**。


```js

dashboard
├── @team
│   └── ...
├── @user
│   └── ...
├── default.js
├── layout.js
└── page.js

```

##### 条件路由

Parallel Routes 可用于实现条件路由。例如，您可以根据当前用户类型呈现@user和路由：@team

```tsx
export default async function Layout({ children, user, team }) {
  const userType: 'user' | 'team' = getCurrentUserType();

  return (
    <>
      {userType === 'user' ? user : team}
      {children}
    </>
  );
}

```

