# Runnable

## 简单举例

```py
from langchain.schema.runnable import RunnableSequence

# 创建一个转换函数，将第一个链的输出转换为第二个链的输入格式
def transform_output(user_info: CompletePartialResponse) -> dict:
    return {
        "name": user_info.name,
        "age": user_info.age if user_info.age else "未知",
        "interests": ", ".join(user_info.interests) if user_info.interests else "未知"
    }

async def create_analysis_chain():
    # 第一个链
    user_info_parser = PydanticOutputParser(pydantic_object=CompletePartialResponse)
    user_info_prompt = PromptTemplate(
        template="生成用户信息...\n{format_instructions}",
        input_variables=[],
        partial_variables={"format_instructions": user_info_parser.get_format_instructions()}
    )
    user_info_chain = user_info_prompt | ChatOpenAI(temperature=0) | user_info_parser

    # 第二个链
    analysis_parser = PydanticOutputParser(pydantic_object=UserAnalysis)
    analysis_prompt = PromptTemplate(
        template="基于用户信息进行分析...\n{format_instructions}",
        input_variables=["name", "age", "interests"],
        partial_variables={"format_instructions": analysis_parser.get_format_instructions()}
    )
    analysis_chain = analysis_prompt | ChatOpenAI(temperature=0) | analysis_parser

    # 组合链
    combined_chain = RunnableSequence(
        first=user_info_chain,
        middle=transform_output,
        last=analysis_chain
    )
    
    return combined_chain

# 使用示例
async def run_combined_chain():
    chain = await create_analysis_chain()
    result = await chain.ainvoke({})
    return result

if __name__ == "__main__":
    import asyncio
    result = asyncio.run(run_combined_chain())
    print(result)
```

上面的代码可以不用 Runnable 翻译一下

```py
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any

# 第一个链的输出模型（已有的）
class CompletePartialResponse(BaseModel):
    name: str = Field(description="用户名称")
    age: Optional[int] = Field(None, description="用户年龄")
    email: Optional[str] = Field(None, description="电子邮件")
    interests: Optional[List[str]] = Field(None, description="兴趣爱好")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # ... 其他验证器代码 ...

# 第二个链的输出模型
class UserAnalysis(BaseModel):
    user_type: str = Field(description="用户类型")
    recommended_products: List[str] = Field(description="推荐产品")
    engagement_score: float = Field(description="参与度得分", ge=0, le=100)
    summary: str = Field(description="用户分析总结")

# 第一个链（已有的）
async def get_partial_user_info():
    parser = PydanticOutputParser(pydantic_object=CompletePartialResponse)
    prompt = PromptTemplate(
        template="""
        生成用户信息，可以包含以下字段：
        - 姓名（必填）
        - 年龄（可选）
        - 邮箱（可选）
        - 兴趣爱好（可选）
        
        {format_instructions}
        """,
        input_variables=[],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | ChatOpenAI(temperature=0) | parser
    return await chain.ainvoke({})

# 第二个链
async def analyze_user_info(user_info: CompletePartialResponse):
    parser = PydanticOutputParser(pydantic_object=UserAnalysis)
    
    prompt = PromptTemplate(
        template="""
        基于以下用户信息进行分析：
        姓名: {name}
        年龄: {age}
        兴趣爱好: {interests}
        
        请提供用户分析，包括用户类型、推荐产品、参与度评分和总结。
        
        {format_instructions}
        """,
        input_variables=["name", "age", "interests"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | ChatOpenAI(temperature=0) | parser
    
    # 准备输入数据
    input_data = {
        "name": user_info.name,
        "age": user_info.age if user_info.age else "未知",
        "interests": ", ".join(user_info.interests) if user_info.interests else "未知"
    }
    
    return await chain.ainvoke(input_data)

# 组合两个链
async def combined_analysis():
    try:
        # 1. 获取用户信息
        user_info = await get_partial_user_info()
        if not user_info:
            return None
            
        print("=== 用户基本信息 ===")
        print("姓名:", user_info.name)
        if user_info.age:
            print("年龄:", user_info.age)
        if user_info.interests:
            print("兴趣:", user_info.interests)
            
        # 2. 分析用户信息
        analysis = await analyze_user_info(user_info)
        if not analysis:
            return None
            
        print("\n=== 用户分析结果 ===")
        print("用户类型:", analysis.user_type)
        print("推荐产品:", analysis.recommended_products)
        print("参与度得分:", analysis.engagement_score)
        print("分析总结:", analysis.summary)
        
        return {
            "user_info": user_info,
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"处理失败: {e}")
        return None

# 使用示例
if __name__ == "__main__":
    import asyncio
    result = asyncio.run(combined_analysis())
```

