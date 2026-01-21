# Model Context Protocol (MCP) 协议指南

> 一篇文章搞懂 MCP：是什么、怎么用、如何接入外部系统

---

## 目录

1. [MCP 是什么](#mcp-是什么)
2. [核心价值](#核心价值)
3. [工作原理：客户端-服务器架构](#工作原理客户端-服务器架构)
4. [如何使用 MCP](#如何使用-mcp)
5. [MCP 服务器开发](#mcp-服务器开发)
6. [实战示例](#实战示例)
7. [MCP vs Skills vs Subagent](#mcp-vs-skills-vs-subagent)
8. [安全注意事项](#安全注意事项)
9. [参考资源](#参考资源)

---

## MCP 是什么

**MCP (Model Context Protocol) 是一个开放协议**，让 AI 模型能安全连接和访问外部数据源、工具和服务。

### 一句话理解

MCP 就像给 AI 装了一套"接口标准"，让它能访问数据库、API、文件系统等外部系统。系统支持 MCP，AI 就能直接用，不用每次都写定制代码。

### 关键特性

- **标准化协议**：统一的接口规范，不同系统都能用
- **客户端-服务器架构**：AI 是客户端，外部系统是服务器
- **三大核心能力**：Resources（资源）、Tools（工具）、Prompts（提示词）
- **安全可控**：权限管理、数据隔离、审计日志

### 举个例子

**没有 MCP**：
```python
# 每个系统都要写定制代码
def read_notion():
    # 100 行 Notion API 代码
    
def read_github():
    # 100 行 GitHub API 代码
    
def read_database():
    # 100 行数据库代码
```

**有了 MCP**：
```json
// 配置文件
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

AI 自动连接这些服务器，直接访问数据。

---

## 核心价值

### 1. 打破数据孤岛

**传统方式**：
- AI 只能访问训练数据和对话上下文
- 实时数据、私有数据、企业数据都访问不了
- 每次都要人工复制粘贴数据

**MCP 方式**：
- AI 直接连接数据库、API、文件系统
- 实时获取最新数据
- 自动化数据访问，无需人工干预

### 2. 标准化接入

**传统方式**：
- 每个系统都要写定制集成代码
- 维护成本高，升级困难
- 不同 AI 工具之间无法复用

**MCP 方式**：
- 统一的协议标准
- 一次开发，到处可用
- 生态系统快速扩展

### 3. 安全可控

MCP 提供完整安全机制：
- **权限控制**：精细化权限管理
- **数据隔离**：不同客户端数据隔离
- **审计日志**：所有操作可追溯
- **加密传输**：数据传输加密

---

## 工作原理：客户端-服务器架构

MCP 采用**客户端-服务器（Client-Server）**架构：

```
┌─────────────┐         MCP Protocol        ┌─────────────┐
│             │  ◄────────────────────────►  │             │
│  AI Client  │                              │ MCP Server  │
│  (Claude)   │   Resources / Tools / Prompts│  (Notion)   │
│             │                              │             │
└─────────────┘                              └─────────────┘
```

### 客户端（Client）

**是什么**：AI 应用，比如 Claude Desktop、Claude Code、Cursor 等

**职责**：
- 发起连接请求
- 调用服务器提供的能力
- 处理返回的数据

### 服务器（Server）

**是什么**：提供数据和功能的外部系统

**职责**：
- 暴露 Resources（资源）
- 暴露 Tools（工具）
- 暴露 Prompts（提示词模板）
- 处理客户端请求

### 三大核心能力

#### 1. Resources（资源）

**是什么**：可读取的数据源

**示例**：
- 文件内容
- 数据库记录
- API 响应数据
- 文档内容

**特点**：
- 只读访问
- 结构化数据
- 可被 AI 理解和处理

#### 2. Tools（工具）

**是什么**：可执行的操作

**示例**：
- 创建文件
- 发送邮件
- 执行数据库查询
- 调用 API

**特点**：
- 可写操作
- 带参数
- 有副作用

#### 3. Prompts（提示词）

**是什么**：预定义的提示词模板

**示例**：
- 代码审查模板
- 文档生成模板
- 数据分析模板

**特点**：
- 可复用
- 可参数化
- 标准化工作流

---

## 如何使用 MCP

### Claude Desktop 使用方式

#### 1. 安装 MCP 服务器

MCP 服务器通常是 npm 包，用 `npx` 运行：

```bash
# 不需要全局安装，npx 会自动下载
npx -y @modelcontextprotocol/server-filesystem
```

#### 2. 配置 Claude Desktop

**配置文件位置**：
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**配置示例**：
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Documents"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

#### 3. 重启 Claude Desktop

配置完成后重启 Claude Desktop，MCP 服务器会自动启动。

#### 4. 使用

对话中，Claude 需要访问外部数据时，会自动调用相应的 MCP 服务器。

**示例**：
```
你："读取 Documents 文件夹下的 report.md"
Claude：自动调用 filesystem MCP 服务器，读取文件内容
```

### Claude Code 使用方式

Claude Code 内置了 MCP 支持，配置方式类似。

**配置文件位置**：项目根目录 `.claude/config.json`

```json
{
  "mcpServers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite"],
      "env": {
        "SQLITE_DB_PATH": "./data/project.db"
      }
    }
  }
}
```

### API 使用方式

用 Claude API 使用 MCP 需要自己实现 MCP 客户端。

Anthropic 提供了 SDK：

```python
from anthropic import Anthropic
from mcp import MCPClient

# 创建 MCP 客户端
mcp_client = MCPClient()
mcp_client.connect_server("filesystem", command="npx", args=[...])

# 使用 Claude API
client = Anthropic(api_key="your_api_key")

# 在对话中使用 MCP
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{
        "role": "user",
        "content": "读取项目文档"
    }],
    mcp_servers=[mcp_client]
)
```

---

## MCP 服务器开发

### 开发语言

MCP 服务器能用任何语言开发，官方提供了 SDK：

- **Python**: `mcp` 包
- **TypeScript/JavaScript**: `@modelcontextprotocol/sdk`

### 最小 MCP 服务器（Python）

```python
from mcp.server import Server
from mcp.types import Resource, Tool

# 创建服务器
server = Server("my-mcp-server")

# 注册 Resource
@server.list_resources()
async def list_resources():
    return [
        Resource(
            uri="file:///example.txt",
            name="Example File",
            mimeType="text/plain"
        )
    ]

@server.read_resource()
async def read_resource(uri: str):
    if uri == "file:///example.txt":
        return "This is example content"
    raise ValueError(f"Unknown resource: {uri}")

# 注册 Tool
@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="echo",
            description="Echo back the input",
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {"type": "string"}
                },
                "required": ["message"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "echo":
        return f"Echo: {arguments['message']}"
    raise ValueError(f"Unknown tool: {name}")

# 启动服务器
if __name__ == "__main__":
    server.run()
```

### 最小 MCP 服务器（TypeScript）

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 创建服务器
const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// 注册 Resource
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "file:///example.txt",
        name: "Example File",
        mimeType: "text/plain",
      },
    ],
  };
});

server.setRequestHandler("resources/read", async (request) => {
  if (request.params.uri === "file:///example.txt") {
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "text/plain",
          text: "This is example content",
        },
      ],
    };
  }
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// 注册 Tool
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "echo",
        description: "Echo back the input",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
          required: ["message"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "echo") {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${request.params.arguments.message}`,
        },
      ],
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 发布 MCP 服务器

#### 1. 发布到 npm

```bash
npm publish
```

#### 2. 用户安装

```bash
npx -y your-mcp-server
```

#### 3. 配置使用

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["-y", "your-mcp-server"]
    }
  }
}
```

---

## 实战示例

### 示例 1：文件系统 MCP 服务器

**场景**：让 AI 访问本地文件系统

**安装**：
```bash
npx -y @modelcontextprotocol/server-filesystem
```

**配置**：
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Documents"
      ]
    }
  }
}
```

