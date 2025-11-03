# ctx

## 概述

上下文传递是现代 Web 框架和应用架构中的核心概念。不同的框架采用了不同的设计模式来实现上下文传递，本文档详细对比了三种主流方案：

- **FastAPI**: Python 异步 Web 框架，使用依赖注入和 ContextVar
- **Koa**: Node.js Web 框架，使用函数参数传递
- **CompletionsContext**: Cherry Studio AI Core 的上下文设计，使用 TypeScript 类型系统

---

## FastAPI 上下文传递

### 1. 设计理念

FastAPI 采用**依赖注入（Dependency Injection）**和**上下文变量（ContextVar）**两种机制来传递上下文：

- **依赖注入**: 通过 `Depends()` 显式声明依赖关系，类型安全
- **ContextVar**: 提供异步上下文隔离，支持全局访问

### 2. 核心机制

#### 2.1 Request 对象

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/items/")
async def read_items(request: Request):
    # Request 对象包含所有请求信息
    method = request.method
    url = str(request.url)
    headers = dict(request.headers)
    client_host = request.client.host
    query_params = dict(request.query_params)
    
    return {
        "method": method,
        "url": url,
        "headers": headers,
        "client_host": client_host,
        "query_params": query_params
    }
```

#### 2.2 Request.state（请求状态）

```python
@app.middleware("http")
async def add_request_context(request: Request, call_next):
    # 在 request.state 中存储自定义数据
    request.state.request_id = f"req-{time.time()}-{uuid.uuid4().hex[:8]}"
    request.state.start_time = time.time()
    request.state.user = None  # 稍后由认证中间件填充
    
    # 调用下一个中间件/路由处理器
    response = await call_next(request)
    
    # 响应返回后处理
    duration = time.time() - request.state.start_time
    response.headers["X-Process-Time"] = str(duration)
    response.headers["X-Request-ID"] = request.state.request_id
    
    return response

@app.get("/items/")
async def read_items(request: Request):
    # 读取中间件设置的状态
    request_id = request.state.request_id
    user = request.state.user
    
    return {"request_id": request_id, "user": user}
```

#### 2.3 ContextVar（全局访问）

```python
from contextvars import ContextVar
from typing import Optional

# 定义上下文变量
request_context_var: ContextVar[Optional[Request]] = ContextVar(
    'request_context',
    default=None
)

# 中间件：捕获并存储 Request
@app.middleware("http")
async def capture_request(request: Request, call_next):
    # 将 Request 存储到上下文变量中
    token = request_context_var.set(request)
    
    try:
        response = await call_next(request)
        return response
    finally:
        # 清理上下文变量
        request_context_var.reset(token)

# 全局访问函数
def get_request() -> Request:
    """在任何地方都可以调用的函数，获取当前请求"""
    request = request_context_var.get()
    if request is None:
        raise RuntimeError("Request context not available")
    return request

# 在服务层使用
class ItemService:
    def get_items(self):
        # 在服务层获取 HTTP 信息
        request = get_request()
        request_id = request.state.request_id
        print(f"[Service] Request ID: {request_id}")
        return ["item1", "item2"]
```

#### 2.4 依赖注入系统

```python
from fastapi import Depends

# 定义依赖项
async def get_db():
    """数据库连接依赖"""
    db = {"connection": "postgresql://..."}
    try:
        yield db
    finally:
        db.clear()

async def get_current_user(request: Request):
    """获取当前用户（依赖项）"""
    token = request.headers.get("Authorization")
    if token:
        user = {"id": 1, "name": "Alice"}
        return user
    return None

async def get_user_context(
    request: Request,
    user: dict = Depends(get_current_user),
    db: dict = Depends(get_db)
):
    """组合多个依赖项，创建上下文"""
    return {
        "request_id": request.state.request_id,
        "user": user,
        "db": db
    }

