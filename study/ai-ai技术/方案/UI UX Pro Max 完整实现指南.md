
# UI UX Pro Max 完整实现指南

## 正确的工作流程图

```
┌─────────────────────────────────────────────────────────────────┐
│  阶段一：环境准备                                                │
│  1. 安装 uipro-cli                                              │
│  2. 初始化项目                                                   │
│  3. 检查 Python                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  阶段二：需求分析                                                │
│  1. 阅读需求文档                                                 │
│  2. 提取：产品类型、行业、风格、技术栈                            │
│  3. 列出所有页面清单                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  阶段三：生成全局设计系统（MASTER）← 最关键的一步                 │
│  python3 ... --design-system --persist -p "项目名"               │
│  输出：design-system/MASTER.md                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  阶段四：获取技术栈指南（在编码前）                               │
│  --stack react / nextjs / shadcn                                │
│  了解该技术栈的最佳实践                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  阶段五：逐页面实现（循环执行）                                   │
│                                                                  │
│  对于每个页面：                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Step 1: 生成页面设计规范                                    │ │
│  │ python3 ... --design-system --persist --page "页面名"       │ │
│  │ 输出：design-system/pages/页面名.md                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Step 2: 补充搜索（如需要）                                  │ │
│  │ --domain chart / ux / typography 等                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Step 3: 编写代码                                            │ │
│  │ 告诉 AI 读取 MASTER.md + pages/xxx.md，生成代码             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Step 4: 页面验证                                            │ │
│  │ 使用检查清单验证该页面                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│               继续下一个页面，或全部完成                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  阶段六：最终验证                                                │
│  全局检查、响应式测试、可访问性测试                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 阶段一：环境准备

```bash
# 1. 安装 CLI 工具
npm install -g uipro-cli

# 2. 进入项目目录
cd /path/to/your-project

# 3. 初始化（为 Cursor 安装技能）
uipro init --ai cursor

# 4. 检查 Python（脚本运行需要）
python3 --version
```

---

## 阶段二：需求分析

### 2.1 从需求文档提取信息

| 要提取的信息 | 问题 | 你的答案 |
|------------|-----|---------|
| 产品类型 | 做什么产品？ | _（如：Creator Studio）_ |
| 行业 | 属于哪个行业？ | _（如：内容创作/社交）_ |
| 目标用户 | 谁使用？ | _（如：内容创作者）_ |
| 风格关键词 | 想要什么感觉？ | _（如：现代、简洁）_ |
| 技术栈 | 用什么技术？ | _（如：Next.js + shadcn）_ |

### 2.2 列出所有页面

```
页面清单：
1. 登录页 (login)
2. 仪表盘 (dashboard)
3. 内容管理 (content)
4. 社区 (community)
5. 粉丝分析 (fans)
6. 消息中心 (messages)
7. 收益统计 (earnings)
8. 设置 (settings)
...
```

---

## 阶段三：生成全局设计系统（MASTER）

**这是最关键的一步，必须在任何页面实现之前完成！**

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "你的产品关键词（产品类型 + 行业 + 风格）" \
  --design-system \
  --persist \
  -p "项目名称"
```

**示例：**
```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "creator economy platform SaaS dashboard content management social" \
  --design-system \
  --persist \
  -p "ShireHub Studio"
```

**生成的文件：**
```
design-system/
└── MASTER.md    ← 全局设计规范（配色、字体、风格、效果、反模式）
```

---

## 阶段四：获取技术栈指南

**在开始编码之前**，了解你使用的技术栈的最佳实践：

```bash
# 如果使用 React
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "hooks state memo performance" \
  --stack react

# 如果使用 Next.js
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "routing ssr images api" \
  --stack nextjs

# 如果使用 shadcn/ui
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "components form dialog table" \
  --stack shadcn
```

**这些命令输出的是文本指南**，告诉你：
- ✅ 应该怎么做（Do）
- ❌ 不应该怎么做（Don't）
- 优先级（HIGH/MEDIUM/LOW）

把这些指南记住或保存下来，后续编码时参考。

---

## 阶段五：逐页面实现（循环）

**对于页面清单中的每个页面，重复以下步骤：**

### Step 1：生成页面设计规范

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "页面相关关键词" \
  --design-system \
  --persist \
  -p "项目名称" \
  --page "页面名称"
```

**示例（仪表盘页面）：**
```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "dashboard analytics metrics data visualization stats" \
  --design-system \
  --persist \
  -p "ShireHub Studio" \
  --page "dashboard"
```

**生成的文件：**
```
design-system/
├── MASTER.md
└── pages/
    └── dashboard.md    ← 仪表盘页面特定规范
```

---

### Step 2：补充搜索（如需要）

如果页面有特殊需求，搜索特定领域：

```bash
# 如果页面需要图表
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "trend line bar pie" \
  --domain chart

# 如果需要 UX 最佳实践
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "animation loading accessibility" \
  --domain ux

# 如果需要表单指南
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "form validation error" \
  --domain ux
```

---

### Step 3：编写代码

切换到 **Agent 模式**，告诉 AI：

```
我正在构建【仪表盘页面】。

请先读取：
1. design-system/MASTER.md（全局设计规范）
2. design-system/pages/dashboard.md（页面特定规范）

页面需要包含：
- 欢迎区域
- 关键指标卡片（4个）
- 数据趋势图表
- 最新动态列表

技术栈：React + Next.js + shadcn/ui + Tailwind CSS
请生成代码。
```

---

### Step 4：页面验证

完成代码后，检查：

```
视觉：
[ ] 配色与 MASTER.md 一致
[ ] 没有使用 emoji 作为图标
[ ] Hover 状态无布局偏移

交互：
[ ] 可点击元素有 cursor-pointer
[ ] 过渡动画 150-300ms

响应式：
[ ] 375px / 768px / 1024px / 1440px 正常

可访问性：
[ ] 图片有 alt
[ ] 表单有 label
```

---

### 重复以上步骤

对每个页面重复 Step 1-4：

| 页面 | 关键词 |
|-----|-------|
| 登录 | `login authentication social oauth simple` |
| 仪表盘 | `dashboard analytics metrics data visualization` |
| 内容管理 | `content management posts articles table list` |
| 社区 | `community social posts comments interaction` |
| 粉丝分析 | `fans analytics audience demographics` |
| 消息中心 | `messaging chat inbox notifications` |
| 收益统计 | `earnings revenue monetization income` |
| 设置 | `settings profile account preferences form` |

---

## 阶段六：最终验证

所有页面完成后：

1. **全局一致性检查** - 所有页面风格是否统一
2. **响应式测试** - 各断点是否正常
3. **可访问性测试** - 键盘导航、屏幕阅读器
4. **性能检查** - 加载速度、动画流畅度

---

## 命令速查表（按使用顺序）

| 顺序 | 阶段 | 命令 |
|-----|-----|-----|
| 1 | 安装 | `npm install -g uipro-cli` |
| 2 | 初始化 | `uipro init --ai cursor` |
| 3 | 生成 MASTER | `... --design-system --persist -p "项目名"` |
| 4 | 技术栈指南 | `... --stack react/nextjs/shadcn` |
| 5 | 页面规范 | `... --design-system --persist -p "项目名" --page "页面名"` |
| 6 | 补充搜索 | `... --domain chart/ux/typography` |

---

核心是：

1. **先 MASTER** → 2. **后技术栈** → 3. **再逐页面**
