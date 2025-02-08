# Text-Splitter 文本拆分器

core中只带了简单的一些文本拆分器，社区里面会有更多

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

## 基础拆分器

### CharacterTextSplitter

- 最简单的拆分器实现
- 工作原理：
  - 按指定的字符（如`\n\n`, `\n`, ``）进行拆分
  - 将文本合并成符合指定长度的块
  - 可以设置块之间的重叠长度
- 主要参数：
  - `separator`：分隔符
  - `chunk_size`：块大小
  - `chunk_overlap`：重叠大小
- 缺点：可能会在不恰当的位置切分文本

### RecursiveCharacterTextSplitter

- LangChain推荐的默认拆分器
- 工作原理：
  - 递归使用一系列分隔符
  - 默认分隔符顺序：`["\n\n", "\n", " ", ""]`
  - 先尝试用第一个分隔符，如果chunk太大，继续用下一个分隔符
- 特点：
  - 更好地保持语义完整性
  - 可以自定义分隔符列表
  - 支持特定语言的分隔策略（如Python、Markdown等）

## 特定格式拆分器

### MarkdownHeaderTextSplitter

- 专门处理Markdown文档
- 功能：
  - 可以按照标题层级（#, ##, ###等）拆分文档
  - 保持文档的层级结构
  - 可以自定义标题级别的处理方式
- 使用场景：
  - 处理结构化的Markdown文档
  - 需要保持文档层次关系的场景

### HTMLTextSplitter

- 专门处理HTML文档
- 特点：
  - 识别HTML标签
  - 在标签边界处进行拆分
  - 保持HTML结构的完整性

### LatexTextSplitter

- 专门处理LaTeX文档
- 功能：
  - 识别LaTeX命令和环境
  - 在合适的位置进行拆分
  - 保持LaTeX文档的结构

## 代码相关拆分器

### PythonCodeTextSplitter

- 专门处理Python代码
- 特点：
  - 识别Python语法结构
  - 在函数、类定义等位置进行智能拆分
  - 保持代码块的完整性

### JavascriptTextSplitter

- 专门处理JavaScript代码
- 功能：
  - 识别JavaScript语法结构
  - 在函数、类、对象定义等位置拆分
  - 维护代码的语法完整性

## Token相关拆分器

### TokenTextSplitter

- 基于token计数进行拆分
- 特点：
  - 可以精确控制每个chunk的token数量
  - 适用于需要严格控制输入长度的场景
  - 支持不同的tokenizer

### SentenceTransformersTokenTextSplitter

- 使用sentence-transformers的tokenizer
- 功能：
  - 专门针对特定语言模型优化
  - 更准确的token计数
  - 适合用于sentence-transformers相关的应用

## 自然语言处理拆分器

### NLTKTextSplitter

- 基于NLTK库的拆分器
- 功能：
  - 使用自然语言处理技术进行拆分
  - 可以按句子级别拆分
  - 支持多种语言
- 适用场景：
  - 需要语言学层面准确拆分的场景
  - 处理多语言文本

## 选择建议

1. 一般场景：使用 `RecursiveCharacterTextSplitter`
2. 特定格式文档：使用对应的专门拆分器
3. 需要精确token控制：使用 `TokenTextSplitter`
4. 处理代码：使用对应的代码拆分器
5. 需要语言学准确性：使用 `NLTKTextSplitter`
