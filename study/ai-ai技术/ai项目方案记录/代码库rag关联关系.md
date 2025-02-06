# 如何处理文件间关联关系

1. **文件元数据处理**

```python
# 构建文件元数据，包含文件间的关联信息
def build_code_metadata(file_path: str, code_content: str) -> Dict[str, Any]:
    return {
        "file_path": file_path,
        "file_name": os.path.basename(file_path),
        "language": "python",
        "imports": extract_imports(code_content),  # 提取导入关系
        "dependencies": extract_dependencies(code_content),  # 提取依赖关系
        "references": extract_references(code_content)  # 提取引用关系
    }

# 处理代码库
code_files = []
metadata_list = []

for file_path in glob.glob("**/*.py", recursive=True):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        code_files.append(content)
        metadata_list.append(build_code_metadata(file_path, content))

# 使用 GraphRAG 插入
graph_rag.insert(content=code_files, metadata=metadata_list)
```

2. **关系处理流程**

在 GraphRAG 中，文件关联关系的处理流程如下：

```python
# 1. 文档转换为 TDocument
data = (TDocument(data=c, metadata=m or {}) for c, m in zip(content, metadata))

# 2. 分块处理
chunked_documents = await self.chunking_service.extract(data=data)

# 3. 实体和关系提取
subgraphs = self.information_extraction_service.extract(
    llm=self.llm_service,
    documents=new_chunks_per_data,
    prompt_kwargs={
        "domain": "代码库",
        "example_queries": """
            文件之间的导入关系是什么？
            哪些文件共享相同的类或函数？
            模块间的依赖关系是怎样的？
        """,
        "entity_types": "File,Class,Function,Module",
    }
)
```

3. **查询示例**

```python
# 查询文件关联
def query_file_relations(file_path: str):
    queries = [
        f"文件 {file_path} 导入了哪些其他文件？",
        f"哪些文件依赖于 {file_path}？",
        f"文件 {file_path} 中的类被哪些其他文件继承？"
    ]
    
    responses = []
    for query in queries:
        response = graph_rag.query(
            query=query,
            params=QueryParam(
                with_references=True,
                entities_max_tokens=5000
            )
        )
        responses.append(response)
    
    return responses
```

4. **关系类型**

在代码库中，主要处理以下几种关联关系：

- **直接关系**：
  - 导入关系（import）
  - 继承关系（inheritance）
  - 调用关系（function calls）

- **间接关系**：
  - 共享依赖
  - 类型引用
  - 变量使用

5. **实现细节**

```python
@dataclass
class CodeRelation(TRelation):
    relation_type: str = field(default="import")  # import, inherit, call
    source_location: str = field(default="")
    target_location: str = field(default="")
    
    def to_str(self) -> str:
        return f"{self.source} [{self.relation_type}] {self.target} at {self.source_location}"
```

6. **查询优化**

```python
# 优化查询参数
params = QueryParam(
    with_references=True,
    entities_max_tokens=5000,  # 增加 token 限制以处理更多实体
    relations_max_tokens=4000,
    chunks_max_tokens=10000
)

# 使用上下文感知查询
context = await state_manager.get_context(
    query=query,
    entities=extracted_entities,
    context_window=5  # 考虑相邻文件的上下文
)
```

这种方式可以：
1. 保持文件间的关联关系
2. 支持复杂的依赖分析
3. 实现智能代码导航
4. 提供关系可视化

通过这种方式，GraphRAG 可以有效地：
- 识别和存储代码间的关联
- 提供智能化的代码查询
- 支持复杂的依赖分析
- 帮助理解代码结构


## 补充

### 1. 在vue2项目中
```py
graph_rag = GraphRAG(
    working_dir="./vue2_project",
    domain="Vue2项目代码分析",
    example_queries="""
        组件 UserProfile 使用了哪些子组件？
        Vuex store 中的 mutations 被哪些组件调用？
        路由 /dashboard 关联了哪些组件？
        组件 DataTable 使用了哪些 mixins？
        哪些组件注册了 beforeDestroy 生命周期钩子？
    """,
    entity_types=[
        "Component",      # Vue组件
        "Method",         # 组件方法
        "Prop",          # 组件属性
        "Data",          # 组件数据
        "Computed",      # 计算属性
        "Watch",         # 侦听器
        "Mixin",         # 混入
        "Directive",     # 指令
        "Filter",        # 过滤器
        "Store",         # Vuex存储
        "Route",         # 路由配置
        "Hook"          # 生命周期钩子
    ]
)
```

### 补充解释

让我解释一下这两个参数的作用：

1. **example_queries 的作用**

`example_queries` 用于为 LLM 提供示例查询，帮助 LLM 理解如何提取实体和关系。在 <mcfile name="_prompt.py" path="/Users/cong/Downloads/fast-graphrag-main/fast_graphrag/_prompt.py"></mcfile> 中的提示模板中：

```python
PROMPTS["entity_relationship_extraction"] = """# DOMAIN PROMPT
{domain}

# GOAL
Your goal is to highlight information that is relevant to the domain and the questions that may be asked on it.

Examples of possible questions:
{example_queries}  # 这里插入示例查询

# STEPS
1. Identify all entities of the given types...
"""
```

示例用法：
```python
example_queries = """
哪些函数调用了数据库操作？
类 A 和类 B 之间是什么关系？
模块 X 依赖于哪些其他模块？
"""
```

这些示例查询帮助 LLM：
- 理解需要提取的信息类型
- 确定实体间关系的重要性
- 指导信息提取的方向

2. **entity_types 的作用**

`entity_types` 定义了需要从文本中提取的实体类型。在代码处理中，常见的实体类型包括：

```python
entity_types = [
    "Function",    # 函数
    "Class",       # 类
    "Module",      # 模块
    "Variable",    # 变量
    "Interface",   # 接口
    "Package"      # 包
]
```

entity_types 的使用体现在两个地方：

1. 提示模板中：
```python
# INPUT DATA
Types: {entity_types}  # 转换为逗号分隔的字符串
Document: {input_text}
```

2. 实体提取过程中的类型验证：
```python
# 在 DefaultInformationExtractionService 中
_clean_entity_types = [re.sub("[ _]", "", entity_type).upper() for entity_type in entity_types]
for entity in chunk_graph.entities:
    if re.sub("[ _]", "", entity.type).upper() not in _clean_entity_types:
        entity.type = "UNKNOWN"
```

这两个参数的协同作用：

1. **信息提取精确性**：
   - example_queries 指导提取方向
   - entity_types 限定提取范围

2. **关系构建完整性**：
   - example_queries 展示关系类型
   - entity_types 确保实体类型正确

3. **查询效果优化**：
   - example_queries 提供查询模式
   - entity_types 保证实体分类

使用示例：
```python
graph_rag = GraphRAG(
    working_dir="./workspace",
    domain="Python代码库分析",
    example_queries="""
        函数 process_data 调用了哪些其他函数？
        类 DataProcessor 的继承关系是什么？
        模块 utils 被哪些其他模块导入？
    """,
    entity_types=[
        "Function",
        "Class",
        "Module",
        "Variable"
    ]
)
```

这样的配置能够帮助系统：
1. 准确识别代码中的关键实体
2. 正确理解实体间的关系
3. 提供更精准的查询响应