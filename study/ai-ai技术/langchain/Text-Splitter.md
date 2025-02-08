# Text-Splitter 文本拆分器

core中只带了简单的一些文本拆分器，社区里面会有更多

1. **BaseDocumentTransformer**  
   这是一个基础类，用于处理文档转换的操作，通常作为其他文档处理器的父类。
   - **示例**：可以自定义继承 `BaseDocumentTransformer` 来转换文档格式。

2. **TextSplitter**  
   这是一个基类，负责将文本分割成更小的片段。
   - **示例**：用于将大型文本分割成多个段落或句子，以便处理。

3. **CharacterTextSplitter**  
   `CharacterTextSplitter` 是 `TextSplitter` 的子类，通过字符来拆分文本。
   - **示例**：将长文本按字符长度分割成多个部分。

4. **RecursiveCharacterTextSplitter**  
   这种分割器会递归地将文本按字符拆分，同时保证不会在单词或句子中间断开。
   - **示例**：用于将长文本递归地拆分成较小且语义完整的片段。

使用起来很简单，如下

```py
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 示例长文本
text = """
LangChain is a framework for building applications powered by language models. 
It provides a simple interface for working with various LLMs (Large Language Models) and tools.
"""

# 初始化 RecursiveCharacterTextSplitter
text_splitter = RecursiveCharacterTextSplitter(chunk_size=50, chunk_overlap=10)

# 分割文本
chunks = text_splitter.split_text(text)

# 输出分割后的文本块
for chunk in chunks:
    print(chunk)

```