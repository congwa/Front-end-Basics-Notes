
# Vite 中 JSONC 文件的使用

在 Vite 项目中，JSONC (JSON with Comments) 文件的使用主要体现在以下两个核心场景：作为配置文件和作为数据文件导入。理解 Vite 对这两种场景的处理方式，可以帮助我们更高效地组织和管理项目。

## 什么是 JSONC？

JSONC 是对标准 JSON 格式的一种扩展，它允许在 JSON 文件中添加单行 (`//`) 和多行 (`/* ... */`) 注释。这极大地提升了配置或数据文件的可读性和可维护性，特别是在需要为复杂配置提供解释时。

## 场景一：作为配置文件

某些工具或框架允许使用 `.jsonc` 扩展名来编写其配置文件，以便在 JSON 中添加注释。Vite 在处理这些文件时，通常是与这些工具本身的处理机制协同工作。

### 1. `tsconfig.jsonc` (TypeScript 配置文件)

* **官方支持：** TypeScript 官方对 `.jsonc` 扩展名有原生支持。这意味着可以在 `tsconfig.json` 文件中自由添加注释，而不需要将其改为 `.jsonc` 扩展名。但如果偏好使用 `.jsonc`，TypeScript 也会正确解析它。
* **Vite 的角色：** 在使用 TypeScript 的 Vite 项目中，根目录下的 `tsconfig.json` 或 `tsconfig.jsonc` 文件会被 Vite 读取，以了解 TypeScript 的编译配置（例如路径别名、目标 ECMAScript 版本等）。Vite 能够正确识别并利用这些配置，因此使用 `tsconfig.jsonc` 是完全没有问题的。
* **示例：**
    ```jsonc
    // tsconfig.jsonc
    {
      "compilerOptions": {
        "target": "ESNext", // 编译目标ES版本
        "useDefineForClassFields": true, // 在类字段上使用`define`
        "module": "ESNext", // 模块类型
        "lib": ["ESNext", "DOM"], // 包含的库
        "skipLibCheck": true, // 跳过库文件类型检查

        /* Bundler mode */
        "moduleResolution": "bundler", // 模块解析策略
        "allowImportingTsExtensions": true, // 允许导入.ts扩展名
        "resolveJsonModule": true, // 允许导入.json模块
        "isolatedModules": true, // 确保每个文件都是独立模块
        "noEmit": true, // 不生成输出文件
        "jsx": "preserve", // JSX处理方式

        /* Linting */
        "strict": true, // 启用所有严格类型检查选项
        "noUnusedLocals": true, // 检查未使用的局部变量
        "noUnusedParameters": true, // 检查未使用的函数参数
        "noFallthroughCasesInSwitch": true, // 检查switch语句中是否有遗漏的case
        "paths": { // 路径别名配置
          "@/*": ["./src/*"]
        }
      },
      "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"], // 包含的文件
      "references": [{ "path": "./tsconfig.node.json" }] // 引用其他tsconfig文件
    }
    ```

### 2. Vite 自身的配置文件 (`vite.config.js/ts`)

* **原生支持注释：** Vite 的配置文件（例如 `vite.config.js` 或 `vite.config.ts`）本身就是标准的 JavaScript 或 TypeScript 文件。这意味着可以在这些文件中直接使用 `//` 或 `/* ... */` 来添加注释，而无需依赖 `.jsonc` 扩展名。
* **无需 `.jsonc`：** 因此，**不需要**也**不应该**创建 `vite.config.jsonc` 文件。Vite 默认不会识别这类文件作为其主配置文件。尝试这样做可能导致 Vite 无法正确加载配置。

## 场景二：作为数据文件导入

在 Vite 项目中，可以像导入普通的 `.json` 文件一样，将 `.jsonc` 文件作为数据导入到的 JavaScript 或 TypeScript 代码中。

### 1. 自动解析与去注释

* **Vite 的处理机制：** Vite 内部使用了 Rollup 作为其生产构建工具。Rollup 及其生态系统（包括 Vite 的内置插件）能够识别并处理 `.json` 文件，将其内容解析为 JavaScript 对象并作为 ES 模块导出。
* **对 `.jsonc` 的支持：** 对于 `.jsonc` 文件，Vite 通常也会采取类似的处理方式。它会忽略文件中的注释，并将其余的 JSON 内容解析为一个 JavaScript 对象。这意味着无需额外的配置或插件来支持 `.jsonc` 的导入。
* **优势：** 这种自动处理的能力，让可以在 JSON 数据文件中自由添加注释，提升了数据的可读性和文档性，同时不影响其在代码中的使用。

### 2. 导入示例

假设在项目根目录或某个子目录（例如 `src/data/`）中有一个 `config.jsonc` 文件：

```jsonc
// src/data/config.jsonc

// This is a global configuration for the application
{
  "appName": "My Awesome App",
  "version": "1.0.0",
  "apiEndpoint": "/api/v1", // API 接口地址
  "debugMode": true,
  "featuresEnabled": [
    "user_profiles",
    "notifications", // Enable real-time notifications
    "dark_mode"
  ]
}
```

可以在的 JavaScript 或 TypeScript 文件中像导入普通 JSON 文件一样导入它：

```javascript
// src/main.js 或 src/main.ts

// 导入 JSONC 文件
import appConfig from './data/config.jsonc';

console.log("应用名称:", appConfig.appName); // 输出: 应用名称: My Awesome App
console.log("API 端点:", appConfig.apiEndpoint); // 输出: API 端点: /api/v1
console.log("是否处于调试模式:", appConfig.debugMode); // 输出: 是否处于调试模式: true
console.log("启用的功能:", appConfig.featuresEnabled); // 输出: 启用的功能: ["user_profiles", "notifications", "dark_mode"]

// 可以像使用任何普通 JavaScript 对象一样使用 appConfig
if (appConfig.debugMode) {
  console.warn("当前处于调试模式！");
}
```

## 总结

| 特性                  | 描述                                                                                                                              |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Vite 核心配置** | `vite.config.js` 或 `vite.config.ts` 本身支持注释，无需 `.jsonc`。                                                              |
| **其他配置文件** | 例如 `tsconfig.jsonc`，如果相关工具 (如 TypeScript) 支持 `.jsonc`，Vite 会与其兼容。                                             |
| **作为数据文件导入** | Vite 会自动处理 `.jsonc` 文件。它会剥离注释，并将其内容解析为 JavaScript 对象，可像普通 JSON 对象一样使用。无需额外配置或插件。 |
| **便利性** | 允许在配置或数据文件中添加有用的注释，提高了可读性和可维护性。                                                                |
| **内部原理** | Vite 依赖其内部的打包器（Rollup）和相关插件来解析 `.jsonc` 文件，将其转换为可导入的模块。                                       |

在 Vite 项目中灵活且高效地利用 JSONC 格式，尤其是在需要为数据或非 Vite 核心配置添加详细说明时。
