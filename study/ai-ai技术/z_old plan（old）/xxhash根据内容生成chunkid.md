# chunk_id 生成机制

1. **分块服务**
在 <mcfile name="_chunk_extraction.py" path="/Users/cong/Downloads/fast-graphrag-main/fast_graphrag/_services/_chunk_extraction.py"></mcfile> 中实现：

```python
@dataclass
class DefaultChunkingService(BaseChunkingService[TChunk]):
    """Default chunk extractor."""
    
    chunk_size: int = field(default=512)
    chunk_overlap: int = field(default=128)
    
    async def extract(self, data: Iterable[TDocument]) -> Iterable[Iterable[TChunk]]:
        """Extract chunks from documents."""
        chunks_per_data = []
        for document in data:
            # 1. 获取文本内容
            text = document.data
            
            # 2. 分块处理
            chunks = []
            start = 0
            while start < len(text):
                # 计算当前块的结束位置
                end = min(start + self.chunk_size, len(text))
                
                # 提取文本块
                chunk_text = text[start:end]
                
                # 创建块对象
                chunk = TChunk(
                    id=self._generate_chunk_id(chunk_text),
                    text=chunk_text,
                    metadata=document.metadata
                )
                chunks.append(chunk)
                
                # 移动到下一个位置，考虑重叠
                start = end - self.chunk_overlap
                
            chunks_per_data.append(chunks)
            
        return chunks_per_data
```

2. **Chunk ID 生成**
使用 xxhash 算法生成唯一标识：

```python
def _generate_chunk_id(self, text: str) -> THash:
    """Generate a unique hash for the chunk."""
    return xxhash.xxh64(text.encode()).hexdigest()
```

主要特点：

1. **分块策略**：
- 固定大小分块：默认 512 字符
- 重叠分块：默认 128 字符重叠
- 保留原文档元数据

2. **ID 生成机制**：
- 使用 xxhash 算法
- 基于块内容生成
- 确保唯一性和一致性

3. **分块流程**：

```python
# 1. 文档预处理
data = (TDocument(data=c, metadata=metadata or {}) for c in content)

# 2. 分块处理
chunked_documents = await self.chunking_service.extract(data=data)

# 3. 去重检查
new_chunks_per_data = await self.state_manager.filter_new_chunks(chunks_per_data=chunked_documents)
```

4. **块的数据结构**：
```python
@dataclass
class TChunk:
    id: THash                    # 块的唯一标识
    text: str                    # 块的文本内容
    metadata: Dict[str, Any]     # 块的元数据
```

分块的优点：

1. **高效性**：
- 使用快速的哈希算法
- 支持增量更新
- 自动去重

2. **灵活性**：
- 可配置的块大小
- 可配置的重叠大小
- 支持自定义元数据

3. **一致性**：
- 基于内容的 ID 生成
- 相同内容生成相同 ID
- 便于检测重复

使用示例：

```python
# 配置分块服务
chunking_service = DefaultChunkingService(
    chunk_size=512,      # 块大小
    chunk_overlap=128    # 重叠大小
)

# 处理文档
document = TDocument(
    data="your text content",
    metadata={"source": "file.txt"}
)

# 执行分块
chunks = await chunking_service.extract([document])
```

这种设计确保了：
1. 文档的高效分块
2. 块的唯一标识
3. 内容的一致性
4. 元数据的保留