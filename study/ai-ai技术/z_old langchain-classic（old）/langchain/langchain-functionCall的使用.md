# langchain-functionCall的使用


## 1. 最普通的简单例子

```py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.utils.function_calling import convert_to_openai_function
from typing import Optional
from pydantic import BaseModel, Field

# 定义一个天气查询的函数模式
class WeatherQuery(BaseModel):
    """查询天气的模式"""
    location: str = Field(..., description="城市名称")
    unit: Optional[str] = Field(default="celsius", description="温度单位 (celsius/fahrenheit)")

def get_weather(location: str, unit: str = "celsius") -> str:
    """模拟的天气查询函数"""
    # 这里只是示例，实际应用中应该调用真实的天气 API
    return f"{location}的天气是晴朗，温度是23{unit}"

# 创建一个支持 function calling 的 ChatOpenAI
llm = ChatOpenAI(
    temperature=0,
    model="gpt-3.5-turbo-0125"
)

# 将函数转换为 OpenAI 格式
weather_function = convert_to_openai_function(WeatherQuery)

# 创建一个带有函数调用功能的 LLM
llm_with_function = llm.bind(functions=[weather_function])

# 创建提示模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个帮助用户查询天气的助手。"),
    ("user", "{input}")
])

# 构建链
chain = prompt | llm_with_function | (
    lambda x: get_weather(**x.additional_kwargs["function_call"]["arguments"])
    if x.additional_kwargs.get("function_call")
    else x.content
)

# 使用链
result = chain.invoke({"input": "北京今天天气怎么样？"})
print(result)  # 输出: 北京的天气是晴朗，温度是23celsius

# 也可以指定温度单位
result = chain.invoke({"input": "请用华氏度告诉我上海的天气"})
print(result)  # 输出: 上海的天气是晴朗，温度是23fahrenheit
```

## 多个工具自己选择

```py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.utils.function_calling import convert_to_openai_function
from typing import Optional, List
from pydantic import BaseModel, Field
import json

# 定义多个函数模式
class WeatherQuery(BaseModel):
    """查询天气的模式"""
    location: str = Field(..., description="城市名称")
    unit: Optional[str] = Field(default="celsius", description="温度单位 (celsius/fahrenheit)")

class CityInfo(BaseModel):
    """查询城市信息的模式"""
    city: str = Field(..., description="城市名称")
    info_type: List[str] = Field(..., description="需要查询的信息类型，可选：population(人口), area(面积), timezone(时区)")

# 实现函数
def get_weather(location: str, unit: str = "celsius") -> str:
    """模拟的天气查询函数"""
    return f"{location}的天气是晴朗，温度是23{unit}"

def get_city_info(city: str, info_type: List[str]) -> str:
    """模拟的城市信息查询函数"""
    info_mapping = {
        "population": f"{city}的人口约为800万",
        "area": f"{city}的面积约为16410平方公里",
        "timezone": f"{city}位于东八区"
    }
    results = [info_mapping.get(type_) for type_ in info_type if type_ in info_mapping]
    return "；".join(results) if results else f"抱歉，没有找到{city}的相关信息"

def process_llm_response(llm_response):
    """处理LLM的响应"""
    if not llm_response.additional_kwargs.get("function_call"):
        # 如果没有触发函数调用，直接返回LLM的回复
        return llm_response.content
    
    function_call = llm_response.additional_kwargs["function_call"]
    function_name = function_call["name"]
    arguments = json.loads(function_call["arguments"])
    
    # 根据函数名调用相应的函数
    if function_name == "WeatherQuery":
        return get_weather(**arguments)
    elif function_name == "CityInfo":
        return get_city_info(**arguments)
    else:
        return f"抱歉，我不知道如何处理 {function_name} 这个功能"

# 设置LLM
llm = ChatOpenAI(
    temperature=0,
    model="gpt-3.5-turbo-0125"
)

# 转换函数并绑定
weather_function = convert_to_openai_function(WeatherQuery)
city_info_function = convert_to_openai_function(CityInfo)
llm_with_tools = llm.bind(functions=[weather_function, city_info_function])

# 创建提示模板
prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个城市助手，可以提供天气和城市信息查询服务。
    - 如果用户询问天气，使用WeatherQuery函数
    - 如果用户询问城市的人口、面积或时区，使用CityInfo函数
    - 如果用户的问题与这些功能无关，直接回答用户
    请用友善的语气回应。"""),
    ("user", "{input}")
])

# 构建链
chain = prompt | llm_with_tools | process_llm_response

# 测试不同场景
def test_chain(input_text: str):
    """测试函数"""
    print(f"\n输入: {input_text}")
    print(f"输出: {chain.invoke({'input': input_text})}")

# 测试各种情况
if __name__ == "__main__":
    # 测试天气查询
    test_chain("北京今天天气怎么样？")
    
    # 测试城市信息查询
    test_chain("告诉我上海的人口和面积")
    
    # 测试多个信息类型
    test_chain("我想知道广州的人口、面积和时区")
    
    # 测试未命中功能的查询
    test_chain("你觉得哪个城市最适合居住？")
    
    # 测试模糊查询
    test_chain("深圳怎么样？")
```