# 在路由中使用依赖项
@app.get("/items/")
async def read_items(ctx: dict = Depends(get_user_context)):
    # ctx 包含了所有上下文信息
    return {
        "request_id": ctx["request_id"],
        "user": ctx["user"],
        "items": ["item1", "item2"]
    }
```

### 3. 完整示例

```python
from fastapi import FastAPI, Request, Depends
from contextvars import ContextVar
from typing import Optional
import uuid
import time

app = FastAPI()

# ========== 上下文变量 ==========
request_context_var: ContextVar[Optional[Request]] = ContextVar(
    'request_context',
    default=None
)

# ========== HTTP 信息封装类 ==========
class HTTPContext:
    def __init__(self, request: Request):
        self.request = request
    
    @property
    def method(self) -> str:
        return self.request.method
    
    @property
    def url(self) -> str:
        return str(self.request.url)
    
    @property
    def headers(self) -> dict:
        return dict(self.request.headers)
    
    @property
    def client_host(self) -> Optional[str]:
        return self.request.client.host if self.request.client else None

# ========== 中间件 ==========
@app.middleware("http")
async def setup_context(request: Request, call_next):
    # 设置请求状态
    request.state.request_id = f"req-{uuid.uuid4().hex[:8]}"
    request.state.start_time = time.time()
    
    # 存储到上下文变量
    token = request_context_var.set(request)
    
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response
    finally:
        request_context_var.reset(token)

# ========== 全局访问函数 ==========
def get_request() -> Request:
    request = request_context_var.get()
    if request is None:
        raise RuntimeError("Request context not available")
    return request

# ========== 服务层 ==========
class ItemService:
    async def get_items(self):
        request = get_request()
        print(f"[Service] Request ID: {request.state.request_id}")
        return ["item1", "item2"]

# ========== 路由处理器 ==========
item_service = ItemService()

@app.get("/items/")
async def read_items():
    request = get_request()
    items = await item_service.get_items()
    
    return {
        "items": items,
        "request_id": request.state.request_id
    }
```

### 4. FastAPI 特点

**优点：**
- ✅ 类型安全：通过 TypeScript 风格的注解提供类型检查
- ✅ 依赖注入：清晰的依赖关系声明
- ✅ 全局访问：通过 ContextVar 在任何地方访问
- ✅ 异步支持：原生支持异步上下文隔离

**缺点：**
- ❌ 需要手动设置 ContextVar
- ❌ 依赖注入可能增加代码复杂度
- ❌ Python 的类型系统不如 TypeScript 严格

---

## Koa 上下文传递

### 1. 设计理念

Koa 采用**函数参数传递**的方式，通过 `ctx` 对象在中间件链中传递上下文：

- **简单直接**: 通过函数参数显式传递
- **洋葱模型**: 请求和响应都经过中间件链
- **状态存储**: 通过 `ctx.state` 存储自定义状态

### 2. 核心机制

#### 2.1 Context 对象结构

```typescript
interface Context {
  // 请求相关
  request: Request
  response: Response
  req: IncomingMessage
  res: ServerResponse
  
  // 便捷属性
  state: any              // 自定义状态存储
  app: Application        // 应用实例
  
  // 请求属性
  method: string
  url: string
  path: string
  query: any
  headers: any
  
  // 响应属性
  status: number
  body: any
  type: string
}
```

#### 2.2 中间件传递

```typescript
import Koa from 'koa'

const app = new Koa()

// 中间件1：设置请求 ID
app.use(async (ctx, next) => {
  const start = Date.now()
  
  // 在 ctx.state 中存储自定义数据
  ctx.state.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  ctx.state.startTime = start
  
  console.log(`[${ctx.state.requestId}] ${ctx.method} ${ctx.url}`)
  
  // 调用下一个中间件
  await next()
  
  // 响应返回后执行
  const ms = Date.now() - start
  ctx.set('X-Process-Time', `${ms}ms`)
  console.log(`[${ctx.state.requestId}] Completed in ${ms}ms`)
})

