# 图谱RAG (Microsoft GraphRAG)


## 技术概述

通过从文本单元中提取实体和关系来分析输入语料库。自下而上生成每个社区及其组成部分的摘要

知识图谱生成：以实体为节点、关系为边构建图。社区检测：在图中识别相关实体的集群。总结：为每个社区生成摘要以提供上下文信息LLMs。查询处理：利用这些摘要增强LLM回答复杂问题的能力。

文本切分：将源文本划分为可管理的片段。元素提取：使用LLMs来识别实体和关系。图构建：从提取的元素构建图。社区检测：应用 Leiden 等算法来发现社区。社区总结：为每个社区创建摘要。

本地答案生成：使用社区摘要生成初步答案。全局答案综合：结合本地答案形成综合回应。

## 传统rag的不足之处

检索增强生成（RAG）通常通过分块长文本、为每个分块创建文本嵌入，并根据与查询的相似性搜索检索分块以包含在生成上下文中，来实现。这种方法在许多场景中表现良好，且在吸引人的速度和成本权衡下运行，但在需要对文本有详细理解的场景中并不总是表现良好。


使用 GraphRag 进行索引是一个更耗时的过程，成本也更高，因为除了计算嵌入外，GraphRag 还会进行许多 LLM 调用来分析文本、提取实体并构建图。不过这是一次性的开销。

GraphRag 有一套方便的命令行界面命令我们可以使用。我们将首先配置系统，然后运行索引操作

```sh
import yaml

if not os.path.exists('data/graphrag'):
    !python -m graphrag.index --init --root data/graphrag

with open('data/graphrag/settings.yaml', 'r') as f:
    settings_yaml = yaml.load(f, Loader=yaml.FullLoader)
settings_yaml['llm']['model'] = "gpt-4o"
settings_yaml['llm']['api_key'] = AZURE_OPENAI_API_KEY if AZURE else OPENAI_API_KEY
settings_yaml['llm']['type'] = 'azure_openai_chat' if AZURE else 'openai_chat'
settings_yaml['embeddings']['llm']['api_key'] = AZURE_OPENAI_API_KEY if AZURE else OPENAI_API_KEY
settings_yaml['embeddings']['llm']['type'] = 'azure_openai_embedding' if AZURE else 'openai_embedding'
settings_yaml['embeddings']['llm']['model'] = TEXT_EMBEDDING_3_LARGE_NAME if AZURE else 'text-embedding-3-large'
if AZURE:
    settings_yaml['llm']['api_version'] = AZURE_OPENAI_API_VERSION
    settings_yaml['llm']['deployment_name'] = GPT4O_DEPLOYMENT_NAME
    settings_yaml['llm']['api_base'] = AZURE_OPENAI_ENDPOINT
    settings_yaml['embeddings']['llm']['api_version'] = AZURE_OPENAI_API_VERSION
    settings_yaml['embeddings']['llm']['deployment_name'] = TEXT_EMBEDDING_3_LARGE_NAME
    settings_yaml['embeddings']['llm']['api_base'] = AZURE_OPENAI_ENDPOINT

with open('data/graphrag/settings.yaml', 'w') as f:
    yaml.dump(settings_yaml, f)

## 使用命令直接运行 graphrag
if not os.path.exists('data/graphrag/input'):
    os.makedirs('data/graphrag/input')
    !cp data/elon.md data/graphrag/input/elon.txt
    !python -m graphrag.index --root ./data/graphrag

import subprocess
import re
DEFAULT_RESPONSE_TYPE = 'Summarize and explain in 1-2 paragraphs with bullet points using at most 300 tokens'
DEFAULT_MAX_CONTEXT_TOKENS = 10000

def remove_data(text):
    return re.sub(r'\[Data:.*?\]', '', text).strip()


def ask_graph(query,method):
    env = os.environ.copy() | {
      'GRAPHRAG_GLOBAL_SEARCH_MAX_TOKENS': str(DEFAULT_MAX_CONTEXT_TOKENS),
    }
    command = [
      'python', '-m', 'graphrag.query',
      '--root', './data/graphrag',
      '--method', method,
      '--response_type', DEFAULT_RESPONSE_TYPE,
      query,
    ]
    output = subprocess.check_output(command, universal_newlines=True, env=env, stderr=subprocess.DEVNULL)
    return remove_data(output.split('Search Response: ')[1])
```

1. 全局搜索通过利用社区摘要来推理关于整个语料库的综合问题。
2. 通过扩展到其邻居及其相关概念来进行特定实体的推理搜索。

## 社区其他的graphRag的方案

- [fast_graphrag](https://github.com/circlemind-ai/fast-graphrag)
> 通过预先定义好的关系来提取文本中的有限实体，同时分析实体之间的关系和描述，在一次交互中总结出 实体 关系描述 的关系，根据此进行关系的图嵌入， 这样的方式在嵌入的时候可以节省很多token， 在使用的时候要自己先定义出类型来(类型类似于社区的概念吧)

补充理解

1. graphrag在代码库分析中表现不好，原因是实体提取多样化，关系的描述会更加多样化，且不完整。 因为代码一个完整的功能往往涉及多个文件。关系描述往往是在这一段话的描述中，分块长了，容易遗漏，分块短了描述不足以体验功能上下文的真实目的。
2. graphrag在推荐系统中出奇的好使，假设在商品推荐场景，商品本身具有 重量、价格、提及、型号等分类，很容易社群化，更容易得到详细的准确的关系描述。


>  TODO: 此方案的更多理解还在进行中