## 3. `@tool`和`create_openai_functions_agent`装饰器的使用，来简化逻辑

```py
from langchain_openai import ChatOpenAI
from langchain.agents import tool
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

# 定义工具函数
@tool
def get_weather(location: str, unit: str = "celsius") -> str:
    """查询指定城市的天气情况"""
    return f"{location}的天气是晴朗，温度是23{unit}"

@tool
def get_city_info(city: str, info_type: str) -> str:
    """查询城市的基本信息，info_type可以是：population(人口)、area(面积)、timezone(时区)"""
    info_mapping = {
        "population": f"{city}的人口约为800万",
        "area": f"{city}的面积约为16410平方公里",
        "timezone": f"{city}位于东八区"
    }
    return info_mapping.get(info_type, f"抱歉，没有找到{city}的{info_type}信息")

# 创建工具列表
tools = [get_weather, get_city_info]

# 创建LLM
llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo-0125")

# 创建提示模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个城市助手，可以提供天气和城市信息查询服务。请用友善的语气回应。"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# 创建agent
agent = create_openai_functions_agent(llm, tools, prompt)

# 创建agent执行器
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 测试
def test_queries():
    queries = [
        "北京今天天气怎么样？",
        "告诉我上海的人口",
        "你觉得哪个城市最适合居住？"
    ]
    
    for query in queries:
        print(f"\n问题: {query}")
        response = agent_executor.invoke({"input": query, "chat_history": []})
        print(f"回答: {response['output']}")

if __name__ == "__main__":
    test_queries()
```

## 4. 当没有合适的函数调用时自动切换到普通对话链