// 中间件2：身份验证
app.use(async (ctx, next) => {
  // 读取上一个中间件设置的 requestId
  console.log(`Processing request: ${ctx.state.requestId}`)
  
  // 设置用户信息
  const token = ctx.headers.authorization
  if (token) {
    ctx.state.user = { id: 1, name: 'Alice' }
  }
  
  await next()
})

// 中间件3：业务逻辑
app.use(async (ctx, next) => {
  // 读取前面中间件设置的状态
  const { requestId, user } = ctx.state
  
  // 设置响应
  ctx.body = {
    message: 'Hello',
    requestId,
    user
  }
  
  await next()
})
```

#### 2.3 状态管理

```typescript
// 全局状态存储
app.context.db = connectDatabase()

// 中间件中使用全局状态
app.use(async (ctx, next) => {
  // 使用全局数据库连接
  const users = await ctx.db.users.find()
  
  // 设置请求级状态
  ctx.state.users = users
  
  await next()
})

// 路由处理器中使用状态
app.use(async (ctx) => {
  // 读取请求级状态
  const users = ctx.state.users
  
  // 使用全局状态
  const db = ctx.app.context.db
  
  ctx.body = { users }
})
```

### 3. 完整示例

```typescript
import Koa from 'koa'
import Router from 'koa-router'

const app = new Koa()
const router = new Router()

// ========== 中间件1：请求追踪 ==========
app.use(async (ctx, next) => {
  ctx.state.requestId = `req-${Date.now()}`
  ctx.state.startTime = Date.now()
  
  console.log(`[${ctx.state.requestId}] ${ctx.method} ${ctx.url}`)
  
  await next()
  
  const duration = Date.now() - ctx.state.startTime
  ctx.set('X-Process-Time', `${duration}ms`)
  ctx.set('X-Request-ID', ctx.state.requestId)
})

// ========== 中间件2：认证 ==========
app.use(async (ctx, next) => {
  const token = ctx.headers.authorization
  
  if (token) {
    // 解析 token
    ctx.state.user = { id: 1, name: 'Alice' }
  }
  
  await next()
})

// ========== 中间件3：权限检查 ==========
app.use(async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.status = 401
    ctx.body = { error: 'Unauthorized' }
    return
  }
  
  await next()
})

// ========== 服务层 ==========
class ItemService {
  async getItems(ctx: Koa.Context) {
    // 需要显式传递 ctx
    const requestId = ctx.state.requestId
    const user = ctx.state.user
    
    console.log(`[Service] Request ID: ${requestId}`)
    console.log(`[Service] User: ${user.name}`)
    
    return ['item1', 'item2']
  }
}

// ========== 路由处理器 ==========
const itemService = new ItemService()

router.get('/items', async (ctx) => {
  // ctx 自动传递
  const items = await itemService.getItems(ctx)
  
  ctx.body = {
    items,
    requestId: ctx.state.requestId,
    user: ctx.state.user
  }
})

app.use(router.routes())
```

### 4. Koa 特点

**优点：**
- ✅ 简单直观：函数参数传递，易于理解
- ✅ 洋葱模型：请求和响应都经过中间件链
- ✅ 灵活性高：可以任意组合中间件
- ✅ JavaScript/TypeScript 原生支持

**缺点：**
- ❌ 需要手动传递 ctx：在深层调用中需要显式传递
- ❌ 全局访问困难：无法像 FastAPI 那样全局访问
- ❌ 类型安全：需要手动定义类型，不如 CompletionsContext 严格

---

## CompletionsContext 上下文传递

### 1. 设计理念

CompletionsContext 是 Cherry Studio AI Core 的上下文设计，采用**显式类型化上下文**和**不可变接口 + 可变状态**模式：

- **类型安全**: 使用 TypeScript 泛型确保类型安全
- **职责分离**: 不变部分（apiClientInstance）和可变部分（_internal）分离
- **中间件链**: 通过中间件链传递和转换上下文

### 2. 核心机制

#### 2.1 Context 结构

```typescript
// 基础上下文接口
export interface BaseContext {
  [MIDDLEWARE_CONTEXT_SYMBOL]: true
  methodName: string
  originalArgs: Readonly<any[]>
}

