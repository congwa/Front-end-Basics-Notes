# fetch

[fetch不错的文章- 传送门](https://www.cnblogs.com/wonyun/p/fetch_polyfill_timeout_jsonp_cookie_progress.html)

全局的 fetch() 方法用于发起获取资源的请求。

它返回一个 promise，这个 promise 会在请求响应后被 resolve，并传回 Response 对象

Window 和 WorkerGlobalScope 都实现了 WorkerOrGlobalScope

```js
Promise<Response> fetch(input[, init]);

```

## init

### cache 请求的 cache 模式  只能缓存get请求

服务端的响应头的优先级更高

- default   使用浏览器默认的缓存策略
- no-store  不使用缓存，每次都向服务器发送请求
- reload    不使用缓存，但是会强制向服务器发送请求，并在响应成功后更新缓存
- no-cache   可以使用缓存，但在返回之前需要向服务器验证缓存是否过期
- force-cache 可以使用缓存，即使它已经过期了
- only-if-cached 只能使用缓存，如果缓存不可用，就会失败

<details>
<summary>TODO:如果get请求的数据且没有过期(此数据来源于数据库),此时更新了数据库，如何保证再次get请求到最新的数据，且刷新缓存？</summary>

为了保证再次 GET 请求能够获取到最新的数据并刷新缓存，可以在服务器端设置响应头，包括以下两种方式：

1. 在 HTTP 响应头中通过 Cache-Control 来控制缓存，使用 no-cache 和 max-age=0 两个指令来防止浏览器缓存数据。例如：

  ```js
    Cache-Control: no-cache, max-age=0
  ```

2. 在 HTTP 响应头中设置 ETag 或 Last-Modified，用于标记数据是否更新。例如：

```js
ETag: "checksum_of_the_resource"
```

或

```js
Last-Modified: Fri, 13 Apr 2023 18:11:48 GMT
```

在客户端再次发起 GET 请求时，客户端会携带 If-None-Match 或 If-Modified-Since 头字段，来验证服务器上的资源是否已经更新。例如：

```js

If-None-Match: "checksum_of_the_resource"

```

或

```js

If-Modified-Since: Fri, 13 Apr 2023 18:11:48 GMT

```

如果服务器上的数据已经更新，则会返回新的数据，并在响应头中包含新的 ETag 或 Last-Modified 标志；如果没有更新，则返回状态码为 304，表示客户端的缓存是最新的，无需更新。

综上所述，通过在 HTTP 响应头中设置 Cache-Control、ETag 或 Last-Modified，可以保证客户端再次 GET 请求能够获取到最新的数据并及时刷新缓存。

- 在nestjs的控制

在 NestJS 中可以通过在 HTTP 响应头中设置 ETag 或 Last-Modified 标志来实现资源或数据库数据的更新验证。

具体实现步骤如下：

1. 在服务端获取最新数据后，计算出数据对应的 ETag 或 Last-Modified 标志，并在响应头中设置该标志。例如：

```typescript
const etag = 'checksum_of_the_resource';
response.setHeader('ETag', etag);
```

2. 在客户端再次发起 GET 请求时，请求头中会携带 If-None-Match 或 If-Modified-Since 头字段，用于验证服务端上的资源是否已经更新。在 NestJS 中，可以通过中间件来拦截请求，进行验证并返回最新的数据或状态码 304。例如：

```typescript
import { NestInterceptor, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const etag = 'checksum_of_the_resource'; // 获取服务端最新数据的 ETag 标志，或者获取 Last-Modified 时间戳
    response.setHeader('ETag', etag); // 在响应头中设置 ETag 或 Last-Modified 标志
    return next.handle().pipe(
      tap(() => {
        const ifNoneMatch = request.headers['if-none-match'];
        const ifModifiedSince = request.headers['if-modified-since'];
        if (ifNoneMatch && ifNoneMatch === etag) { // 如果客户端发送了 If-None-Match 头字段并且值为服务端最新数据的 ETag 标志，则返回最新数据
          response.status(200).send('This is the latest data.');
        }
        if (ifModifiedSince && new Date(ifModifiedSince).getTime() >= new Date('Fri, 13 Apr 2023 18:11:48 GMT').getTime()) { // 如果客户端发送了 If-Modified-Since 头字段并且时间戳大于或等于服务端最新数据的 Last-Modified 时间戳，则返回最新数据
          response.status(200).send('This is the latest data.');
        }
        response.status(304).send(); // 如果数据没有更新，则返回状态码 304，表示客户端缓存是最新的，无需更新
      }),
    );
  }
}
```

3. 在需要应用 ETag 或 Last-Modified 的路由或控制器方法上使用 `@UseInterceptors()` 装饰器引入上述中间件即可。例如：

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from './cache.interceptor';

@Controller('items')
export class ItemsController {
  @Get()
  @UseInterceptors(CacheInterceptor) // 引入中间件
  findAll() {
    return 'This action returns all items';
  }
}
```

通过以上实现，客户端再次发起 GET 请求时会携带 If-None-Match 或 If-Modified-Since 头字段，服务器会进行验证并返回最新的数据或状态码 304，从而保证客户端的缓存是最新的。

总结：
在服务端定义一个etag的标记生成规则（比如md5），使用算法对新数据生成etag值，对比客户端发过来的etag值是否一致，来决定是否发送数据或者304状态码。

如果是304状态码，能提升回传速度，因为body体无数据
</details>
