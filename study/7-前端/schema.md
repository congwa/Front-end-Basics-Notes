
# Schema 规范

**Schema** 规范是一种用于定义和验证数据结构的标准化格式。它通常用于描述数据的类型、约束条件、字段要求等，以确保数据在输入、存储和输出过程中的一致性与完整性。不同的技术栈和工具会有不同的 Schema 规范，但它们遵循相似的原则，通常包括类型定义、验证规则和约束。

### 1. **JSON Schema 规范**

**JSON Schema** 是一种标准格式，用于描述和验证 JSON 数据的结构。它允许开发者定义对象的结构、字段类型、字段要求、枚举值等，并进行数据验证。

#### JSON Schema 主要规范

- **type**: 定义数据的类型。常见类型包括 `string`, `number`, `integer`, `boolean`, `array`, `object` 等。
- **properties**: 定义对象类型中的各个属性及其验证规则。
- **required**: 定义必须存在的属性。
- **items**: 定义数组中的元素类型。
- **additionalProperties**: 是否允许对象包含未定义的属性。
- **enum**: 定义字段允许的具体值（例如，枚举类型）。
- **minLength**, **maxLength**: 字符串的最小/最大长度。
- **minimum**, **maximum**: 数字的最小/最大值。
- **pattern**: 字符串的正则表达式验证。
- **format**: 用于描述特定类型的格式（例如，`email`, `uri`）。

#### 示例（JSON Schema）

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "The name of the user"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "The email address of the user"
    },
    "age": {
      "type": "integer",
      "minimum": 18,
      "maximum": 100,
      "description": "The age of the user"
    },
    "roles": {
      "type": "array",
      "description": "List of roles the user has",
      "items": {
        "type": "string",
        "enum": ["admin", "user", "guest"]
      },
      "example": ["user"]
    },
    "preferences": {
      "type": "object",
      "properties": {
        "theme": {
          "type": "string",
          "enum": ["light", "dark"],
          "description": "Preferred theme of the user"
        },
        "notificationsEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Whether the user has notifications enabled"
        }
      },
      "description": "User's preferences"
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string",
          "description": "The street name of the user's address"
        },
        "city": {
          "type": "string",
          "description": "The city of the user's address"
        },
        "postalCode": {
          "type": "string",
          "description": "The postal code of the user's address"
        }
      },
      "required": ["street", "city", "postalCode"],
      "description": "The user's address"
    }
  },
  "required": ["name", "email", "age"],
  "additionalProperties": false,
  "example": {
    "name": "Alice",
    "email": "alice@example.com",
    "age": 30,
    "roles": ["user"],
    "preferences": {
      "theme": "light",
      "notificationsEnabled": true
    },
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "postalCode": "12345"
    }
  }
}

```

### 2. **OpenAPI Schema 规范**

**OpenAPI**（以前叫 Swagger）是一种用于描述 RESTful API 的标准，OpenAPI Schema 用来描述 API 请求和响应的结构。OpenAPI 的 **Schema** 部分使用 JSON Schema 的子集来定义数据的类型、字段和验证规则。

#### OpenAPI Schema 常见规范

- **type**: 字段的数据类型，如 `string`, `integer`, `boolean` 等。
- **properties**: 定义对象的属性。
- **required**: 定义必须存在的字段。
- **description**: 字段的描述。
- **enum**: 定义允许的值。
- **items**: 定义数组元素的类型。
- **format**: 用于更详细描述字段类型（如 `date`, `date-time`, `password` 等）。

#### 示例（OpenAPI Schema）

```yaml
components:
  schemas:
    User:
      type: object
      description: User object containing personal information
      properties:
        name:
          type: string
          description: The name of the user
          example: "Alice"
        email:
          type: string
          format: email
          description: The email address of the user
          example: "alice@example.com"
        age:
          type: integer
          description: The age of the user
          minimum: 18
          maximum: 100
          example: 30
        createdAt:
          type: string
          format: date-time
          description: The creation timestamp of the user
          example: "2024-01-01T12:00:00Z"
        isActive:
          type: boolean
          description: Whether the user account is active
          default: true
        roles:
          type: array
          description: List of user roles
          items:
            type: string
            enum:
              - "admin"
              - "user"
              - "guest"
          example: ["admin", "user"]
        preferences:
          type: object
          description: User's preferences object
          properties:
            theme:
              type: string
              enum:
                - "light"
                - "dark"
              description: The theme preference of the user
            notificationsEnabled:
              type: boolean
              description: Whether the user has notifications enabled
              default: true
        address:
          type: object
          description: User's address
          properties:
            street:
              type: string
              description: The street name of the user
            city:
              type: string
              description: The city of the user
            postalCode:
              type: string
              description: The postal code of the user's address
          required:
            - street
            - city
            - postalCode
      required:
        - name
        - email
        - age
      additionalProperties: false # 禁止包含未定义的额外字段
      example:
        name: "John Doe"
        email: "johndoe@example.com"
        age: 25
        createdAt: "2024-01-01T12:00:00Z"
        isActive: true
        roles: ["user"]
        preferences:
          theme: "light"
          notificationsEnabled: true
        address:
          street: "123 Main St"
          city: "Springfield"
          postalCode: "12345"