### 1. RunnableSequence（顺序执行）

这是一个复杂的例子，展示如何使用RunnableSequence处理文档摘要和翻译：

```python
from langchain.schema.runnable import RunnableSequence
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains.combine_documents.stuff import StuffDocumentsChain
from typing import List
from pydantic import BaseModel, Field

# 定义输出模型
class DocumentSummary(BaseModel):
    summary: str = Field(description="文档摘要")
    key_points: List[str] = Field(description="关键点列表")
    word_count: int = Field(description="字数统计")

# 1. 文本分割
text_splitter = CharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

# 2. 摘要提示模板
summary_prompt = PromptTemplate.from_template("""
请对以下文本进行摘要：
{text}

请以JSON格式输出，包含以下字段：
- summary: 总结
- key_points: 关键点列表
- word_count: 字数统计
""")

# 3. 翻译提示模板
translation_prompt = PromptTemplate.from_template("""
请将以下内容翻译成英文：
{chinese_text}
""")

# 创建处理链
def create_processing_chain():
    # 文档摘要链
    summary_chain = (
        summary_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    # 翻译链
    translation_chain = (
        translation_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    # 组合链
    combined_chain = RunnableSequence(
        first=lambda x: {"text": x["document"]},  # 准备摘要输入
        middle=summary_chain,  # 生成摘要
        last=lambda x: {  # 处理摘要并翻译
            "chinese_summary": x,
            "english_summary": translation_chain.invoke({"chinese_text": x})
        }
    )
    
    return combined_chain

# 使用示例
async def process_document(document: str):
    chain = create_processing_chain()
    result = await chain.ainvoke({"document": document})
    return result

# 测试代码
if __name__ == "__main__":
    import asyncio
    
    test_doc = """
    人工智能（AI）正在深刻改变着我们的生活方式。从智能手机助手到自动驾驶汽车，
    从医疗诊断到金融分析，AI技术几乎渗透到了各个领域。然而，AI的发展也带来了
    一些挑战，比如就业变革、隐私安全等问题需要我们认真思考和解决。
    """
    
    result = asyncio.run(process_document(test_doc))
    print(result)
```

### 2. RunnableParallel（并行执行）

这个例子展示如何并行处理文档的多个分析任务：

```python
from langchain.schema.runnable import RunnableParallel
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from typing import Dict

# 定义不同的分析提示模板
sentiment_prompt = PromptTemplate.from_template("""
分析以下文本的情感倾向：
{text}
只输出：正面/负面/中性
""")

category_prompt = PromptTemplate.from_template("""
判断以下文本属于哪个类别：
{text}
只输出一个类别名称
""")

keywords_prompt = PromptTemplate.from_template("""
提取以下文本中的关键词（最多5个）：
{text}
以逗号分隔输出
""")

def create_parallel_analysis_chain():
    # 创建各个分析链
    sentiment_chain = (
        sentiment_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    category_chain = (
        category_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    keywords_chain = (
        keywords_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    # 创建并行处理链
    parallel_chain = RunnableParallel(
        sentiment=sentiment_chain,
        category=category_chain,
        keywords=keywords_chain
    )
    
    return parallel_chain

async def analyze_text(text: str) -> Dict:
    chain = create_parallel_analysis_chain()
    result = await chain.ainvoke({"text": text})
    return result

# 测试代码
if __name__ == "__main__":
    import asyncio
    
    test_text = """
    新能源汽车市场持续快速增长，各大车企纷纷加大投入，
    推出新款电动车型，消费者对电动汽车的接受度不断提高。
    """
    
    result = asyncio.run(analyze_text(test_text))
    print(result)
```

### 3. RunnableBranch（条件分支）

这个例子展示如何根据不同条件选择不同的处理流程：