**使用**：
```
你："读取 Documents/report.md 的内容"
Claude：调用 filesystem MCP，读取文件

你："在 Documents 下创建一个 todo.txt 文件"
Claude：调用 filesystem MCP，创建文件
```

**能力**：
- 读取文件内容
- 列出目录
- 创建文件
- 修改文件
- 删除文件

---

### 示例 2：GitHub MCP 服务器

**场景**：让 AI 访问 GitHub 仓库

**安装**：
```bash
npx -y @modelcontextprotocol/server-github
```

**配置**：
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

**使用**：
```
你："列出我的 GitHub 仓库"
Claude：调用 github MCP，获取仓库列表

你："读取 my-repo 的 README.md"
Claude：调用 github MCP，读取文件

你："创建一个新的 Issue"
Claude：调用 github MCP，创建 Issue
```

**能力**：
- 列出仓库
- 读取文件
- 创建/更新文件
- 管理 Issues
- 管理 Pull Requests
- 搜索代码

---

### 示例 3：数据库 MCP 服务器（PostgreSQL）

**场景**：让 AI 查询和操作数据库

**安装**：
```bash
npx -y @modelcontextprotocol/server-postgres
```

**配置**：
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:password@localhost:5432/mydb"
      }
    }
  }
}
```

**使用**：
```
你："查询 users 表中的所有用户"
Claude：调用 postgres MCP，执行 SELECT 查询

