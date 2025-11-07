# n8n表达式语法

## n8n 表达式语法

### 一、表达式模式标识

#### 1. 表达式模式（Expression Mode）
- 以 `=` 开头表示该字段使用表达式
- 表达式用 `{{ }}` 包裹（可选，某些场景可直接写）

```json
"value": "={{$json.field}}"
"url": "={{$json.imageUrl}}"
```

#### 2. 纯文本模式（Text Mode）
- 不以 `=` 开头，直接作为字符串值

```json
"value2": "createTable"
"value2": "upload"
```

---

### 二、数据访问语法

#### 1. 当前节点数据访问

| 语法 | 说明 | 示例 |
|------|------|------|
| `$json` | 当前节点的 JSON 数据 | `$json.operation` |
| `$json.字段名` | 访问字段 | `$json.tableName` |
| `$json.嵌套.字段` | 访问嵌套字段 | `$json.data.name` |
| `$json['字段名']` | 使用方括号访问 | `$json['operation']` |

示例：
```33:34:n8n/test/postgres-workflow.json
              "value1": "={{$json.operation}}",
              "value2": "createTable"
```

```96:97:n8n/test/postgres-workflow.json
            "name": "={{$json.data.name}}",
            "email": "={{$json.data.email}}"
```

#### 2. Code 节点中的输入访问

| 语法 | 说明 | 示例 |
|------|------|------|
| `$input` | 所有输入项 | `$input.all()` |
| `$input.item` | 当前输入项 | `$input.item.json` |
| `$input.item.json` | 当前项的 JSON 数据 | `$input.item.json.body` |
| `$input.item.binary` | 当前项的二进制数据 | `$input.item.binary.data` |
| `$input.first()` | 第一个输入项 | `$input.first().json` |
| `$input.last()` | 最后一个输入项 | `$input.last().json` |

示例：
```20:20:n8n/test/postgres-workflow.json
        "jsCode": "// 解析请求体\nconst body = $input.item.json.body || $input.item.json;\nconst operation = body.operation || 'read'; // read, write, createTable\nconst tableName = body.table || 'test_table';\n\nconsole.log('=== PostgreSQL 操作开始 ===');\nconsole.log('操作类型:', operation);\nconsole.log('表名:', tableName);\nconsole.log('请求数据:', JSON.stringify(body, null, 2));\n\n// 返回操作信息\nreturn [{\n  json: {\n    operation,\n    tableName,\n    data: body.data || null,\n    query: body.query || null\n  }\n}];"
```

#### 3. 引用其他节点的数据

| 语法 | 说明 | 示例 |
|------|------|------|
| `$('节点名称')` | 引用指定节点 | `$('解析请求')` |
| `$('节点名称').item` | 获取节点的项 | `$('解析请求').item` |
| `$('节点名称').item.json` | 获取节点的 JSON 数据 | `$('解析请求').item.json.operation` |
| `$('节点名称').first()` | 获取节点的第一项 | `$('解析请求').first().json` |
| `$('节点名称').all()` | 获取节点的所有项 | `$('解析请求').all()` |

示例：
```90:90:n8n/test/postgres-workflow.json
          "value": "={{$('解析请求').item.json.tableName}}",
```

```154:154:n8n/test/postgres-workflow.json
        "responseBody": "={{ { success: true, operation: $('解析请求').item.json.operation, tableName: $('解析请求').item.json.tableName, data: $json } }}",
```

---

### 三、JavaScript 表达式语法

#### 1. 基本运算

```json
// 算术运算
"value": "={{$json.count + 1}}"
"value": "={{$json.price * $json.quantity}}"

// 字符串拼接
"query": "={{'WHERE ' + $json.query}}"
"url": "={{`http://localhost:9000/${bucketName}/${fileName}`}}"
```

示例：
```119:119:n8n/test/postgres-workflow.json
        "query": "=SELECT * FROM {{$json.tableName}} {{$json.query ? 'WHERE ' + $json.query : ''}} ORDER BY id DESC LIMIT 100;",
```

#### 2. 条件表达式（三元运算符）

```json
"value": "={{$json.query ? 'WHERE ' + $json.query : ''}}"
"contentType": "={{$json.mimeType || 'application/octet-stream'}}"
```

示例：
```106:106:n8n/test/minio-workflow.json
          "contentType": "={{$json.mimeType || 'application/octet-stream'}}"
```

#### 3. 逻辑运算符

```json
// 逻辑或（默认值）
"value": "={{$json.field || 'default'}}"