// 处理状态（可变部分）
export interface ProcessingState<
  TParams extends SdkParams = SdkParams,
  TMessageParam extends SdkMessageParam = SdkMessageParam,
  TToolCall extends SdkToolCall = SdkToolCall
> {
  sdkPayload?: TParams
  newReqMessages?: TMessageParam[]
  observer?: {
    usage?: Usage
    metrics?: Metrics
  }
  toolProcessingState?: {
    pendingToolCalls?: Array<TToolCall>
    executingToolCalls?: Array<{
      sdkToolCall: TToolCall
      mcpToolResponse: MCPToolResponse
    }>
    output?: SdkRawOutput | string
    isRecursiveCall?: boolean
    recursionDepth?: number
  }
  webSearchState?: {
    results?: WebSearchResponse
  }
  flowControl?: {
    abortController?: AbortController
    abortSignal?: AbortSignal
    cleanup?: () => void
  }
  enhancedDispatch?: (
    context: CompletionsContext,
    params: CompletionsParams
  ) => Promise<CompletionsResult>
  customState?: Record<string, any>
}

// 完整的上下文接口
export interface CompletionsContext<
  TSdkParams extends SdkParams = SdkParams,
  TSdkMessageParam extends SdkMessageParam = SdkMessageParam,
  TSdkToolCall extends SdkToolCall = SdkToolCall,
  TSdkInstance extends SdkInstance = SdkInstance,
  TRawOutput extends SdkRawOutput = SdkRawOutput,
  TRawChunk extends SdkRawChunk = SdkRawChunk,
  TSdkSpecificTool extends SdkTool = SdkTool
> extends BaseContext {
  readonly methodName: 'completions'  // 强制方法名
  
  // 不变部分：API 客户端实例
  apiClientInstance: BaseApiClient<
    TSdkInstance,
    TSdkParams,
    TRawOutput,
    TRawChunk,
    TSdkMessageParam,
    TSdkToolCall,
    TSdkSpecificTool
  >
  
  // 可变部分：处理状态
  _internal: ProcessingState<TSdkParams, TSdkMessageParam, TSdkToolCall>
}
```

#### 2.2 中间件链传递

```typescript
// 中间件类型定义
export type CompletionsMiddleware = (
  api: MiddlewareAPI<CompletionsContext, [CompletionsParams]>
) => (
  next: (
    context: CompletionsContext,
    params: CompletionsParams
  ) => Promise<CompletionsResult>
) => (
  context: CompletionsContext,
  params: CompletionsParams
) => Promise<CompletionsResult>

// 中间件实现示例
export const TransformCoreToSdkParamsMiddleware: CompletionsMiddleware =
  () =>
  (next) =>
  async (ctx: CompletionsContext, params: CompletionsParams): Promise<CompletionsResult> => {
    const internal = ctx._internal
    
    // 读取上下文
    const isRecursiveCall = internal?.toolProcessingState?.isRecursiveCall || false
    const apiClient = ctx.apiClientInstance
    
    // 转换参数
    const requestTransformer = apiClient.getRequestTransformer()
    const transformResult = await requestTransformer.transform(
      params,
      params.assistant,
      params.assistant.model!,
      isRecursiveCall,
      params._internal?.newReqMessages
    )
    
    // 修改上下文状态
    ctx._internal.sdkPayload = transformResult.payload
    
    if (transformResult.metadata) {
      ctx._internal.customState = {
        ...ctx._internal.customState,
        sdkMetadata: transformResult.metadata
      }
    }
    
    // 调用下一个中间件
    return next(ctx, params)
  }