```python
from langchain.schema.runnable import RunnableBranch
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from typing import Dict, Any

# 定义不同语言的处理模板
chinese_prompt = PromptTemplate.from_template("用中文回答：{question}")
english_prompt = PromptTemplate.from_template("Answer in English: {question}")
japanese_prompt = PromptTemplate.from_template("日本語で答えてください：{question}")

def detect_language(text: str) -> str:
    # 简单的语言检测逻辑
    if any('\u4e00-\u9fff' in char for char in text):
        return "chinese"
    elif all(ord(char) < 128 for char in text):
        return "english"
    else:
        return "japanese"

def create_multilingual_chain():
    # 创建不同语言的处理链
    chinese_chain = (
        chinese_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    english_chain = (
        english_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    japanese_chain = (
        japanese_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    # 创建分支处理链
    branch_chain = RunnableBranch(
        (lambda x: detect_language(x["question"]) == "chinese", chinese_chain),
        (lambda x: detect_language(x["question"]) == "english", english_chain),
        japanese_chain  # 默认分支
    )
    
    return branch_chain

async def answer_question(question: str) -> str:
    chain = create_multilingual_chain()
    result = await chain.ainvoke({"question": question})
    return result

# 测试代码
if __name__ == "__main__":
    import asyncio
    
    questions = [
        "今天天气怎么样？",
        "How is the weather today?",
        "今日の天気はどうですか？"
    ]
    
    for question in questions:
        result = asyncio.run(answer_question(question))
        print(f"问题: {question}")
        print(f"回答: {result}\n")
```

### 4. runnablelambda

RunnableLambda 用法是包装一个函数

```py
from langchain.schema.runnable import RunnableLambda, RunnableSequence
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import re

# 1. 定义输入和输出模型
class TextInput(BaseModel):
    text: str = Field(..., min_length=1)
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)

class TextOutput(BaseModel):
    cleaned_text: str = Field(..., min_length=1)
    word_count: int = Field(..., gt=0)
    has_numbers: bool
    processed_at: datetime

    @validator('cleaned_text')
    def validate_cleaned_text(cls, v):
        if not v.strip():
            raise ValueError("清理后的文本不能为空")
        return v

# 2. 创建需要包装的函数
def clean_text(input_data: TextInput) -> TextOutput:
    """清理文本的函数"""
    # 验证输入
    if not isinstance(input_data, TextInput):
        input_data = TextInput(**input_data)
    
    # 处理文本
    cleaned = re.sub(r'\s+', ' ', input_data.text.strip())
    cleaned = cleaned.replace('；', ';').replace('，', ',')
    
    # 返回验证过的输出
    return TextOutput(
        cleaned_text=cleaned,
        word_count=len(cleaned.split()),
        has_numbers=bool(re.search(r'\d', cleaned)),
        processed_at=datetime.now()
    )

# 3. 使用 RunnableLambda 包装函数
text_cleaner = RunnableLambda(clean_text)

# 4. 创建处理链
def create_processing_chain():
    # 创建提示模板
    analysis_prompt = PromptTemplate.from_template("""
    分析以下文本：
    {text}
    """)
    
    # 创建基础分析链
    base_chain = (
        analysis_prompt 
        | ChatOpenAI(temperature=0) 
        | StrOutputParser()
    )
    
    # 组合完整的处理链
    full_chain = RunnableSequence(
        first=text_cleaner,  # 使用包装后的清理函数
        middle=lambda x: {"text": x.cleaned_text},  # 使用验证后的输出
        last=base_chain
    )
    
    return full_chain

# 5. 使用示例
async def process_text(text: str) -> Dict[str, Any]:
    try:
        # 创建处理链
        chain = create_processing_chain()
        
        # 准备输入数据
        input_data = {
            "text": text,
            "timestamp": datetime.now()
        }
        
        # 执行处理链
        result = await chain.ainvoke(input_data)
        return {
            "result": result,
            "status": "success"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed",
            "timestamp": datetime.now().isoformat()
        }

# 6. 测试代码
if __name__ == "__main__":
    import asyncio
    
    # 测试用例
    test_cases = [
        # 正常案例
        "这是一个测试文本，包含数字123",
        # 异常案例（空文本）
        "",
        # 异常案例（只有空格）
        "   ",
    ]
    
    for test_text in test_cases:
        print("\n测试文本:", test_text)
        print("-" * 50)
        result = asyncio.run(process_text(test_text))
        print(json.dumps(result, ensure_ascii=False, indent=2))
```