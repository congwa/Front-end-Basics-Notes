# FastAPI 的主要特性

1. **高性能**
   - 基于 Starlette 和 Pydantic
   - 性能与 NodeJS 和 Go 相当
   - 支持异步编程（async/await）

2. **快速开发**

   ```python
   from fastapi import FastAPI
   
   app = FastAPI()
   
   @app.get("/")
   async def root():
       return {"message": "Hello World"}
   ```

3. **自动文档生成**
   - 访问 `/docs` 获取 Swagger UI 文档
   - 访问 `/redoc` 获取 ReDoc 文档
   - 自动根据代码生成 OpenAPI (Swagger) 规范

4. **类型提示和验证**

   ```python
   from pydantic import BaseModel
   
   class User(BaseModel):
       username: str
       email: str
       age: int
   
   @app.post("/users/")
   async def create_user(user: User):
       return user
   ```

   - 自动数据验证
   - 自动完成类型转换
   - IDE 支持自动补全

5. **依赖注入系统**

   ```python
   from fastapi import Depends
   
   async def get_db():
       db = DBSession()
       try:
           yield db
       finally:
           db.close()
   
   @app.get("/items/")
   async def read_items(db = Depends(get_db)):
       return db.query(Item).all()
   ```

6. **安全特性**
   - 支持 OAuth2
   - JWT tokens
   - HTTP Basic auth
   - API keys

   ```python
   from fastapi.security import OAuth2PasswordBearer
   
   oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
   
   @app.get("/users/me")
   async def read_users_me(token: str = Depends(oauth2_scheme)):
       return {"token": token}
   ```

7. **WebSocket 支持**

   ```python
   @app.websocket("/ws")
   async def websocket_endpoint(websocket: WebSocket):
       await websocket.accept()
       while True:
           data = await websocket.receive_text()
           await websocket.send_text(f"Message received: {data}")
   ```

8. **后台任务**

   ```python
   from fastapi import BackgroundTasks
   
   def write_log(message: str):
       with open("log.txt", "a") as f:
           f.write(message)
   
   @app.post("/send-notification/")
   async def send_notification(
       background_tasks: BackgroundTasks
   ):
       background_tasks.add_task(write_log, "some notification")
       return {"message": "Notification sent"}
   ```

9. **中间件支持**

   ```python
   @app.middleware("http")
   async def add_process_time_header(request, call_next):
       start_time = time.time()
       response = await call_next(request)
       process_time = time.time() - start_time
       response.headers["X-Process-Time"] = str(process_time)
       return response
   ```

10. **CORS 支持**

    ```python
    from fastapi.middleware.cors import CORSMiddleware
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    ```

11. **文件上传处理**

    ```python
    from fastapi import File, UploadFile
    
    @app.post("/uploadfile/")
    async def create_upload_file(file: UploadFile = File(...)):
        return {"filename": file.filename}
    ```

12. **路径参数和查询参数**

    ```python
    @app.get("/items/{item_id}")
    async def read_item(
        item_id: int, 
        q: str | None = None, 
        skip: int = 0, 
        limit: int = 10
    ):
        return {"item_id": item_id, "q": q, "skip": skip, "limit": limit}
    ```

## 统一返回格式

```py
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

# 定义泛型类型
T = TypeVar("T")

# 统一响应模型
class ResponseModel(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

# 用户模型
class User(BaseModel):
    username: str
    email: str
    age: int

@app.post("/users/")
async def create_user(user: User) -> ResponseModel[User]:
    # 使用统一的响应格式
    return ResponseModel(
        code=200,
        message="用户创建成功",
        data=user
    )
```

简化

```py
def success_response(data: T = None, message: str = "success") -> ResponseModel[T]:
    return ResponseModel(
        code=200,
        message=message,
        data=data
    )

def error_response(code: int = 400, message: str = "error") -> ResponseModel:
    return ResponseModel(
        code=code,
        message=message
    )

@app.post("/users/")
async def create_user(user: User) -> ResponseModel[User]:
    # 使用工具函数返回响应
    return success_response(user, "用户创建成功")

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    if user_id <= 0:
        return error_response(400, "无效的用户ID")
    # ... 其他逻辑
```

## datetime 类型的字段时，最好进行格式化处理

1. **使用 Pydantic 的 Config 类配置**：
    > 如果所有 datetime 字段都使用相同的格式，使用 Config 方式最简单

```python
from datetime import datetime
from pydantic import BaseModel

class User(BaseModel):
    username: str
    email: str
    age: int
    created_at: datetime
    
    class Config:
        # 配置 JSON 序列化时的日期格式
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d %H:%M:%S")
        }
```

2. **使用 Pydantic 的 Field 配置**：

 >如果需要在序列化时进行更多自定义处理，可以重写 dict 方法