```

#### 2.3 上下文创建和使用

```typescript
// 上下文工厂函数
function createInitialCallContext<TContext extends BaseContext, TCallArgs extends unknown[]>(
  methodName: string,
  originalCallArgs: TCallArgs,
  specificContextFactory?: (base: BaseContext, callArgs: TCallArgs) => TContext
): TContext {
  const baseContext: BaseContext = {
    [MIDDLEWARE_CONTEXT_SYMBOL]: true,
    methodName,
    originalArgs: originalCallArgs
  }
  
  if (specificContextFactory) {
    return specificContextFactory(baseContext, originalCallArgs)
  }
  return baseContext as TContext
}

// CompletionsContext 工厂
const completionsContextFactory = (
  base: BaseContext,
  callArgs: [CompletionsParams]
): CompletionsContext => {
  return {
    ...base,
    methodName: 'completions',
    apiClientInstance: originalApiClientInstance,
    originalArgs: callArgs,
    _internal: {
      toolProcessingState: {
        recursionDepth: 0,
        isRecursiveCall: false
      },
      observer: {}
    }
  }
}
```

### 3. 完整示例

```typescript
// ========== 中间件1：参数转换 ==========
export const TransformCoreToSdkParamsMiddleware: CompletionsMiddleware =
  () =>
  (next) =>
  async (ctx: CompletionsContext, params: CompletionsParams): Promise<CompletionsResult> => {
    const apiClient = ctx.apiClientInstance
    
    // 转换参数
    const requestTransformer = apiClient.getRequestTransformer()
    const transformResult = await requestTransformer.transform(
      params,
      params.assistant,
      params.assistant.model!
    )
    
    // 存储到上下文
    ctx._internal.sdkPayload = transformResult.payload
    
    return next(ctx, params)
  }

// ========== 中间件2：工具调用处理 ==========
export const McpToolChunkMiddleware: CompletionsMiddleware =
  () =>
  (next) =>
  async (ctx: CompletionsContext, params: CompletionsParams): Promise<CompletionsResult> => {
    const mcpTools = params.mcpTools || []
    
    if (mcpTools.length === 0) {
      return next(ctx, params)
    }
    
    // 处理工具调用
    const result = await next(ctx, params)
    
    // 检查工具调用结果
    if (result.stream) {
      // 处理流式响应中的工具调用
      // ...
    }
    
    return result
  }

// ========== 中间件3：最终消费 ==========
export const FinalChunkConsumerMiddleware: CompletionsMiddleware =
  () =>
  (next) =>
  async (ctx: CompletionsContext, params: CompletionsParams): Promise<CompletionsResult> => {
    // 初始化累计数据
    if (!ctx._internal.observer) {
      ctx._internal.observer = {
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        metrics: {
          completion_tokens: 0,
          time_completion_millsec: 0,
          time_first_token_millsec: 0
        }
      }
    }
    
    // 调用下游中间件
    const result = await next(ctx, params)
    
    // 处理流式响应
    if (result.stream) {
      // 消费流并累积数据
      // ...
    }
    
    return result
  }