// 逻辑与
"value": "={{$json.field && $json.field.value}}"

// 三元运算符
"value": "={{$json.type === 'read' ? '读取' : '写入'}}"
```

示例：
```166:166:n8n/test/postgres-workflow.json
        "responseBody": "={{ { success: false, error: $json.error || $json.message || '未知错误', details: $json } }}",
```

#### 4. 类型判断和转换

```json
// 类型判断
"value": "={{typeof $json.value === 'object' ? JSON.stringify($json.value) : $json.value}}"

// 类型转换
"ttl": "={{$json.ttl ? parseInt($json.ttl) : undefined}}"
```

示例：
```49:49:n8n/test/redis-workflow.json
        "value": "={{typeof $json.value === 'object' ? JSON.stringify($json.value) : $json.value}}",
```

```51:51:n8n/test/redis-workflow.json
          "ttl": "={{$json.ttl ? parseInt($json.ttl) : undefined}}"
```

---

### 四、Code 节点返回语法

#### 1. 基本返回格式

```javascript
// 返回单个项
return [{
  json: {
    field1: 'value1',
    field2: 'value2'
  }
}];

// 返回多个项
return [
  { json: { id: 1 } },
  { json: { id: 2 } }
];
```

示例：
```20:20:n8n/test/postgres-workflow.json
        "jsCode": "// 解析请求体\nconst body = $input.item.json.body || $input.item.json;\nconst operation = body.operation || 'read'; // read, write, createTable\nconst tableName = body.table || 'test_table';\n\nconsole.log('=== PostgreSQL 操作开始 ===');\nconsole.log('操作类型:', operation);\nconsole.log('表名:', tableName);\nconsole.log('请求数据:', JSON.stringify(body, null, 2));\n\n// 返回操作信息\nreturn [{\n  json: {\n    operation,\n    tableName,\n    data: body.data || null,\n    query: body.query || null\n  }\n}];"
```

#### 2. 返回二进制数据

```javascript
return [{
  json: {
    fileName: 'test.jpg',
    binaryData: true,
    mimeType: 'image/jpeg'
  },
  binary: {
    data: buffer  // Buffer 对象
  }
}];
```

示例：
```47:47:n8n/test/minio-workflow.json
        "jsCode": "// 处理文件上传：从URL下载或使用base64（支持图片和视频）\nconst operation = $json.operation;\nconst fileUrl = $json.fileUrl;\nconst fileBase64 = $json.fileBase64;\nconst fileName = $json.fileName || `file_${Date.now()}`;\nconst fileType = $json.fileType;\n\nconsole.log('=== 处理文件数据 ===');\nconsole.log('操作:', operation);\nconsole.log('文件名:', fileName);\nconsole.log('文件类型:', fileType);\n\nif (fileBase64) {\n  // 处理base64文件（支持图片和视频）\n  // 匹配 data:image/... 或 data:video/... 或 data:application/... 等格式\n  const base64Match = fileBase64.match(/^data:([^;]+);base64,(.+)$/);\n  let base64Data, mimeType;\n  \n  if (base64Match) {\n    mimeType = base64Match[1]; // 完整的 MIME type，如 image/jpeg, video/mp4\n    base64Data = base64Match[2];\n  } else {\n    // 如果没有 MIME type 前缀，尝试从文件名推断\n    const ext = fileName.split('.').pop()?.toLowerCase();\n    const mimeMap = {\n      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',\n      'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime', 'webm': 'video/webm',\n      'pdf': 'application/pdf', 'zip': 'application/zip'\n    };\n    mimeType = mimeMap[ext] || 'application/octet-stream';\n    base64Data = fileBase64;\n  }\n  \n  const buffer = Buffer.from(base64Data, 'base64');\n  \n  return [{\n    json: {\n      operation,\n      fileName,\n      binaryData: true,\n      mimeType\n    },\n    binary: {\n      data: buffer\n    }\n  }];\n} else if (fileUrl) {\n  // 标记需要下载URL\n  return [{\n    json: {\n      operation,\n      fileName,\n      fileUrl,\n      needDownload: true\n    }\n  }];\n} else {\n  // 如果没有文件数据，检查是否有二进制数据\n  return [{\n    json: {\n      operation,\n      fileName,\n      ...$json\n    }\n  }];\n}"
