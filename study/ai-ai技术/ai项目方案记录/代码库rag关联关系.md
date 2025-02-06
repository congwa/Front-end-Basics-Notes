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