你："统计每个部门的员工数量"
Claude：调用 postgres MCP，执行聚合查询

你："创建一个新用户"
Claude：调用 postgres MCP，执行 INSERT
```

**能力**：
- 执行 SELECT 查询
- 执行 INSERT/UPDATE/DELETE
- 查看表结构
- 执行复杂查询（JOIN、聚合等）

---

### 示例 4：Notion MCP 服务器

**场景**：让 AI 访问 Notion 数据库和页面

**安装**：
```bash
npx -y @modelcontextprotocol/server-notion
```

**配置**：
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"],
      "env": {
        "NOTION_API_KEY": "secret_xxxxxxxxxxxx"
      }
    }
  }
}
```

**使用**：
```
你："读取我的任务数据库"
Claude：调用 notion MCP，读取数据库

你："创建一个新任务"
Claude：调用 notion MCP，创建页面

你："更新任务状态为完成"
Claude：调用 notion MCP，更新页面属性
```

**能力**：
- 读取数据库
- 读取页面内容
- 创建页面
- 更新页面
- 搜索内容

---

### 示例 5：自定义 MCP 服务器（天气 API）

**场景**：创建一个天气查询 MCP 服务器

**代码**（Python）：
```python
from mcp.server import Server
from mcp.types import Tool
import httpx

server = Server("weather-mcp-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="get_weather",
            description="Get current weather for a city",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "City name"
                    }
                },
                "required": ["city"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_weather":
        city = arguments["city"]
        
        # 调用天气 API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.weatherapi.com/v1/current.json",
                params={
                    "key": "your_api_key",
                    "q": city
                }
            )
            data = response.json()
            
            return f"""
            {city} 当前天气：
            - 温度：{data['current']['temp_c']}°C
            - 天气：{data['current']['condition']['text']}
            - 湿度：{data['current']['humidity']}%
            - 风速：{data['current']['wind_kph']} km/h
            """
    
    raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    server.run()
```

**配置**：
```json
{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["weather_server.py"]
    }
  }
}
```

**使用**：
```
你："北京现在天气怎么样？"
Claude：调用 weather MCP，查询天气
```

---

## MCP vs Skills vs Subagent

### 一句话区分

- **MCP**：让 Claude 能碰到外部系统
- **Skills**：告诉 Claude 碰到之后怎么用
- **Subagent**：派一个人出去干活

### 详细对比

| 维度 | MCP | Skills | Subagent |
|------|-----|--------|----------|
| **核心作用** | 连接外部系统 | 提供程序化知识 | 并行执行任务 |
| **类比** | 发工具 | 使用手册 | 派助手 |
| **Token 消耗** | 高（预加载能力描述） | 低（按需加载） | 高（独立会话） |
| **技术门槛** | 需要写代码、配服务器 | 写 Markdown 就行 | 需要配置 |
| **能访问外部数据** | ✅ | ❌ | ❌ |
| **适用场景** | 需要实时数据 | 重复性工作流 | 复杂多步骤任务 |

### 什么时候用哪个？

#### 用 MCP
- 查询数据库
- 调用第三方 API
- 读写 Notion、Jira、GitHub 等
- 访问文件系统
- 实时数据获取

#### 用 Skills
- 代码审查流程
- 文章审校流程
- 报告生成流程
- 任何"每次都要说一遍"的规则

#### 用 Subagent
- 审查整个代码仓库（耗时长）
- 同时处理多个独立任务
- 需要防止上下文污染

### 组合使用

这三个不是竞争关系，是互补关系。

**示例**：完整的数据分析工作流
1. **MCP** 连接数据库，拉取销售数据
2. **Skills** 定义数据分析流程：怎么计算增长率、怎么生成报告
3. **Subagent** 并行处理不同区域的数据分析