```

#### 3. 访问二进制数据

```javascript
// 在 Code 节点中访问二进制数据
if ($input.item.binary && $input.item.binary.data) {
  const buffer = Buffer.from($input.item.binary.data.data);
  const contentType = $input.item.binary.data.mimeType;
}
```

示例：
```152:152:n8n/test/minio-workflow.json
        "jsCode": "// 处理下载结果，转换为base64或返回URL（支持图片和视频）\nconst operation = $('解析请求').item.json.operation;\nconst fileName = $('解析请求').item.json.fileName;\nconst bucketName = $('解析请求').item.json.bucketName;\nconst returnFormat = $('解析请求').item.json.returnFormat || 'url'; // url, base64\n\nconsole.log('=== 处理下载结果 ===');\nconsole.log('操作:', operation);\nconsole.log('文件名:', fileName);\nconsole.log('返回格式:', returnFormat);\n\nlet result;\nif (returnFormat === 'base64' && $input.item.binary && $input.item.binary.data) {\n  // 转换为base64（支持图片和视频）\n  const buffer = Buffer.from($input.item.binary.data.data);\n  const contentType = $input.item.binary.data.mimeType || 'application/octet-stream';\n  const base64 = buffer.toString('base64');\n  result = {\n    operation,\n    fileName,\n    bucketName,\n    success: true,\n    format: 'base64',\n    data: `data:${contentType};base64,${base64}`,\n    contentType,\n    message: '读取成功'\n  };\n} else {\n  // 返回URL\n  result = {\n    operation,\n    fileName,\n    bucketName,\n    success: true,\n    format: 'url',\n    url: `http://localhost:9000/${bucketName}/${fileName}`,\n    message: '读取成功'\n  };\n}\n\nreturn [{\n  json: result\n}];"
```

---

### 五、模板字符串语法

#### 1. 在表达式中使用模板字符串

```json
"url": "={{`http://localhost:9000/${bucketName}/${fileName}`}}"
"message": "={{`操作类型: ${operation}, 表名: ${tableName}`}}"
```

示例：
```142:142:n8n/test/minio-workflow.json
        "jsCode": "// 处理上传结果\nconst uploadResult = $input.item.json;\nconst operation = $('解析请求').item.json.operation;\nconst fileName = $('解析请求').item.json.fileName;\nconst bucketName = $('解析请求').item.json.bucketName;\n\nconsole.log('=== 处理上传结果 ===');\nconsole.log('操作:', operation);\nconsole.log('文件名:', fileName);\nconsole.log('上传结果:', uploadResult);\n\nreturn [{\n  json: {\n    operation,\n    fileName,\n    bucketName,\n    success: true,\n    url: `http://localhost:9000/${bucketName}/${fileName}`,\n    message: '上传成功'\n  }\n}];"
```

#### 2. 在 SQL 查询中使用模板

```json
"query": "=CREATE TABLE IF NOT EXISTS {{$json.tableName}} (...)"
"query": "=SELECT * FROM {{$json.tableName}} WHERE id = {{$json.id}}"
```

示例：
```48:48:n8n/test/postgres-workflow.json
        "query": "=CREATE TABLE IF NOT EXISTS {{$json.tableName}} (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  email VARCHAR(255),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- 创建更新时间触发器函数\nCREATE OR REPLACE FUNCTION update_updated_at_column()\nRETURNS TRIGGER AS $$\nBEGIN\n    NEW.updated_at = CURRENT_TIMESTAMP;\n    RETURN NEW;\nEND;\n$$ language 'plpgsql';\n\n-- 创建触发器（如果不存在）\nDO $$\nBEGIN\n    IF NOT EXISTS (\n        SELECT 1 FROM pg_trigger \n        WHERE tgname = 'update_{{$json.tableName}}_updated_at'\n    ) THEN\n        CREATE TRIGGER update_{{$json.tableName}}_updated_at\n            BEFORE UPDATE ON {{$json.tableName}}\n            FOR EACH ROW\n            EXECUTE FUNCTION update_updated_at_column();\n    END IF;\nEND\n$$;",
```

---

### 六、条件判断语法

#### 1. IF 节点条件

```json
{
  "conditions": {
    "string": [
      {
        "value1": "={{$json.operation}}",
        "value2": "createTable"
      }
    ]
  }
}
```

示例：
```30:37:n8n/test/postgres-workflow.json
        "conditions": {
          "string": [
            {
              "value1": "={{$json.operation}}",
              "value2": "createTable"
            }
          ]
        }