// ========== 中间件链组合 ==========
export function applyCompletionsMiddlewares(
  originalApiClientInstance: BaseApiClient,
  originalCompletionsMethod: (payload: any) => Promise<any>,
  middlewares: CompletionsMiddleware[]
): (params: CompletionsParams) => Promise<CompletionsResult> {
  return async function enhancedCompletionsMethod(
    params: CompletionsParams
  ): Promise<CompletionsResult> {
    // 创建上下文
    const ctx = createInitialCallContext(
      'completions',
      [params],
      completionsContextFactory
    )
    
    // 创建中间件 API
    const api: MiddlewareAPI<CompletionsContext, [CompletionsParams]> = {
      getContext: () => ctx,
      getOriginalArgs: () => [params]
    }
    
    // 组合中间件链
    const chain = middlewares.map((middleware) => middleware(api))
    const composedMiddlewareLogic = compose(...chain)
    
    // 执行中间件链
    return composedMiddlewareLogic(ctx, params)
  }
}
```

### 4. CompletionsContext 特点

**优点：**
- ✅ 类型安全：TypeScript 泛型确保类型安全
- ✅ 职责清晰：不变部分和可变部分分离
- ✅ 扩展性强：通过 `customState` 支持扩展
- ✅ 递归支持：通过 `enhancedDispatch` 支持递归调用

**缺点：**
- ❌ 需要显式传递：在深层调用中需要传递 ctx 和 params
- ❌ 复杂度较高：三层嵌套函数，理解成本较高
- ❌ TypeScript 专用：依赖 TypeScript 类型系统

---

## 对比分析

### 1. 架构对比表

| 特性 | FastAPI | Koa | CompletionsContext |
|------|---------|-----|-------------------|
| **传递方式** | 依赖注入 + ContextVar | 函数参数 | 函数参数 |
| **状态存储** | `request.state` | `ctx.state` | `ctx._internal` |
| **全局访问** | ✅ ContextVar | ❌ | ❌ |
| **类型安全** | ✅ Python 类型注解 | ⚠️ 可选 TypeScript | ✅ 严格 TypeScript |
| **依赖注入** | ✅ `Depends()` | ❌ | ❌ |
| **异步支持** | ✅ 原生支持 | ✅ 原生支持 | ✅ 原生支持 |
| **中间件模式** | HTTP 中间件 | 洋葱模型 | 三层嵌套函数 |
| **学习曲线** | 中等 | 简单 | 较陡 |
| **适用场景** | Python Web 应用 | Node.js Web 应用 | TypeScript 业务逻辑 |

### 2. 代码复杂度对比

#### FastAPI（中等复杂度）

```python
# 需要设置 ContextVar 和中间件
request_var: ContextVar[Optional[Request]] = ContextVar('request', default=None)

@app.middleware("http")
async def capture_request(request: Request, call_next):
    token = request_var.set(request)
    try:
        return await call_next(request)
    finally:
        request_var.reset(token)

def get_request() -> Request:
    return request_var.get()
```

#### Koa（简单）

```typescript
// 直接使用 ctx，无需额外设置
app.use(async (ctx, next) => {
  ctx.state.requestId = 'req-123'
  await next()
})
```

#### CompletionsContext（复杂）

```typescript
// 三层嵌套函数
export const Middleware: CompletionsMiddleware =
  () =>
  (next) =>
  async (ctx: CompletionsContext, params: CompletionsParams) => {
    // 处理逻辑
    return next(ctx, params)
  }
```

### 3. 使用场景对比

#### FastAPI 适用场景

- ✅ Python Web API 开发
- ✅ 需要依赖注入的场景
- ✅ 需要全局访问请求信息的场景
- ✅ 需要类型安全的 API 开发

#### Koa 适用场景

- ✅ Node.js Web 应用开发
- ✅ 需要简单中间件链的场景
- ✅ RESTful API 开发
- ✅ 需要灵活组合中间件的场景

#### CompletionsContext 适用场景

- ✅ TypeScript 业务逻辑处理
- ✅ 需要严格类型安全的场景
- ✅ 复杂的数据转换和处理流程
- ✅ AI/ML 相关的业务逻辑

---

## 最佳实践

### 1. FastAPI 最佳实践

```python
# ✅ 推荐：使用 ContextVar 实现全局访问
from contextvars import ContextVar

request_var: ContextVar[Optional[Request]] = ContextVar('request', default=None)

@app.middleware("http")
async def capture_request(request: Request, call_next):
    token = request_var.set(request)
    try:
        return await call_next(request)
    finally:
        request_var.reset(token)

def get_request() -> Request:
    return request_var.get()