```

### 3. **GraphQL Schema 规范**

**GraphQL** 是一种用于 API 的查询语言和运行时，**GraphQL Schema** 描述了可以查询的字段、类型以及可用的操作（查询、变更、订阅）。GraphQL 使用类型系统来描述数据模型，并定义每个字段的类型和约束。

#### GraphQL Schema 规范

- **type**: 定义数据类型，如 `String`, `Int`, `Float`, `Boolean`, `ID` 等。
- **query**: 定义读取数据的操作。
- **mutation**: 定义修改数据的操作。
- **required**: 强制要求字段（通过 `!` 来标识）。
- **input**: 用于定义输入对象类型。
- **enum**: 枚举类型，表示某个字段只能取特定的值。

#### 示例（GraphQL Schema）

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  age: Int
}

type Query {
  users: [User]
  user(id: ID!): User
}

type Mutation {
  createUser(name: String!, email: String!): User
}

input CreateUserInput {
  name: String!
  email: String!
  age: Int
}
```

### 4. **Mongoose Schema 规范（MongoDB）**

在 **Mongoose** 中，**Schema** 用来定义 MongoDB 数据库中的文档结构。Mongoose Schema 提供了字段类型、验证规则、默认值和其他约束。

#### Mongoose Schema 规范

- **type**: 定义字段的类型。
- **required**: 字段是否必填。
- **default**: 字段的默认值。
- **enum**: 定义字段的枚举值。
- **validate**: 自定义验证函数。
- **min** 和 **max**: 对数字类型字段的最小值和最大值进行限制。
- **unique**: 字段是否唯一。

#### 示例（Mongoose Schema）

```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/, // 邮箱正则验证
  },
  age: {
    type: Number,
    min: 18,
    max: 100,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
```

### 5. **TypeScript 类型（类型验证）**

在 TypeScript 中，**Schema** 可以通过类型定义来实现，利用 TypeScript 的类型系统来验证数据结构。尽管 TypeScript 本身并不直接用于数据验证，但通过类型定义，我们可以间接实现 Schema 的功能。

#### 示例（TypeScript 类型）

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

const user: User = {
  name: "Alice",
  email: "alice@example.com",
  age: 30,
};
```

### 6. **Yup Schema 规范**

**Yup** 是一个 JavaScript 库，用于数据验证，特别是与表单和 React 结合使用时。它使用类似于 **JSON Schema** 的定义方式来描述字段的验证规则。

#### Yup Schema 常见规范

- **string()**, **number()**, **boolean()** 等用于定义字段类型。
- **required()**: 设置字段为必填项。
- **min()**, **max()**: 限制字段值的范围。
- **matches()**: 使用正则表达式验证。
- **email()**: 用于验证邮箱格式。

#### 示例（Yup Schema）

```javascript
import * as Yup from "yup";

const userSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  age: Yup.number()
    .min(18, "Age must be at least 18")
    .max(100, "Age must be less than 100")
    .required("Age is required"),
});
```

### 7. **总结：Schema 规范的核心要素**

无论是哪种 Schema 规范，通常都包括以下要素：

- **类型定义**（type）：描述字段的数据类型，如字符串、数字、布尔值等。
- **约束条件**：如最大长度、最小值、必填项、唯一性等。
- **默认值**（default）：字段的默认值。
- **验证规则**：如正则表达式验证、范围限制、枚举值等。

通过定义和遵循 Schema 规范，可以确保数据的一致性、有效性，并简化数据验证过程。