```py
from langchain_openai import ChatOpenAI
from langchain.agents import tool, AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import LLMChain
from typing import Union

# 定义工具函数
@tool
def get_weather(location: str, unit: str = "celsius") -> str:
    """查询指定城市的天气情况"""
    return f"{location}的天气是晴朗，温度是23{unit}"

@tool
def get_city_info(city: str, info_type: str) -> str:
    """查询城市的基本信息，info_type可以是：population(人口)、area(面积)、timezone(时区)"""
    info_mapping = {
        "population": f"{city}的人口约为800万",
        "area": f"{city}的面积约为16410平方公里",
        "timezone": f"{city}位于东八区"
    }
    return info_mapping.get(info_type, f"抱歉，没有找到{city}的{info_type}信息")

class CityAssistant:
    def __init__(self):
        self.llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo-0125")
        
        # 创建工具链
        tools = [get_weather, get_city_info]
        tool_prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个城市助手，专门提供天气和城市基本信息查询。如果用户的问题不涉及这些信息，请返回'UNKNOWN'。"),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        agent = create_openai_functions_agent(self.llm, tools, tool_prompt)
        self.tool_chain = AgentExecutor(
            agent=agent, 
            tools=tools, 
            verbose=True,
            handle_parsing_errors=True  # 处理解析错误
        )
        
        # 创建通用对话链
        chat_prompt = ChatPromptTemplate.from_messages([
            ("system", """你是一个友善的城市顾问，可以回答关于城市的各种主观问题，比如：
            - 适合居住的城市推荐
            - 城市文化特色
            - 城市发展前景
            请给出详细的分析和建议。"""),
            ("user", "{input}")
        ])
        self.chat_chain = LLMChain(llm=self.llm, prompt=chat_prompt)
    
    def process_query(self, query: str) -> str:
        try:
            # 首先尝试使用工具链
            tool_response = self.tool_chain.invoke({
                "input": query,
                "chat_history": []
            })
            
            # 检查是否需要切换到对话链
            if ("UNKNOWN" in tool_response["output"] or 
                "我不知道如何" in tool_response["output"] or
                "我不能" in tool_response["output"]):
                # 使用对话链处理
                chat_response = self.chat_chain.invoke({"input": query})
                return chat_response["text"]
            
            return tool_response["output"]
            
        except Exception as e:
            # 如果工具链出错，使用对话链作为后备
            chat_response = self.chat_chain.invoke({"input": query})
            return chat_response["text"]

# 测试
def test_assistant():
    assistant = CityAssistant()
    
    test_queries = [
        "北京今天天气怎么样？",                    # 使用工具链 - 天气查询
        "上海的人口是多少？",                      # 使用工具链 - 城市信息
        "你觉得哪个城市最适合养老？",              # 使用对话链
        "深圳和广州哪个城市的发展前景更好？",       # 使用对话链
        "北京的科技创新环境怎么样？"               # 使用对话链
    ]
    
    for query in test_queries:
        print(f"\n问题: {query}")
        response = assistant.process_query(query)
        print(f"回答: {response}")

if __name__ == "__main__":
    test_assistant()
```

先用工具链，工具链命中不了再使用普通链，感觉很啰嗦，继续优化

## 5. `RunnableBranch` 来简化逻辑

```py
from langchain_openai import ChatOpenAI
from langchain.agents import tool, AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema.runnable import RunnableBranch

class CityAssistant:
    def __init__(self):
        self.llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo-0125")
        
        # 创建工具链
        tools = [get_weather, get_city_info]
        tool_prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个城市助手，专门提供天气和城市基本信息查询。如果用户的问题不涉及这些信息，请返回'UNKNOWN'。"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        agent = create_openai_functions_agent(self.llm, tools, tool_prompt)
        self.tool_chain = AgentExecutor(agent=agent, tools=tools)
        
        # 创建对话链
        chat_prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个友善的城市顾问，可以回答关于城市的各种主观问题。"),
            ("user", "{input}")
        ])
        self.chat_chain = chat_prompt | self.llm
        
        # 创建分支链
        self.chain = RunnableBranch(
            # 检查是否需要工具链的函数
            (lambda x: any(keyword in x["input"].lower() for keyword in ["天气", "人口", "面积", "时区"]),
             self.tool_chain | (lambda x: x["output"])),
            # 默认使用对话链
            self.chat_chain
        )
    
    def process_query(self, query: str) -> str:
        return self.chain.invoke({"input": query})

# 测试
if __name__ == "__main__":
    assistant = CityAssistant()
    queries = [
        "北京今天天气怎么样？",
        "你觉得哪个城市最适合养老？"
    ]
    
    for query in queries:
        print(f"\n问题: {query}")
        print(f"回答: {assistant.process_query(query)}")
```

直接使用文本匹配非常生硬，继续优化，智能的去判断


## 6.  使用一个链智能判断

