# prompt  core中

langchain和messages一样，提供了很多prompt功能类。主要一下几种

- 提示模板（如 PromptTemplate）用于构建并生成特定格式的输入提示。
- 对话模板（如 BaseChatPromptTemplate）专门处理和构建聊天类的对话流程。
- 消息模板（如 HumanMessagePromptTemplate 和 AIMessagePromptTemplate）用于创建符合不同角色（用户、AI、系统）要求的消息内容。
- Few-shot 模板（如 FewShotPromptTemplate）和 模板扩展（如 FewShotPromptWithTemplates）提供了将少量示例嵌入模型的能力，以便提高推理精度。
- 动态消息管理（如 MessagesPlaceholder）为消息的生成提供了灵活性和可定制性。

## 1. 举例BaseChatPromptTemplate的使用

```py
from langchain_core.prompts import BaseChatPromptTemplate
from langchain_core.messages import ChatMessage

class ChatWithHistoryPrompt(BaseChatPromptTemplate):
    def __init__(self, history=None):
        # 初始化时可以接受历史记录
        self.history = history if history else []

    def format_messages(self, **kwargs):
        # 当前用户输入
        user_input = kwargs.get("user_input", "")
        
        # 格式化历史消息
        formatted_messages = [ChatMessage(role="system", content="You are a helpful assistant.")]
        
        # 将历史记录的消息添加到格式化消息中
        for message in self.history:
            formatted_messages.append(ChatMessage(role=message["role"], content=message["content"]))
        
        # 添加当前用户的消息
        formatted_messages.append(ChatMessage(role="user", content=user_input))
        
        # 返回历史消息和当前消息的组合
        return formatted_messages

# 模拟历史记录
history = [
    {"role": "user", "content": "What's the weather like today?"},
    {"role": "ai", "content": "It's sunny and 25°C."}
]

# 创建带有历史记录的聊天提示
chat_prompt = ChatWithHistoryPrompt(history=history)

# 传入新的用户输入
messages = chat_prompt.format_messages(user_input="Tell me a joke.")

# 打印格式化后的消息
for message in messages:
    print(f"Role: {message.role}, Content: {message.content}")

```

```sh
Role: system, Content: You are a helpful assistant.
Role: user, Content: What's the weather like today?
Role: ai, Content: It's sunny and 25°C.
Role: user, Content: Tell me a joke.
```

## 举例：FewShotPromptTemplate 的使用


```py
from langchain_core.prompts import FewShotPromptTemplate
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import ChatMessage

# 定义一个少量示例的输入输出
examples = [
    {"input": "What is the capital of France?", "output": "The capital of France is Paris."},
    {"input": "Who wrote 'Romeo and Juliet'?", "output": "William Shakespeare wrote 'Romeo and Juliet'."}
]

# 定义一个 PromptTemplate 用于格式化每个示例的输入和输出
example_prompt = PromptTemplate(
    input_variables=["input", "output"],
    template="Input: {input}\nOutput: {output}\n"
)

# 创建一个 FewShotPromptTemplate
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    suffix="Now, answer the following question."
)

# 格式化模板
formatted_prompt = few_shot_prompt.format(input="What is the tallest mountain in the world?")

# 打印格式化后的 prompt
print(formatted_prompt)

```

```sh
Input: What is the capital of France?
Output: The capital of France is Paris.
Input: Who wrote 'Romeo and Juliet'?
Output: William Shakespeare wrote 'Romeo and Juliet'.
Now, answer the following question.
Input: What is the tallest mountain in the world?

```