# ✅ 推荐：使用依赖注入组合上下文
async def get_user_context(
    request: Request = Depends(get_request),
    user: dict = Depends(get_current_user),
    db: dict = Depends(get_db)
):
    return {
        "request_id": request.state.request_id,
        "user": user,
        "db": db
    }

# ❌ 不推荐：直接传递 Request 到深层函数
def deep_function(request: Request):  # 需要手动传递
    pass
```

### 2. Koa 最佳实践

```typescript
// ✅ 推荐：使用 ctx.state 存储状态
app.use(async (ctx, next) => {
  ctx.state.requestId = generateId()
  await next()
})

// ✅ 推荐：使用中间件组合功能
app.use(authMiddleware)
app.use(loggingMiddleware)
app.use(businessLogicMiddleware)

// ❌ 不推荐：使用全局变量存储请求信息
let currentRequest: Context | null = null  // 不安全
```

### 3. CompletionsContext 最佳实践

```typescript
// ✅ 推荐：使用 _internal 存储可变状态
ctx._internal.customState = {
  requestId: 'req-123',
  startTime: Date.now()
}

// ✅ 推荐：使用类型安全的上下文访问
function processWithContext(ctx: CompletionsContext) {
  const payload = ctx._internal.sdkPayload
  const apiClient = ctx.apiClientInstance
  // 类型安全
}

// ❌ 不推荐：直接修改不变部分
ctx.apiClientInstance = newApiClient()  // 不应该修改
```

---

## 实际应用示例

### 示例1：请求追踪（三种方式对比）

#### FastAPI

```python
from contextvars import ContextVar

request_var: ContextVar[Optional[Request]] = ContextVar('request', default=None)

@app.middleware("http")
async def track_request(request: Request, call_next):
    request.state.request_id = f"req-{uuid.uuid4().hex[:8]}"
    token = request_var.set(request)
    try:
        return await call_next(request)
    finally:
        request_var.reset(token)

def get_request() -> Request:
    return request_var.get()

# 在任何地方使用
def log_request(message: str):
    request = get_request()
    print(f"[{request.state.request_id}] {message}")
```

#### Koa

```typescript
app.use(async (ctx, next) => {
  ctx.state.requestId = `req-${Date.now()}`
  await next()
})

// 需要显式传递 ctx
function logRequest(ctx: Koa.Context, message: string) {
  console.log(`[${ctx.state.requestId}] ${message}`)
}
```

#### CompletionsContext

```typescript
export const LoggingMiddleware: CompletionsMiddleware =
  () =>
  (next) =>
  async (ctx: CompletionsContext, params: CompletionsParams) => {
    const requestId = ctx._internal.customState?.requestId || `req-${Date.now()}`
    
    function logRequest(message: string) {
      console.log(`[${requestId}] ${message}`)
    }
    
    logRequest('Request started')
    const result = await next(ctx, params)
    logRequest('Request completed')
    
    return result
  }
```

### 示例2：认证和授权

#### FastAPI

```python
async def get_current_user(request: Request = Depends(get_request)):
    token = request.headers.get("Authorization")
    if token:
        user = decode_token(token)
        return user
    raise HTTPException(status_code=401)

@app.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):
    return {"user": user}
```

#### Koa

```typescript
app.use(async (ctx, next) => {
  const token = ctx.headers.authorization
  if (token) {
    ctx.state.user = decodeToken(token)
  } else {
    ctx.status = 401
    return
  }
  await next()
})

app.use(async (ctx) => {
  const user = ctx.state.user
  ctx.body = { user }
})
```

#### CompletionsContext

```typescript
export const AuthMiddleware: CompletionsMiddleware =
  () =>
  (next) =>
  async (ctx: CompletionsContext, params: CompletionsParams) => {
    const token = params.headers?.authorization
    
    if (token) {
      const user = decodeToken(token)
      ctx._internal.customState = {
        ...ctx._internal.customState,
        user
      }
      return next(ctx, params)
    } else {
      throw new Error('Unauthorized')
    }
  }
```

---