```

#### 2. 字符串比较

```json
"value1": "={{$json.status}}",
"value2": "active"
```

#### 3. 数字比较

```json
{
  "conditions": {
    "number": [
      {
        "value1": "={{$json.count}}",
        "operation": "larger",
        "value2": 10
      }
    ]
  }
}
```

---

### 七、对象和数组操作

#### 1. 对象字面量

```json
"responseBody": "={{ { success: true, data: $json } }}"
"responseBody": "={{ { success: false, error: $json.error || '未知错误' } }}"
```

示例：
```154:154:n8n/test/postgres-workflow.json
        "responseBody": "={{ { success: true, operation: $('解析请求').item.json.operation, tableName: $('解析请求').item.json.tableName, data: $json } }}",
```

#### 2. 展开运算符

```javascript
// 在 Code 节点中
return [{
  json: {
    ...$json,  // 展开当前 JSON 的所有字段
    newField: 'value'
  }
}];
```

示例：
```91:91:n8n/test/minio-workflow.json
        "jsCode": "// 合并下载的文件数据\nconst downloadedData = $input.item.json;\nconst fileName = $('准备文件数据').item.json.fileName;\nconst operation = $('准备文件数据').item.json.operation;\n\nconsole.log('=== 合并文件数据 ===');\nconsole.log('文件名:', fileName);\n\n// 如果有二进制数据，使用它\nif ($input.item.binary && $input.item.binary.data) {\n  return [{\n    json: {\n      operation,\n      fileName\n    },\n    binary: $input.item.binary\n  }];\n}\n\nreturn [{\n  json: {\n    operation,\n    fileName,\n    ...downloadedData\n  },\n  binary: $input.item.binary || {}\n}];"
```

#### 3. 数组操作

```javascript
// 在 Code 节点中
const items = $input.all();
const mapped = items.map(item => ({
  json: { ...item.json, processed: true }
}));
return mapped;
```

---

### 八、常用函数和方法

#### 1. JSON 处理

```javascript
JSON.stringify($json.value)
JSON.parse($json.stringValue)
```

示例：
```49:49:n8n/test/redis-workflow.json
        "value": "={{typeof $json.value === 'object' ? JSON.stringify($json.value) : $json.value}}",
```

#### 2. 字符串方法

```javascript
$json.name.split('.')
$json.fileName.split('.').pop()
$json.text.toLowerCase()
$json.text.toUpperCase()
```

#### 3. 类型转换

```javascript
parseInt($json.number)
parseFloat($json.float)
String($json.value)
Number($json.string)
```

示例：
```51:51:n8n/test/redis-workflow.json
          "ttl": "={{$json.ttl ? parseInt($json.ttl) : undefined}}"
```

#### 4. 日期和时间

```javascript
Date.now()
new Date().toISOString()
```

---

### 九、错误处理

#### 1. 默认值模式

```json
"value": "={{$json.field || 'default'}}"
"value": "={{$json.error || $json.message || '未知错误'}}"
```

示例：
```166:166:n8n/test/postgres-workflow.json
        "responseBody": "={{ { success: false, error: $json.error || $json.message || '未知错误', details: $json } }}",
```

#### 2. 可选链操作符（如果支持）

```javascript
$json?.field?.nested
$('节点名')?.item?.json?.field
```

---

### 十、语法速查表

| 场景 | 语法 | 示例 |
|------|------|------|
| **表达式模式** | `={{表达式}}` | `"={{$json.name}}"` |
| **当前节点数据** | `$json.字段` | `$json.operation` |
| **引用其他节点** | `$('节点名').item.json.字段` | `$('解析请求').item.json.tableName` |
| **Code 节点输入** | `$input.item.json` | `$input.item.json.body` |
| **Code 节点返回** | `return [{ json: {...} }]` | `return [{ json: { data: 'value' } }]` |
| **默认值** | `$json.field \|\| 'default'` | `$json.name \|\| '未命名'` |
| **条件判断** | `条件 ? 值1 : 值2` | `$json.type === 'read' ? '读取' : '写入'` |
| **模板字符串** | `` `文本${变量}` `` | `` `http://host/${path}` `` |
| **类型转换** | `parseInt()`, `String()` | `parseInt($json.count)` |
| **对象字面量** | `{ key: value }` | `{ success: true, data: $json }` |

---

### 十一、最佳实践

1. 表达式以 `=` 开头，复杂表达式用 `{{ }}` 包裹
2. 使用 `$('节点名')` 引用其他节点，避免硬编码
3. 使用 `||` 提供默认值，避免 undefined
4. Code 节点返回数组格式：`return [{ json: {...} }]`
5. 二进制数据使用 `binary` 字段传递
6. 复杂逻辑放在 Code 节点，简单表达式直接写在参数中
