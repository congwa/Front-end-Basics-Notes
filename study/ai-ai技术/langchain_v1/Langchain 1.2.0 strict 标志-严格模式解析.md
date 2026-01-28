## LangChain 1.2.0：strict 标志的结构化输出说明

### 1. 背景
LangChain 1.2.0 在响应格式管线中新增严格模式入口。

- ProviderStrategy 统一调用不同厂商的 structured output 能力。
- 同一份 schema 可以在不同模型之间复用。
- strict 标志将“必须按 JSON Schema 输出”交给底层模型执行，而不是依赖后处理。

### 2. 快速理解
1. 用户给出一个 JSON Schema。
2. 未开启 strict 时，模型仍可能返回其他格式。
3. strict=True 时，不符合 schema 的响应会在模型侧被拒绝。

### 3. strict 模式的执行路径
1. **schema 归一化**。
   `ProviderStrategy` 初始化时会把 Pydantic、TypedDict、JSON Schema 等格式转换为 `_SchemaSpec`，并记录 `strict`。@libs/langchain_v1/langchain/agents/structured_output.py#105-304
2. **请求拼装**。
   `to_model_kwargs()` 生成 `response_format` 字段，并在 JSON Schema 内写入 `{"strict": true}`。该结构与 OpenAI Structured Outputs API 一致。@libs/langchain_v1/langchain/agents/structured_output.py#291-304
3. **输出解析**。
   代理获取回复后，使用 `ProviderStrategyBinding` 解析；若不符合 schema，则抛出 `StructuredOutputValidationError`。@libs/langchain_v1/langchain/agents/factory.py#913-940

### 4. 厂商接口与请求流程
1. **OpenAI**。
   - `ProviderStrategy.to_model_kwargs()` 生成的 `response_format.json_schema` 中追加 `{"strict": true}`。
   - 走 Chat Completions API 时严格模式落在 `payload["response_format"]["json_schema"]["strict"]`。
   - 走 Responses API 时严格模式落在 `payload["text"]["format"]["strict"]`。
   - 两种路径都直接调用 OpenAI Structured Outputs 的原生校验能力。@libs/langchain_v1/langchain/agents/structured_output.py#291-304 @libs/langchain_v1/tests/unit_tests/agents/test_response_format_integration.py#146-189
   - 官方参照：OpenAI Structured Outputs 指南与 Responses API 文档均明确支持 `strict: true` 语义。<https://platform.openai.com/docs/guides/structured-outputs> <https://platform.openai.com/docs/guides/responses>
2. **Anthropic / 其他模型**。
   - 代理工厂先通过 `_supports_provider_strategy()` 判断模型是否支持 provider 级 structured output。@libs/langchain_v1/langchain/agents/factory.py#1066-1075
   - 若支持，则与 OpenAI 一样直接透传 schema，并由厂商负责校验。
   - 若不支持，则自动回退到 ToolStrategy，改用 LangChain 自建工具解析链。
   - 官方参照：Anthropic 在 Structured Outputs 文档中说明了 JSON Schema 约束与 `tool_choice` 的配套能力，可与 ProviderStrategy 对接。<https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs>
3. **绑定逻辑**。
   - `agent factory` 在调用 `model.bind_tools()` 时同时传入 `strict=True` 与 `response_format`。@libs/langchain_v1/langchain/agents/factory.py#1089-1099
   - 该绑定确保每次请求都包含严格模式参数，不依赖调用方手动拼装。

```mermaid
flowchart TD
    A[定义 schema + strict=True] --> B[ProviderStrategy 生成 response_format]
    B --> C[agent factory bind_tools(strict=True, response_format)]
    C --> D[模型侧执行厂商原生 strict 校验]
    D --> E[返回 AIMessage]
    E --> F[ProviderStrategyBinding.parse -> structured_response]
```

### 5. 启用方式
创建代理或链路时，将响应格式设为 `ProviderStrategy(schema, strict=True)`：

```python
agent = create_agent(
    ChatOpenAI(model="gpt-5"),
    tools=[get_weather],
    response_format=ProviderStrategy(WeatherBaseModel, strict=True),
)
```

只要 schema 能生成 JSON Schema（例如 Pydantic BaseModel），LangChain 会自动选择对应模型的原生 structured output 接口。

### 6. 测试覆盖
1. **单元测试**：`tests/unit_tests/agents/test_responses.py` 验证 `response_format.json_schema` 中包含 `"strict": true`。@libs/langchain_v1/tests/unit_tests/agents/test_responses.py#63-131
2. **集成测试**：`test_response_format_integration.py::test_strict_mode` 通过记录请求 payload，确认 Responses API 与 Chat Completions 分支都携带 strict 字段，并返回 `WeatherBaseModel` 实例。@libs/langchain_v1/tests/unit_tests/agents/test_response_format_integration.py#146-189

测试覆盖显示 strict 模式在代理创建、请求发送、结果解析三个阶段均被执行。

### 7. 小结
1. `strict=True` 由 ProviderStrategy 负责透传到底层模型。
2. 模型侧严格校验可以减少解析失败次数。
3. LangChain 在解析阶段直接抛错，便于定位问题。

需要稳定 JSON/Pydantic 输出的场景可以通过 `ProviderStrategy(..., strict=True)` 获得相同的行为。
