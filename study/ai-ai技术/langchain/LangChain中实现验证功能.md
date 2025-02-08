
# LangChain中实现类似的验证功能

在LangChain中实现类似的验证功能，主要通过`OutputParser`和`StructuredOutputParser`来实现。让我解释一下验证的实现方式：

## 1. 基础验证实现

- 基础验证
  
```python
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List

# 定义输出模型
class UserProfile(BaseModel):
    name: str = Field(description="用户名称")
    age: int = Field(description="用户年龄", gt=0, lt=150)
    email: str = Field(description="电子邮件地址")

# 创建解析器
parser = PydanticOutputParser(pydantic_object=UserProfile)

# 创建提示模板
prompt = PromptTemplate(
    template="生成一个用户信息。\n{format_instructions}\n",
    input_variables=[],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 创建链
chain = prompt | ChatOpenAI() | parser

# 执行
try:
    result = chain.invoke({})
    print(result)  # 返回UserProfile对象
except Exception as e:
    print(f"验证失败: {e}")
```

- **部分响应验证实现**

```py
from langchain.output_parsers import PydanticOutputParser
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import Optional

# 定义可选字段的模型
class PartialUserProfile(BaseModel):
    name: str  # 必填字段
    age: Optional[int] = None  # 可选字段
    email: Optional[str] = None  # 可选字段
    bio: Optional[str] = None  # 可选字段

# 创建解析器
parser = PydanticOutputParser(pydantic_object=PartialUserProfile)

# 使用示例
prompt = PromptTemplate(
    template="生成用户信息，只需要包含姓名和年龄。\n{format_instructions}",
    input_variables=[],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 创建链
chain = prompt | ChatOpenAI() | parser

# 执行
result = chain.invoke({})
```

## 2. 复杂验证实现

```python
from langchain.output_parsers import RetryWithErrorOutputParser
from langchain.schema import StrOutputParser

# 嵌套模型验证
class Address(BaseModel):
    street: str = Field(description="街道地址")
    city: str = Field(description="城市")
    country: str = Field(description="国家")

class User(BaseModel):
    name: str = Field(description="用户名")
    addresses: List[Address] = Field(description="地址列表")

# 创建带重试的解析器
base_parser = PydanticOutputParser(pydantic_object=User)
retry_parser = RetryWithErrorOutputParser.from_parser(
    parser=base_parser,
    max_retries=3
)

# 创建提示模板
prompt = PromptTemplate(
    template="""生成一个用户及其多个地址信息。
    {format_instructions}
    如果之前的输出有错误，这是错误信息：{error}
    请修正并重新生成。
    """,
    input_variables=["error"],
    partial_variables={"format_instructions": base_parser.get_format_instructions()}
)

# 创建链
chain = (
    prompt 
    | ChatOpenAI(temperature=0) 
    | retry_parser
)
```

## 3. 自定义验证器

```python
from langchain.output_parsers import OutputParser
from langchain.schema import BaseOutputParser

class CustomValidator(BaseOutputParser[User]):
    def parse(self, text: str) -> User:
        """自定义验证逻辑"""
        try:
            # 1. 预处理
            cleaned_text = self._preprocess(text)
            
            # 2. JSON解析
            data = json.loads(cleaned_text)
            
            # 3. 自定义验证规则
            if not self._validate_email(data.get("email")):
                raise ValueError("Invalid email format")
                
            # 4. 创建Pydantic模型
            return User.model_validate(data)
            
        except Exception as e:
            raise OutputParserException(f"验证失败: {str(e)}")
            
    def _preprocess(self, text: str) -> str:
        """清理和预处理文本"""
        return text.strip()
        
    def _validate_email(self, email: str) -> bool:
        """自定义邮箱验证"""
        import re
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return bool(re.match(pattern, email))
```

## 4. 验证流程说明

LangChain的验证过程主要分为以下几个步骤：

1. **格式指令生成**:

    ```python
    # 生成格式说明
    format_instructions = parser.get_format_instructions()
    # 这会生成类似这样的指令：
    """
    输出应该是一个JSON对象，包含以下字段：
    - name: 字符串类型，表示用户名称
    - age: 整数类型，表示用户年龄（0-150）
    - email: 字符串类型，表示电子邮件地址
    """
    ```

2. **输出解析**:

    ```python
    # 解析过程
    def parse_with_handling(text: str) -> BaseModel:
        try:
            # 尝试JSON解析
            data = json.loads(text)
            # 使用Pydantic验证
            return UserProfile.model_validate(data)
        except json.JSONDecodeError:
            raise OutputParserException("Invalid JSON format")
        except ValidationError as e:
            raise OutputParserException(f"Validation failed: {e}")
    ```

3. **错误处理和重试**:

    ```python
    class RetryHandler:
        def handle_error(self, error: Exception, attempt: int) -> str:
            """生成重试提示"""
            return f"""
            前一次尝试失败，错误信息：{str(error)}
            请注意以下要求：
            1. 确保输出是有效的JSON格式
            2. 确保所有必填字段都存在
            3. 确保字段类型正确
            这是第 {attempt} 次尝试，请重新生成。
            """
    ```

## 5. 验证的核心机制

1. **JSON格式验证**:

    ```python
    def validate_json(text: str) -> dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {str(e)}")
    ```

2. **类型验证**:

    ```python
    def validate_types(data: dict, model: BaseModel) -> None:
        for field_name, field in model.model_fields.items():
            value = data.get(field_name)
            if not isinstance(value, field.annotation):
                raise TypeError(f"Field {field_name} must be {field.annotation}")
    ```

3. **业务规则验证**:

    ```python
    def validate_business_rules(data: dict) -> None:
        if "age" in data and not (0 < data["age"] < 150):
            raise ValueError("Age must be between 0 and 150")
        if "email" in data and not is_valid_email(data["email"]):
            raise ValueError("Invalid email format")
    ```

这种验证机制确保了：

- 输出格式符合预期
- 数据类型正确
- 业务规则得到遵守
- 错误可以被优雅处理
- 必要时可以重试
