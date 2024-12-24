# rag架构图示例

```d2
Frontend_Layer: {
  label: "前端层 Frontend Layer"
  Web_UI: "Web UI - Next.js"
  API_Client: "API 客户端"

  Web_UI -> API_Client
}

Backend_Layer: {
  label: "后端层 Backend Layer"
  API_Service: "API 服务 - Flask"
  Task_Queue: "任务队列 - Celery"
  Database: "数据库"

  Core_Modules: {
    label: "核心功能模块 Core Modules"
    Workflow: "工作流编排 Workflow"
    RAG_Pipeline: "RAG Pipeline"
    Agent_System: "Agent System"
    LLMOps: "LLMOps"

    # LLMOps -> External_Services
  }

  API_Service -> Core_Modules
  API_Service -> Task_Queue
  API_Service -> Database
}

External_Services: {
  label: "外部服务 External Services"
  LLM_Model: "各类 LLM 模型"
  Document_Storage: "文档存储"
  Third_Party_API: "第三方工具/API"

  LLM_Model
  Document_Storage
  Third_Party_API
}

Frontend_Layer.API_Client -> Backend_Layer.API_Service
# Backend_Layer.Core_Modules -> External_Services

Backend_Layer.Core_Modules.Workflow -> External_Services.LLM_Model
Backend_Layer.Core_Modules.RAG_Pipeline -> External_Services.Document_Storage
Backend_Layer.Core_Modules.Agent_System -> External_Services.Third_Party_API

```

![rag图](/study/imgs/d2-rag.png)