---

## 安全注意事项

### 风险 1：数据泄露

MCP 服务器能访问敏感数据。配置不当可能导致数据泄露。

**防护措施**：
- 只授予必要的权限
- 使用环境变量存储敏感信息（API Key、密码等）
- 不要在配置文件中硬编码密钥
- 定期轮换 API Key

### 风险 2：恶意 MCP 服务器

不可信的 MCP 服务器可能会：
- 窃取数据
- 执行恶意操作
- 发送数据到外部服务器

**防护措施**：
- 只用官方和可信来源的 MCP 服务器
- 审查 MCP 服务器代码
- 使用沙箱环境测试

### 风险 3：权限过大

MCP 服务器权限过大，可能造成误操作。

**防护措施**：
- 最小权限原则
- 只读访问优先
- 关键操作需要确认
- 审计日志

### 最佳实践

#### 1. 环境变量管理

❌ 不要这样：
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_1234567890abcdef"
      }
    }
  }
}
```

✅ 应该这样：
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

然后在系统环境变量中设置 `GITHUB_TOKEN`。

#### 2. 只读优先

只需要读数据，就别给写权限。

```json
{
  "mcpServers": {
    "filesystem-readonly": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "--readonly",
        "/Users/username/Documents"
      ]
    }
  }
}
```

#### 3. 审计日志

启用 MCP 服务器的审计日志，记录所有操作。

```python
import logging

logging.basicConfig(
    filename='mcp_audit.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    logging.info(f"Tool called: {name}, args: {arguments}")
    # ... 执行工具
```

---

## 参考资源

### 官方资源

- **MCP 官方网站**  
  https://modelcontextprotocol.io  
  协议规范、文档、教程

- **MCP GitHub 仓库**  
  https://github.com/modelcontextprotocol  
  官方实现、示例、SDK

- **MCP Python SDK**  
  https://github.com/modelcontextprotocol/python-sdk  
  Python 开发 MCP 服务器的 SDK

- **MCP TypeScript SDK**  
  https://github.com/modelcontextprotocol/typescript-sdk  
  TypeScript/JavaScript 开发 MCP 服务器的 SDK

### 官方 MCP 服务器

- **@modelcontextprotocol/server-filesystem**  
  文件系统访问

- **@modelcontextprotocol/server-github**  
  GitHub 集成

- **@modelcontextprotocol/server-postgres**  
  PostgreSQL 数据库

- **@modelcontextprotocol/server-sqlite**  
  SQLite 数据库

- **@modelcontextprotocol/server-notion**  
  Notion 集成

- **@modelcontextprotocol/server-slack**  
  Slack 集成

- **@modelcontextprotocol/server-google-drive**  
  Google Drive 集成

### 社区资源

- **Awesome MCP Servers**  
  https://github.com/punkpeye/awesome-mcp-servers  
  社区 MCP 服务器汇总

- **MCP 服务器市场**  
  https://mcp.run  
  发现和分享 MCP 服务器

### 深度文章

- **Anthropic: Introducing the Model Context Protocol**  
  https://www.anthropic.com/news/model-context-protocol  
  MCP 官方发布文章

- **Building MCP Servers: A Complete Guide**  
  https://docs.anthropic.com/mcp/building-servers  
  MCP 服务器开发完整指南

### 最新动态

- **MCP 1.0 发布**（2024年11月）  
  正式版本发布，协议稳定

- **主流 IDE 支持**（2024年12月）  
  Claude Desktop、Claude Code、Cursor、Windsurf 等都已支持

- **企业采用**  
  Slack、Notion、GitHub 等都提供了官方 MCP 服务器

---

## 总结

### MCP 的本质

MCP 是 AI 和外部世界的桥梁。

**让 AI 从"只能聊天"变成"能干活"。**

### 立即开始

1. **装一个试试**：配置 filesystem MCP，让 Claude 访问你的文件
2. **连接你的工具**：GitHub、Notion、数据库等
3. **开发自己的 MCP 服务器**：把你的系统接入 AI

### 记住

- MCP 解决的是"AI 能访问什么数据"的问题
- Skills 解决的是"AI 应该怎么做"的问题
- 两者结合，才能发挥最大价值
- 安全第一，最小权限原则

---

**最后更新**：2026年1月21日
