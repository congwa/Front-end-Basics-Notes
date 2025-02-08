

# Instructor 验证重试实现

## 1. 基础重试装饰器方式

```python
from instructor import patch
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List

# 使用retry装饰器
from instructor import retry

@retry(max_retries=3)  # 最简单的重试方式
class UserProfile(BaseModel):
    name: str = Field(description="用户名")
    age: int = Field(gt=0, lt=150, description="年龄")
    interests: List[str] = Field(description="兴趣爱好")

# 使用示例
client = patch(OpenAI())
try:
    user = client.chat.completions.create(
        model="gpt-3.5-turbo",
        response_model=UserProfile,
        messages=[{"role": "user", "content": "生成用户信息"}]
    )
except Exception as e:
    print(f"所有重试都失败了: {e}")
```

## 2. 自定义重试逻辑

```python
from instructor import patch, retry
from functools import partial

# 自定义重试装饰器
def custom_retry(
    max_retries: int = 3,
    backoff_factor: float = 1.5,
    validation_rules: List[callable] = None
):
    def decorator(cls):
        # 自定义验证函数
        def validate_instance(instance):
            if validation_rules:
                for rule in validation_rules:
                    rule(instance)
            return instance

        # 重试逻辑
        @retry(
            max_retries=max_retries,
            on_retry=lambda e, attempt: print(f"重试 #{attempt}, 错误: {e}")
        )
        class WrappedClass(cls):
            def __init__(self, **data):
                super().__init__(**data)
                validate_instance(self)

        return WrappedClass
    return decorator

# 使用自定义重试装饰器
@custom_retry(
    max_retries=3,
    backoff_factor=2.0,
    validation_rules=[
        lambda x: assert x.age >= 18, "年龄必须大于18岁",
        lambda x: assert len(x.interests) >= 2, "至少需要2个兴趣爱好"
    ]
)
class UserProfile(BaseModel):
    name: str
    age: int
    interests: List[str]
```

## 3. 高级重试实现

```python
from instructor import patch
from openai import OpenAI
from pydantic import BaseModel, Field, validator
import asyncio
from typing import Optional, Any

class RetryConfig:
    def __init__(
        self,
        max_retries: int = 3,
        backoff_factor: float = 1.5,
        error_callback: Optional[callable] = None
    ):
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.error_callback = error_callback

class AdvancedRetryModel(BaseModel):
    _retry_config: RetryConfig = RetryConfig()
    
    @classmethod
    def with_retry(
        cls,
        max_retries: int = 3,
        backoff_factor: float = 1.5,
        error_callback: Optional[callable] = None
    ):
        cls._retry_config = RetryConfig(
            max_retries=max_retries,
            backoff_factor=backoff_factor,
            error_callback=error_callback
        )
        return cls

    @classmethod
    async def create_with_retry(
        cls,
        client: Any,
        prompt: str,
        **kwargs
    ):
        attempts = 0
        delay = 1.0
        last_error = None

        while attempts < cls._retry_config.max_retries:
            try:
                response = await client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    response_model=cls,
                    messages=[{"role": "user", "content": prompt}],
                    **kwargs
                )
                return response
                
            except Exception as e:
                attempts += 1
                last_error = e
                
                if cls._retry_config.error_callback:
                    cls._retry_config.error_callback(e, attempts)
                
                if attempts < cls._retry_config.max_retries:
                    await asyncio.sleep(delay)
                    delay *= cls._retry_config.backoff_factor
                    continue
                    
        raise Exception(f"达到最大重试次数。最后错误: {last_error}")

# 使用示例
class UserProfile(AdvancedRetryModel):
    name: str
    age: int = Field(gt=0, lt=150)
    interests: List[str]
    
    @validator('interests')
    def validate_interests(cls, v):
        if len(v) < 2:
            raise ValueError("至少需要2个兴趣爱好")
        return v
```

## 4. 实际使用示例

```python
async def main():
    client = patch(OpenAI())
    
    # 配置错误回调
    def error_handler(error: Exception, attempt: int):
        print(f"尝试 #{attempt} 失败")
        print(f"错误: {error}")
        print("正在重试...")

    # 使用高级重试模型
    UserProfileWithRetry = UserProfile.with_retry(
        max_retries=3,
        backoff_factor=2.0,
        error_callback=error_handler
    )

    try:
        user = await UserProfileWithRetry.create_with_retry(
            client=client,
            prompt="生成一个用户信息，包含姓名、年龄和兴趣爱好"
        )
        print("成功:", user)
        
    except Exception as e:
        print("最终失败:", e)

# 运行
if __name__ == "__main__":
    asyncio.run(main())
```

## 5. 带上下文的重试实现

```python
from contextlib import contextmanager
import time

class RetryContext:
    def __init__(self, model_class: BaseModel):
        self.model_class = model_class
        self.start_time = None
        self.attempts = 0
        self.errors = []

    def record_attempt(self, error: Optional[Exception] = None):
        self.attempts += 1
        if error:
            self.errors.append(error)

    def get_stats(self):
        return {
            "attempts": self.attempts,
            "duration": time.time() - self.start_time if self.start_time else 0,
            "errors": self.errors
        }

@contextmanager
def retry_context(model_class: BaseModel):
    context = RetryContext(model_class)
    context.start_time = time.time()
    try:
        yield context
    finally:
        stats = context.get_stats()
        print(f"重试统计: {stats}")

# 使用示例
async def create_user_with_context():
    client = patch(OpenAI())
    
    with retry_context(UserProfile) as ctx:
        try:
            user = await UserProfile.create_with_retry(
                client=client,
                prompt="生成用户信息",
                context=ctx
            )
            return user
        except Exception as e:
            ctx.record_attempt(e)
            raise
```

## 6. 批量处理的重试实现

```python
class BatchRetryProcessor:
    def __init__(
        self,
        model_class: BaseModel,
        max_retries: int = 3,
        concurrent_limit: int = 5
    ):
        self.model_class = model_class
        self.max_retries = max_retries
        self.concurrent_limit = concurrent_limit
        
    async def process_batch(
        self,
        client: Any,
        prompts: List[str]
    ) -> List[tuple[Any, Optional[Exception]]]:
        semaphore = asyncio.Semaphore(self.concurrent_limit)
        
        async def process_single(prompt: str):
            async with semaphore:
                try:
                    result = await self.model_class.create_with_retry(
                        client=client,
                        prompt=prompt,
                        max_retries=self.max_retries
                    )
                    return (result, None)
                except Exception as e:
                    return (None, e)
                    
        tasks = [process_single(prompt) for prompt in prompts]
        return await asyncio.gather(*tasks)

# 批量处理示例
async def process_multiple_users():
    client = patch(OpenAI())
    processor = BatchRetryProcessor(UserProfile)
    
    prompts = [
        "生成用户1的信息",
        "生成用户2的信息",
        "生成用户3的信息"
    ]
    
    results = await processor.process_batch(client, prompts)
    
    for i, (result, error) in enumerate(results):
        if error:
            print(f"用户 {i+1} 处理失败: {error}")
        else:
            print(f"用户 {i+1} 处理成功: {result}")


```

1. 简单的装饰器方式重试
2. 自定义重试逻辑
3. 高级重试功能（退避策略、错误回调等）
4. 上下文管理
5. 批量处理支持
6. 详细的错误处理和日志记录
