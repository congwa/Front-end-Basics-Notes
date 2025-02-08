# aiMessages

> 核心包里面的一个类，代表 AI 生成的消息，只是消息的一个数据结构，它本身不具备存储功能，必须结合 ChatMessageHistory 或数据库来持久化消息

在 Web 服务中，通常的流程是：

- ① 用户发送消息，存入 UserMessage。
- ② AI 生成响应，存入 AIMessage。
- ③ 下次请求时，基于 user_id 取出所有历史记录，并追加新消息。

## 1. 简单例子

直接创建 AIMessage（适用于单次请求）

```py
from langchain_core.messages import AIMessage

ai_message = AIMessage(content="Hello! How can I assist you?")
print(ai_message)  # AIMessage(content='Hello! How can I assist you?')

```

## 2.结合 ChatMessageHistory（适用于短期会话）

```py
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.chat_history import ChatMessageHistory

history = ChatMessageHistory()
history.add_user_message(HumanMessage(content="What's the weather like?"))
history.add_ai_message(AIMessage(content="Today's weather is sunny!"))

# 获取聊天记录
for msg in history.messages:
    print(msg)

```

此方法适用于单用户，会话结束后历史消息会丢失。

## 3.结合 Redis（适用于多用户 Web 服务）

```py
from langchain_core.messages import AIMessage, HumanMessage
from langchain_community.chat_message_histories import RedisChatMessageHistory

user_id = "user_123"

# 创建 Redis 聊天历史管理
history = RedisChatMessageHistory(session_id=user_id, url="redis://localhost:6379")

# 存储聊天记录
history.add_user_message("What is AI?")
history.add_ai_message(AIMessage(content="AI stands for Artificial Intelligence."))

# 获取聊天记录
for msg in history.messages:
    print(msg)

```

适合多用户并发，聊天记录可持久化。

## 4. 在 Redis 存储 Pydantic 结构化 AIMessage

AIMessage 的 content 是自由文本，而 additional_kwargs 可以存储结构化数据，但它本身没有严格的类型限制

```py
from langchain_core.messages import AIMessage
from langchain_community.chat_message_histories import RedisChatMessageHistory
from pydantic import BaseModel, Field

# 定义 Pydantic 数据模型
class AIResponseModel(BaseModel):
    summary: str = Field(..., description="Summary of response")
    keywords: list[str] = Field(..., description="Key topics")

# 生成数据
data = AIResponseModel(summary="Fast response", keywords=["AI", "LangChain", "Python"])

# 生成 AIMessage
ai_message = AIMessage(
    content="Here is a structured response",
    additional_kwargs={"structured_data": data.dict()}
)

# 存入 Redis
user_id = "user_123"
history = RedisChatMessageHistory(session_id=user_id, url="redis://localhost:6379")
history.add_ai_message(ai_message)

# 读取历史记录
for msg in history.messages:
    print(msg.dict())  # 输出带有 Pydantic 结构的数据

```