```python
from datetime import datetime
from pydantic import BaseModel, Field

class User(BaseModel):
    username: str
    email: str
    age: int
    created_at: datetime = Field(default_factory=datetime.now)
    
    # 自定义序列化方法
    def dict(self, *args, **kwargs):
        data = super().dict(*args, **kwargs)
        data['created_at'] = self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        return data
```

3. **结合统一响应格式的完整示例**：

```python
from datetime import datetime
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

T = TypeVar("T")

class ResponseModel(GenericModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

class User(BaseModel):
    username: str
    email: str
    age: int
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d %H:%M:%S")
        }

@app.post("/users/")
async def create_user(user: User) -> ResponseModel[User]:
    return ResponseModel(
        code=200,
        message="用户创建成功",
        data=user
    )
```

返回的数据会是这样的格式：

```json
{
    "code": 200,
    "message": "用户创建成功",
    "data": {
        "username": "张三",
        "email": "zhangsan@example.com",
        "age": 25,
        "created_at": "2023-12-20 15:30:00",
        "updated_at": "2023-12-20 15:30:00"
    }
}
```

如果你需要更细粒度的控制，还可以：

4. **自定义日期格式的字段**：
   >如果需要对不同字段使用不同的格式，使用 validator 装饰器更灵活

```python
from pydantic import BaseModel, validator

class User(BaseModel):
    username: str
    email: str
    age: int
    created_at: datetime
    
    @validator('created_at')
    def format_datetime(cls, v):
        return v.strftime("%Y-%m-%d %H:%M:%S")
```

## FastAPI 在返回响应时会将对象序列化为 JSON，而 Python 的 datetime 对象默认情况下不能直接被 JSON 序列化

```py
from datetime import datetime
from pydantic import BaseModel

class User(BaseModel):
    username: str
    email: str
    age: int
    created_at: datetime
    
    # 如果不配置，直接返回会出现错误
    # JSON serialization error: Object of type datetime is not JSON serializable
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d %H:%M:%S")
        }

@app.post("/users/")
async def create_user(user: User):
    return user  # 直接返回也需要格式化
```

也可以直接对 user 进行 model_dump 格式化

```py
...
@app.post("/users/")
async def create_user(user: User):
    return user.model_dump(mode=json) # 注意：有些版本默认值是python模式，这里需要改成json模式
```

fastapi返回模型的时候会自动调用model_dump方法，所以可以使用以下方式默认json模式

```py
from pydantic import BaseModel
from typing import Any

class CustomBaseModel(BaseModel):
    def model_dump(self, **kwargs) -> dict[str, Any]:
        # 如果没有指定 mode，则默认使用 'json'
        if 'mode' not in kwargs:
            kwargs['mode'] = 'json'
        return super().model_dump(**kwargs)

# 使用自定义基础模型
class User(CustomBaseModel):  # 继承 CustomBaseModel 而不是 BaseModel
    username: str
    email: str
    age: int

@app.post("/users/")
async def create_user(user: User):
    return user.model_dump() # 注意：现在这里一定是json模式
```

##  SQLAlchemy ORM 模型转换到 Pydantic 模型的两种主要方式：

### 1. orm_mode/from_orm 方式（Pydantic v1 风格）

```python
class UserModel(BaseModel):
    id: int
    name: str
    
    class Config:
        orm_mode = True

# 使用方式
user_model = UserModel.from_orm(db_user)
```

特点：

- 传统方式，向后兼容性好
- 配置较为简单
- 适合 Pydantic v1 版本
- 性能相对较低

### 2. model_validate 方式（Pydantic v2 风格）

```python
class UserModel(BaseModel):
    id: int
    name: str
    
    # from_attributes 定义了从orm模型获取属性的方式
    model_config = ConfigDict(from_attributes=True)

    # 当 from_attributes=False 时（默认）
    user = UserModel.model_validate(db_user.__dict__)  # 需要转换为字典

# 使用方式
user_model = UserModel.model_validate(db_user)
```

特点：

- Pydantic v2 推荐方式
- 性能更优（比 v1 快约 50%）
- 类型提示更完善
- 错误处理更强大
- 配置更灵活

### 主要区别：

1. **性能表现**：
   - `model_validate` 性能明显优于 `from_orm`
   - 特别是在处理大量数据时差异更明显

2. **语法风格**：
   - `from_orm`: 使用内部 Config 类配置
   - `model_validate`: 使用 model_config 类变量配置

3. **错误处理**：
   - `model_validate` 提供更详细的验证错误信息
   - 错误追踪更容易

4. **使用场景**：
   - `from_orm`: 适合旧项目或需要兼容性的场景
   - `model_validate`: 适合新项目或性能要求高的场景

### 建议：

1. **新项目选择**：
   - 优先使用 `model_validate`
   - 采用 Pydantic v2 的新特性