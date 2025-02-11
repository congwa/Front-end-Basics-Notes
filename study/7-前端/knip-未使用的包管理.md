# knip - 未使用的包管理

### **1. 安装 `knip`**
因为你使用的是 `pnpm`，建议作为 **开发依赖** 安装：
```sh
pnpm add -D knip
```

---

### **2. 运行 `knip`**
默认情况下，直接运行：
```sh
pnpm knip
```
它会自动检测：
- **未使用的导出**（如未被调用的函数、变量）
- **未使用的文件**（如整个项目里没有被引用的文件）
- **未使用的依赖**（如 `package.json` 里安装了但未被使用的 npm 包）

**示例输出**
```sh
Unused files
 ├─ src/oldComponent.ts
 ├─ utils/unusedHelper.ts
```

---

### **3. 配置 `knip.config.json`（可选）**
如果你想要自定义规则，可以在项目根目录创建 `knip.config.json`：
```json
{
  "entry": ["src/index.ts"],
  "ignore": ["src/types/*.d.ts"],
  "ignoreDependencies": ["eslint", "prettier"]
}
```
- `entry`：指定项目的入口文件（默认为 `package.json` 里的 `main`）
- `ignore`：忽略某些文件
- `ignoreDependencies`：不检测某些依赖是否未使用（如 `eslint`、`prettier`）

---

### **4. 结合 `package.json` 的 `scripts`（推荐）**
可以在 `package.json` 里加个 `script`：
```json
"scripts": {
  "check-unused": "knip"
}
```
然后你可以直接运行：
```sh
pnpm check-unused
```

---

### **5. 删除未使用的文件 & 依赖**
如果 `knip` 发现了未使用的文件或 npm 依赖：
- **删除未使用的文件**：
  ```sh
  rm -rf src/oldComponent.ts utils/unusedHelper.ts
  ```
- **移除未使用的 npm 依赖**：
  ```sh
  pnpm remove <package_name>
  ```

你可以先运行 `pnpm knip` 看看 `accompany` 里有多少未使用的代码和依赖，然后再决定是否要删掉。🚀