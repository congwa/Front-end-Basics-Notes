# next14

## 1. Turbopack相关

Turbopack：在 app router 和 page router 中通过了 5,000 个测试

- 本地启动服务器时间快了约 50%
- 热模块替换速度快了约 94%

然而并不是所有的测试都通过了，当前只通过了 90% 的测试，所以 Turbopack 还不稳定。



## 2. Server Actions 被标记为稳定

- 集成了缓存和重新验证
- 简单的函数调用，与表单原生配合使用

`server actions`是指，服务端的nodejs函数可以直接让客户端组件进行调用（类似**rpc**的方式）


示例

```jsx
// page.tsx
import { createUser, fetchUsers, User } from "../actions/users";

const UserList = async () => {
  const userList = await fetchUsers(); // 直接调用服务端函数
  if (!userList.length) {
    return "no user";
  }
  return (
    <ul>
      {userList.map((user: User, index: number) => (
        <li key={user.username}>
          <span>
            {index}: {user.username} - {user.password}{" "}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default function Home() {
  return (
    <main>
      /* 此处是关键，form元素直接绑定server actions */ 
      <form action={createUser}> 
        <div>
          <label htmlFor="username">User Name: </label>
          <input name="username" type="test" />
        </div>
        <div>
          <label htmlFor="password">Password: </label>
          <input name="password" type="password" />
        </div>
        <button type="submit">
          submit
        </button>
      </form>
      <UserList />
    </main>
  );
}

// actions/users.ts
"use server";

import { revalidatePath } from "next/cache";
import { readFile, writeFile } from "./fs";
export type User = {
  username: string;
  password: string;
};

export const createUser = async (userForm: FormData) => { // 表单数据通过formData回传服务端
  const user = {
    username: userForm.get("username"),
    password: userForm.get("password"),
  };
  const userList = await fetchUsers();
  await writeFile("user.json", JSON.stringify([...userList, user]));
  revalidatePath("/form"); // 此处是关键，会刷新服务端组件，在当前form表单的response返回新的组件数据
};

export const fetchUsers = async () => {
  const users = await readFile("user.json");

  if (users.status === "ok") {
    revalidatePath("/form");

    return JSON.parse(users.data) as User[];
  } else {
    return [];
  }
};

```

由此得出结论

1. api创建变得隐式，不需要关心路由，请求参数获取等问题，只需要关注在主要逻辑，前后台连接更加紧密
2. 可以实现端到端的类型安全，ts类型不会因为http请求变得不可信 可以在一次http请求中，实现数据的`mutation`和`query`，更加高效 开发时间大大缩短，非常适合小型应用
3. 稳定下来后，开发效率的提升，`rpc`的方式，可以减少大量的逻辑代码，更适合全栈开发的方式。 
4. 体验上，服务端渲染的方式，得到spa的体验，

劣势

1. 违反关注点分离，不同端侧有不同考量，编写前台应用还得考虑后台细节。
2. 更加的黑盒了，本身注水过程 + 选择性注水的流式渲染已经足够复杂了，再加上这种server action的方式，使用起来虽然方便，但是框架更加黑盒复杂，遇到问题可能就停滞不前。

3. serve actions隐式生成的api无法被其他应用调用，不同端侧复用api困难
4. 安全问题。是否安全风险，当前社区还有很大讨论，

### server actions的未来

目前react和next团队对server actions，布局了大量api，已成为后续发力方向：

- useOptimistic - 乐观更新
- taintObjectReference ，taintUniqueValue - 保护数据无法被传递到客户端组件
- useFormState - 管理当前表单状态
- useFormStatus - 获取当前表单是否pending


## 3. 部分预渲染（预览）

快速的初始静态响应 + 流式动态内容