```py
from langchain_openai import ChatOpenAI
from langchain.agents import tool, AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema.runnable import RunnableBranch, RunnablePassthrough
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Literal, List
from enum import Enum

# 定义数据模型
class WeatherQuery(BaseModel):
    """天气查询参数"""
    location: str = Field(..., description="城市名称")
    unit: Literal["celsius", "fahrenheit"] = Field(default="celsius", description="温度单位")

class CityInfoQuery(BaseModel):
    """城市信息查询参数"""
    city: str = Field(..., description="城市名称")
    info_type: List[Literal["population", "area", "timezone"]] = Field(
        ..., 
        description="需要查询的信息类型"
    )

class QueryClassification(BaseModel):
    """查询分类结果"""
    query_type: Literal["TOOL", "CHAT"] = Field(..., description="查询类型")
    confidence: float = Field(..., description="分类置信度", ge=0, le=1)
    reasoning: str = Field(..., description="分类理由")

class CityAssistantResponse(BaseModel):
    """助手响应"""
    answer: str = Field(..., description="回答内容")
    source: Literal["tool", "chat"] = Field(..., description="回答来源")

class CityAssistant:
    def __init__(self):
        self.llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo-0125")
        
        # 创建分类链
        classifier_prompt = ChatPromptTemplate.from_messages([
            ("system", """你是一个查询分类器。分析用户查询并返回合适的处理方式。

            规则：
            1. 如果查询需要具体数据（天气、人口、面积、时区），使用 TOOL
            2. 如果查询需要主观分析或建议，使用 CHAT
            
            请提供分类结果、置信度和推理过程。"""),
            ("user", "{input}")
        ])
        
        self.classifier_chain = (
            classifier_prompt 
            | self.llm 
            | PydanticOutputParser(pydantic_object=QueryClassification)
        )
        
        # 创建工具链
        tools = [self._create_weather_tool(), self._create_city_info_tool()]
        tool_prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个城市助手，专门提供天气和城市基本信息查询。"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        agent = create_openai_functions_agent(self.llm, tools, tool_prompt)
        self.tool_chain = AgentExecutor(agent=agent, tools=tools)
        
        # 创建对话链
        chat_prompt = ChatPromptTemplate.from_messages([
            ("system", "你是一个友善的城市顾问，可以回答关于城市的各种主观问题。"),
            ("user", "{input}")
        ])
        self.chat_chain = chat_prompt | self.llm
        
        # 创建主链
        self.chain = self._create_main_chain()

    @staticmethod
    @tool
    def _create_weather_tool() -> str:
        """查询指定城市的天气情况"""
        def get_weather(query: WeatherQuery) -> str:
            return f"{query.location}的天气是晴朗，温度是23{query.unit}"
        return get_weather

    @staticmethod
    @tool
    def _create_city_info_tool() -> str:
        """查询城市的基本信息"""
        def get_city_info(query: CityInfoQuery) -> str:
            info_mapping = {
                "population": f"{query.city}的人口约为800万",
                "area": f"{query.city}的面积约为16410平方公里",
                "timezone": f"{query.city}位于东八区"
            }
            results = [info_mapping[type_] for type_ in query.info_type]
            return "；".join(results)
        return get_city_info

    def _create_main_chain(self):
        def process_tool_response(x):
            return CityAssistantResponse(
                answer=x["output"],
                source="tool"
            )

        def process_chat_response(x):
            return CityAssistantResponse(
                answer=x.content,
                source="chat"
            )

        return (
            RunnablePassthrough.assign(
                classification=lambda x: self.classifier_chain.invoke(x["input"])
            )
            | RunnableBranch(
                (lambda x: x["classification"].query_type == "TOOL", 
                 self.tool_chain | process_tool_response),
                (self.chat_chain | process_chat_response)
            )
        )

    def process_query(self, query: str) -> CityAssistantResponse:
        """处理用户查询"""
        return self.chain.invoke({"input": query})

# 测试
def test_assistant():
    assistant = CityAssistant()
    
    test_queries = [
        "北京今天天气怎么样？",
        "上海的人口和面积是多少？",
        "你觉得哪个城市最适合养老？",
        "深圳和广州的发展前景分析"
    ]
    
    for query in queries:
        print(f"\n问题: {query}")
        response = assistant.process_query(query)
        print(f"来源: {response.source}")
        print(f"回答: {response.answer}")

if __name__ == "__main__":
    test_assistant()
```

输入 -> 分类器 -> 分支选择 -> 相应的处理链 -> 输出