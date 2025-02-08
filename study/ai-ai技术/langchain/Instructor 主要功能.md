
# Instructor 主要功能解析

## 1. 基础类型验证和转换

```python
from instructor import Mode
from pydantic import BaseModel

class UserProfile(BaseModel):
    name: str
    age: int
    email: str

# 基础使用
client = OpenAI()
instructor_client = instructor.patch(client, mode=Mode.JSON)

# 直接获取验证后的对象
user = instructor_client.chat.completions.create(
    model="gpt-3.5-turbo",
    response_model=UserProfile,
    messages=[{"role": "user", "content": "生成一个用户信息"}]
)
```

## 2. 高级验证功能

### 2.1 嵌套模型验证

```python
class Address(BaseModel):
    street: str
    city: str
    country: str

class User(BaseModel):
    name: str
    addresses: list[Address]  # 嵌套模型
```

### 2.2 枚举和限制验证

```python
from enum import Enum
from pydantic import Field

class UserType(str, Enum):
    ADMIN = "admin"
    USER = "user"

class User(BaseModel):
    type: UserType
    age: int = Field(gt=0, lt=150)  # 年龄限制
    score: float = Field(ge=0, le=100)  # 分数范围
```

## 3. 特殊功能

### 3.1 部分响应验证

```python
from instructor import partial

@partial()  # 允许部分字段验证
class ComplexUser(BaseModel):
    name: str
    age: int | None = None
    email: str | None = None
```

### 3.2 验证模式选择

```python
# JSON 模式
client = instructor.patch(client, mode=Mode.JSON)

# Markdown 模式
client = instructor.patch(client, mode=Mode.MARKDOWN)

# 工具模式
client = instructor.patch(client, mode=Mode.TOOLS)
```

### 3.3 重试机制

```python
from instructor import retry

@retry()  # 自动重试装饰器
class UserWithRetry(BaseModel):
    name: str
    age: int
```

## 4. 高级特性

### 4.1 自定义验证器

```python
from pydantic import validator
from typing import List

class Article(BaseModel):
    title: str
    tags: List[str]

    @validator('tags')
    def validate_tags(cls, v):
        return [tag.lower() for tag in v]
```

### 4.2 异步支持

```python
async def get_user_async():
    async_client = instructor.patch(AsyncOpenAI())
    user = await async_client.chat.completions.create(
        model="gpt-3.5-turbo",
        response_model=UserProfile,
        messages=[{"role": "user", "content": "生成用户信息"}]
    )
    return user
```

### 4.3 流式处理

```python
from instructor import Stream

class StreamResponse(BaseModel):
    content: str

# 流式处理
for chunk in instructor_client.chat.completions.create(
    model="gpt-3-turbo",
    response_model=Stream[StreamResponse],
    messages=[{"role": "user", "content": "长文本生成"}]
):
    print(chunk.content)
```

## 5. 工具和辅助功能

### 5.1 分类和标记

```python
from typing import Literal

class Classification(BaseModel):
    category: Literal["正面", "负面", "中性"]
    confidence: float
```

### 5.2 结构化输出

```python
class SearchResult(BaseModel):
    query: str
    results: List[str]
    total_count: int
    metadata: dict = {}
```

### 5.3 错误处理

```python
from instructor import ValidationError

try:
    result = instructor_client.chat.completions.create(
        model="gpt-3.5-turbo",
        response_model=UserProfile,
        messages=[{"role": "user", "content": "生成用户"}]
    )
except ValidationError as e:
    print(f"验证错误: {e}")
```

## 6. 实用场景

### 6.1 数据提取

```python
class DataExtractor(BaseModel):
    keywords: List[str]
    summary: str
    sentiment: Literal["positive", "negative", "neutral"]
```

### 6.2 格式转换

```python
class FormatConverter(BaseModel):
    markdown: str
    html: str
    plain_text: str
```

### 6.3 内容分析

```python
class ContentAnalysis(BaseModel):
    main_topics: List[str]
    key_points: List[str]
    recommendations: List[str]
```
