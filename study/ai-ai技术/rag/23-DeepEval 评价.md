# 上下文感知检索

**详细实现：**
```python
class ContextAwareRetriever:
    def __init__(
        self,
        base_retriever,
        context_encoder,
        context_fusion_model
    ):
        self.base_retriever = base_retriever
        self.context_encoder = context_encoder
        self.context_fusion_model = context_fusion_model
        
    def retrieve(
        self,
        query: str,
        context: Dict[str, Any],
        top_k: int = 5
    ) -> List[Document]:
        # 1. 编码上下文信息
        context_embedding = self.context_encoder.encode(context)
        
        # 2. 融合查询和上下文
        enhanced_query = self.context_fusion_model.fuse(
            query, context_embedding)
        
        # 3. 执行上下文感知检索
        results = self.base_retriever.retrieve(
            enhanced_query,
            context_filter=self._create_context_filter(context)
        )
        
        # 4. 上下文相关性重排序
        reranked_results = self._rerank_with_context(
            results, context)
        
        return reranked_results[:top_k]
    
    def _create_context_filter(self, context: Dict) -> Callable:
        def filter_fn(doc: Document) -> bool:
            # 检查文档是否与上下文相关
            relevance_score = self._calculate_context_relevance(
                doc, context)
            return relevance_score >= self.relevance_threshold
        return filter_fn
```

**优化策略：**
1. 上下文编码器
   ```python
   class ContextEncoder:
       def encode(self, context: Dict[str, Any]) -> np.ndarray:
           # 处理不同类型的上下文信息
           encodings = []
           
           if 'user_profile' in context:
               user_encoding = self._encode_user_profile(
                   context['user_profile'])
               encodings.append(user_encoding)
               
           if 'conversation_history' in context:
               history_encoding = self._encode_conversation(
                   context['conversation_history'])
               encodings.append(history_encoding)
               
           if 'current_task' in context:
               task_encoding = self._encode_task(
                   context['current_task'])
               encodings.append(task_encoding)
               
           # 合并所有上下文编码
           return self._merge_encodings(encodings)
   ```

2. 上下文感知排序器
   ```python
   class ContextAwareRanker:
       def rerank(
           self,
           documents: List[Document],
           query: str,
           context: Dict[str, Any]
       ) -> List[Document]:
           scored_docs = []
           
           for doc in documents:
               # 计算多个相关性分数
               relevance_scores = {
                   'query_relevance': self._calculate_query_relevance(
                       doc, query),
                   'context_relevance': self._calculate_context_relevance(
                       doc, context),
                   'temporal_relevance': self._calculate_temporal_relevance(
                       doc, context),
                   'user_preference': self._calculate_user_preference(
                       doc, context.get('user_profile', {}))
               }
               
               # 计算加权总分
               final_score = self._compute_weighted_score(
                   relevance_scores)
               scored_docs.append((doc, final_score))
               
           # 按分数排序
           return [doc for doc, _ in sorted(
               scored_docs,
               key=lambda x: x[1],
               reverse=True
           )]
   ``` 