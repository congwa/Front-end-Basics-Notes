
# LangChain验证重试机制实现

## 1. 基础重试实现

```python
from langchain.output_parsers import PydanticOutputParser, RetryWithErrorOutputParser
from langchain.chat_models import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List

class UserProfile(BaseModel):
    name: str = Field(description="用户名")
    age: int = Field(description="年龄", gt=0, lt=150)
    interests: List[str] = Field(description="兴趣爱好")

# 基础重试实现
def create_retry_chain():
    # 1. 创建基础解析器
    base_parser = PydanticOutputParser(pydantic_object=UserProfile)
    
    # 2. 创建重试解析器
    retry_parser = RetryWithErrorOutputParser.from_parser(
        parser=base_parser,
        max_retries=3,
        stop_on_error=False  # 是否在错误时停止
    )
    
    # 3. 创建提示模板
    prompt = PromptTemplate(
        template="""
        生成一个用户信息。
        {format_instructions}
        
        如果有错误，这是错误信息：{error}
        请修正并重新生成。
        """,
        input_variables=["error"],
        partial_variables={"format_instructions": base_parser.get_format_instructions()}
    )
    
    # 4. 创建链
    chain = (
        prompt 
        | ChatOpenAI(temperature=0) 
        | retry_parser
    )
    
    return chain
```

## 2. 自定义重试逻辑

```python
from langchain.output_parsers import OutputParser
from typing import Optional, Any

class CustomRetryParser(OutputParser):
    def __init__(self, base_parser: OutputParser, max_retries: int = 3):
        self.base_parser = base_parser
        self.max_retries = max_retries
        
    async def parse_with_retry(self, text: str, llm: Any) -> Any:
        attempts = 0
        last_error = None
        
        while attempts < self.max_retries:
            try:
                return self.base_parser.parse(text)
            except Exception as e:
                attempts += 1
                last_error = str(e)
                
                if attempts < self.max_retries:
                    # 生成修正提示
                    correction_prompt = self._generate_correction_prompt(last_error)
                    # 重新调用LLM
                    text = await llm.agenerate([correction_prompt])
                    text = text.generations[0].text
                    
        raise ValueError(f"达到最大重试次数。最后错误: {last_error}")
        
    def _generate_correction_prompt(self, error: str) -> str:
        return f"""
        前次生成的输出有误。错误信息：{error}
        请注意：
        1. 确保输出是有效的JSON格式
        2. 所有字段类型必须正确
        3. 所有必填字段都要包含
        请重新生成正确的格式。
        """
```

## 3. 高级重试策略

```python
from dataclasses import dataclass
from typing import Callable, Optional

@dataclass
class RetryStrategy:
    max_retries: int
    backoff_factor: float = 1.5
    error_handler: Optional[Callable] = None
    validation_rules: List[Callable] = None

class AdvancedRetryParser:
    def __init__(
        self,
        base_parser: PydanticOutputParser,
        strategy: RetryStrategy
    ):
        self.base_parser = base_parser
        self.strategy = strategy
        
    async def parse_with_advanced_retry(
        self,
        text: str,
        llm: Any
    ) -> Any:
        attempts = 0
        delay = 1.0  # 初始延迟
        
        while attempts < self.strategy.max_retries:
            try:
                # 1. 基础解析
                parsed_data = self.base_parser.parse(text)
                
                # 2. 自定义验证规则
                if self.strategy.validation_rules:
                    for rule in self.strategy.validation_rules:
                        rule(parsed_data)
                        
                return parsed_data
                
            except Exception as e:
                attempts += 1
                
                # 错误处理
                if self.strategy.error_handler:
                    self.strategy.error_handler(e, attempts)
                
                if attempts < self.strategy.max_retries:
                    # 指数退避
                    await asyncio.sleep(delay)
                    delay *= self.strategy.backoff_factor
                    
                    # 生成新的提示
                    text = await self._get_corrected_text(text, str(e), llm)
                else:
                    raise MaxRetriesExceeded(
                        f"达到最大重试次数 {self.strategy.max_retries}"
                    )
```

## 4. 实际使用示例

```python
# 1. 定义验证规则
def validate_age_range(data: UserProfile):
    if not (18 <= data.age <= 100):
        raise ValueError("年龄必须在18-100之间")

def validate_interests(data: UserProfile):
    if len(data.interests) < 2:
        raise ValueError("兴趣爱好至少需要2个")

# 2. 创建重试策略
strategy = RetryStrategy(
    max_retries=3,
    backoff_factor=2.0,
    validation_rules=[validate_age_range, validate_interests]
)

# 3. 使用示例
async def get_user_profile():
    parser = AdvancedRetryParser(
        base_parser=PydanticOutputParser(pydantic_object=UserProfile),
        strategy=strategy
    )
    
    llm = ChatOpenAI(temperature=0)
    
    try:
        result = await parser.parse_with_advanced_retry(
            "生成一个用户信息",
            llm
        )
        return result
    except Exception as e:
        print(f"处理失败: {e}")
        return None
```

## 5. 错误处理和日志记录

```python
import logging
from datetime import datetime

class RetryLogger:
    def __init__(self):
        self.logger = logging.getLogger("retry_logger")
        self.setup_logging()
        
    def setup_logging(self):
        handler = logging.FileHandler("retry_log.txt")
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
    def log_retry_attempt(
        self,
        attempt: int,
        error: str,
        original_text: str,
        retry_text: str
    ):
        self.logger.info(
            f"""
            重试尝试 #{attempt}
            错误: {error}
            原始文本: {original_text}
            重试文本: {retry_text}
            时间: {datetime.now()}
            """
        )
```

## 6. 完整使用示例

```python
async def main():
    # 1. 设置日志记录
    logger = RetryLogger()
    
    # 2. 定义错误处理器
    def error_handler(error: Exception, attempt: int):
        logger.log_retry_attempt(
            attempt,
            str(error),
            "原始提示",
            "重试提示"
        )
    
    # 3. 创建重试策略
    strategy = RetryStrategy(
        max_retries=3,
        backoff_factor=2.0,
        error_handler=error_handler,
        validation_rules=[validate_age_range, validate_interests]
    )
    
    # 4. 创建解析器
    parser = AdvancedRetryParser(
        base_parser=PydanticOutputParser(pydantic_object=UserProfile),
        strategy=strategy
    )
    
    # 5. 执行
    try:
        result = await parser.parse_with_advanced_retry(
            "生成一个用户信息",
            ChatOpenAI(temperature=0)
        )
        print("成功:", result)
    except Exception as e:
        print("最终失败:", e)

# 运行
if __name__ == "__main__":
    asyncio.run(main())

# 1. 可配置的重试次数
# 2. 指数退避策略
# 3. 自定义验证规则
# 4. 错误处理和日志记录
# 5. 异步支持
# 6. 灵活的重试策略

```

