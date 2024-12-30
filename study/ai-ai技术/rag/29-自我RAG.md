# 自我RAG

**详细实现：**
```python
class SelfRAG:
    def __init__(
        self,
        retriever,
        generator,
        evaluator
    ):
        self.retriever = retriever
        self.generator = generator
        self.evaluator = evaluator
        
    def process_query(
        self,
        query: str
    ) -> Dict:
        # 1. 检索决策
        should_retrieve = self._decide_retrieval_need(query)
        
        # 2. 文档检索
        if should_retrieve:
            docs = self.retriever.retrieve(query)
            relevance = self.evaluator.evaluate_relevance(docs, query)
        
        # 3. 生成响应
        response = self.generator.generate(
            query,
            docs if should_retrieve else None
        )
        
        # 4. 评估支持度
        support = self.evaluator.evaluate_support(
            response, docs if should_retrieve else None)
            
        return {
            'response': response,
            'used_retrieval': should_retrieve,
            'support_score': support
        }
```

**优化策略：**
1. 检索决策器
   ```python
   class RetrievalDecider:
       def decide(self, query: str) -> bool:
           # 分析查询特征
           features = self._extract_query_features(query)
           
           # 评估是否需要检索
           retrieval_score = self._evaluate_retrieval_need(features)
           
           return retrieval_score > self.threshold
   ``` 