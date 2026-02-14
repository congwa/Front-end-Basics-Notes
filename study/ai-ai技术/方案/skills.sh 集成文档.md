# skills.sh 集成文档

## 一、概述

skills.sh 是 Agent Skills 生态的官方目录网站，由 Vercel Labs 维护。当前已收录 **57,000+** 个 Skill。本文档整理所有可用的数据获取途径，覆盖列表、搜索、详情、原始内容下载和版本变更检测。

---

## 二、搜索 API

这是唯一经过验证的公开 JSON 接口。

**端点**

```
GET https://skills.sh/api/search?q={query}&limit={limit}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `q` | string | 是 | 搜索关键词，最少 2 个字符 |
| `limit` | number | 否 | 返回上限，默认 20 |

**请求示例**

```bash
curl "https://skills.sh/api/search?q=react&limit=10"
```

**响应**

```json
{
  "query": "react",
  "searchType": "fuzzy",
  "skills": [
    {
      "id": "vercel-labs/agent-skills/vercel-react-best-practices",
      "skillId": "vercel-react-best-practices",
      "name": "vercel-react-best-practices",
      "installs": 129977,
      "source": "vercel-labs/agent-skills"
    }
  ],
  "count": 10,
  "duration_ms": 18
}
```

**字段说明**

| 字段 | 说明 | 示例 |
|---|---|---|
| `id` | 全局唯一标识 | `"vercel-labs/agent-skills/vercel-react-best-practices"` |
| `skillId` | Skill 短名 | `"vercel-react-best-practices"` |
| `name` | 显示名称 | `"vercel-react-best-practices"` |
| `installs` | 累计安装次数 | `129977` |
| `source` | 来源仓库 | `"vercel-labs/agent-skills"` |

**已验证的行为**

- `q` 为单个字符（如 `a`）时报错
- `q` 为 2 个字符以上时正常返回
- `q` 为通用词（如 `skill`、`best`、`design`）时可返回大量热门结果
- `q=*` 不可用
- 无公开的 "list all" 端点

---

## 三、排行榜页面

skills.sh 提供三个排行榜视图，每个页面服务端渲染了约 **200 条**数据（HTML 格式，非 JSON）。

| 排行榜 | URL | 排序逻辑 | 数据含义 |
|---|---|---|---|
| **总榜** | `https://skills.sh/` | 按历史总安装量降序 | 数字 = 总安装量，如 `221.6K` |
| **趋势榜** | `https://skills.sh/trending` | 按最近 24 小时安装量降序 | 数字 = 24h 安装量，如 `15.7K` |
| **热门榜** | `https://skills.sh/hot` | 按热度算法（含增长比例） | 格式 `10+10`，含义推测为 近期+新增 |

**没有找到**对应的 JSON API（`/api/leaderboard` 返回 404）。如需结构化数据，可以：

1. 用搜索 API 以通用关键词多次请求后聚合去重
2. 解析 HTML 页面提取数据

**HTML 中每条 Skill 的数据结构**（以总榜为例）：

```
排名. source/名称    安装量
例: 1  vercel-labs/skills  221.6K
    URL: https://skills.sh/vercel-labs/skills/find-skills
```

---

## 四、Skill 详情页

**端点**

```
GET https://skills.sh/{owner}/{repo}/{skill-name}
```

**示例**

```
https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices
```

返回 HTML 页面，包含以下信息：

| 数据项 | 说明 |
|---|---|
| Skill 名称 | `vercel-react-best-practices` |
| 安装命令 | `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices` |
| SKILL.md 内容 | 完整 Markdown 渲染后的内容 |
| Weekly Installs | 每周安装量，如 `112.9K` |
| Repository | GitHub 仓库链接 |
| First Seen | 首次收录时间，如 `Jan 16, 2026` |
| 各 Agent 安装分布 | 如 `claude-code 70.5K, opencode 62.4K, cursor 52.1K` 等 |

---

## 五、Owner / Repo 聚合页

**按 Owner 查看**

```
GET https://skills.sh/{owner}
```

示例: `https://skills.sh/vercel-labs`

返回该 Owner 下所有仓库及 Skill 的汇总：

```
vercel-labs
16 repos | 48 skills | 571.5K total installs

- agent-skills    5 skills    295.4K
- skills          1 skill     221.6K
- agent-browser   2 skills     36.3K
- next-skills     3 skills     17.6K
  ...
```

**按仓库查看**

```
GET https://skills.sh/{owner}/{repo}
```

示例: `https://skills.sh/vercel-labs/agent-skills`

返回该仓库下所有 Skill 的列表，含名称、描述和安装量：

```
vercel-labs/agent-skills
8 skills | 295.3K total installs

- vercel-react-best-practices     130.0K  (含描述)
- web-design-guidelines            97.5K  (含描述)
- vercel-composition-patterns      39.2K  (含描述)
  ...
```

---

## 六、获取 Skill 原始内容（SKILL.md）

### 6.1 通过 GitHub Raw URL

```
GET https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{skill-path}/SKILL.md
```

**注意**：skill 在仓库中的路径不固定，需先通过 GitHub Trees API 确定。常见路径模式：

| 模式 | 示例 |
|---|---|
| `skills/{name}/SKILL.md` | `skills/react-best-practices/SKILL.md` |
| `{name}/SKILL.md` | `find-skills/SKILL.md` |
| 根目录 `SKILL.md` | 单 Skill 仓库 |

### 6.2 通过 GitHub Blob API（获取单个文件）

```bash
# 先获取 blob SHA（从 Trees API 的结果中找到）
curl -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/{owner}/{repo}/git/blobs/{sha}"
```

返回 base64 编码的文件内容。

### 6.3 SKILL.md 文件格式

```yaml
---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines...
metadata:
  internal: false          # 可选，是否内部 Skill
---

# Skill 标题

Markdown 正文内容...
```

用 `gray-matter` 库解析 YAML frontmatter 即可提取结构化元信息。

---

## 七、GitHub Trees API（发现仓库内所有 Skill + 版本检测）

这是最核心的 API，一次调用同时解决两个问题：**发现仓库内全部 Skill** 和 **检测 Skill 是否有更新**。

**端点**

```
GET https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1
```

**示例**

```bash
curl -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/vercel-labs/agent-skills/git/trees/main?recursive=1"
```

**响应结构（精简）**

```json
{
  "sha": "e23951b8...",
  "tree": [
    {
      "path": "skills/react-best-practices",
      "type": "tree",
      "sha": "079b06a1..."
    },
    {
      "path": "skills/react-best-practices/SKILL.md",
      "type": "blob",
      "sha": "1ad7750e...",
      "size": 6165
    },
    {
      "path": "skills/react-best-practices/rules/async-parallel.md",
      "type": "blob",
      "sha": "64133f6c...",
      "size": 654
    }
  ]
}
```

**用途 1：发现仓库内所有 Skill**

过滤所有 `type: "blob"` 且 `path` 以 `/SKILL.md` 结尾的条目：

```javascript
const skillEntries = data.tree.filter(
  entry => entry.type === 'blob' && entry.path.endsWith('/SKILL.md')
);
// 结果: 
// - skills/react-best-practices/SKILL.md
// - skills/composition-patterns/SKILL.md
// - skills/web-design-guidelines/SKILL.md
// - ...
```

**用途 2：获取 Skill 文件夹的 tree SHA（用于版本检测）**

每个 `type: "tree"` 的条目都有一个 `sha`，这是 Git 对该目录所有内容计算的哈希。当目录内任何文件变化时，此 SHA 必然改变。

```javascript
const folderEntry = data.tree.find(
  entry => entry.type === 'tree' && entry.path === 'skills/react-best-practices'
);
// folderEntry.sha = "079b06a1..."  ← 这就是版本指纹
```

**版本检测流程**：

```
1. 安装时：记录 folder SHA = "079b06a1..."
2. 检测时：重新调用 Trees API，获取最新 folder SHA
3. 对比：
   - 相同 → 没有更新
   - 不同 → 有新版本
```

**用途 3：获取 Skill 包含的所有文件列表**

```javascript
const skillFiles = data.tree.filter(
  entry => entry.path.startsWith('skills/react-best-practices/') && entry.type === 'blob'
);
// 结果:
// - skills/react-best-practices/SKILL.md
// - skills/react-best-practices/AGENTS.md
// - skills/react-best-practices/rules/async-parallel.md
// - skills/react-best-practices/rules/bundle-barrel-imports.md
// - ... (57 个规则文件)
```

**速率限制**

| 认证方式 | 速率 |
|---|---|
| 无 Token | 60 次/小时 |
| 带 GitHub Token | 5,000 次/小时 |

**重要优化**：同一仓库只需调用一次 Trees API，就能同时获取该仓库下所有 Skill 的文件列表和版本哈希。

**Token 获取方式**（优先级从高到低）：

```bash
# 1. 环境变量
export GITHUB_TOKEN="ghp_xxxx"

# 2. GitHub CLI
gh auth token
```

**branch 处理**：需尝试 `main` 和 `master` 两个分支，哪个成功用哪个。

---

## 八、通过 CLI 安装 Skill

skills.sh 的 CLI 工具发布在 npm 上，包名为 `skills`。

**安装指定 Skill**

```bash
# 基本安装（交互式）
npx skills add {owner}/{repo} --skill {skill-name}

# 全局安装 + 跳过确认
npx skills add {owner}/{repo} --skill {skill-name} -g -y

# 安装到指定 agent
npx skills add {owner}/{repo} --skill {skill-name} -a cursor claude-code

# 安装仓库内全部 Skill
npx skills add {owner}/{repo} --all
```

**查看仓库有哪些 Skill（不安装）**

```bash
npx skills add {owner}/{repo} --list
```

**安装后的文件位置**

| 范围 | 路径 |
|---|---|
| 全局（`-g`） | `~/.cursor/skills/{skill-name}/SKILL.md` |
| 项目级 | `.cursor/skills/{skill-name}/SKILL.md` |

不同 agent 的路径不同（`.claude/skills/`、`.codex/skills/`、`.agents/skills/` 等），默认使用 symlink 模式共享同一份文件。

**检查更新**

```bash
npx skills check     # 检测哪些 Skill 有更新
npx skills update    # 更新所有有新版本的 Skill
```

---

## 九、Well-Known 协议（自建 Skill 源）

任何网站可以通过 RFC 8615 well-known 协议发布 Skills：

**索引文件**

```
GET https://example.com/.well-known/skills/index.json
```

```json
{
  "skills": [
    {
      "name": "my-skill",
      "description": "What this skill does",
      "files": ["SKILL.md", "extra-context.md"]
    }
  ]
}
```

**Skill 文件**

```
GET https://example.com/.well-known/skills/{skill-name}/SKILL.md
GET https://example.com/.well-known/skills/{skill-name}/{other-file}
```

**安装**

```bash
npx skills add https://example.com
```

CLI 会自动发现 `/.well-known/skills/index.json` 并列出可安装的 Skills。

---

## 十、接口能力汇总

| 需求 | 推荐方案 | 数据格式 |
|---|---|---|
| 搜索 Skill | `GET /api/search?q=xx` | JSON |
| 获取热门列表 | 搜索通用词 或 解析 `skills.sh/` 页面 | JSON / HTML |
| 获取趋势列表 | 解析 `skills.sh/trending` 页面 | HTML |
| 获取热门榜 | 解析 `skills.sh/hot` 页面 | HTML |
| 查看 Skill 详情 | `skills.sh/{owner}/{repo}/{name}` | HTML |
| 查看 Owner 的所有 Skill | `skills.sh/{owner}` | HTML |
| 查看仓库的所有 Skill | `skills.sh/{owner}/{repo}` | HTML |
| 下载 SKILL.md 原文 | GitHub Raw URL 或 Blob API | text / base64 |
| 发现仓库全部 Skill | GitHub Trees API (`?recursive=1`) | JSON |
| 检测 Skill 版本变化 | GitHub Trees API 对比 folder SHA | JSON |
| 安装 Skill 到本地 | `npx skills add` CLI | - |

---

## 十一、编程集成指南（不依赖 CLI，在自己软件中实现）

以下内容基于 [skills-main](https://github.com/vercel-labs/skills) CLI 源码逆向整理，涵盖搜索、克隆、发现、安装、更新检测的完整编程实现方案。适用于将 Skill 功能集成到你自己的桌面/Web 应用中。

---

### 11.1 搜索 Skill

直接调用 skills.sh 的搜索 API，无需任何依赖。

```typescript
interface SkillSearchResult {
  id: string;        // "vercel-labs/agent-skills/vercel-react-best-practices"
  skillId: string;   // "vercel-react-best-practices"
  name: string;      // "vercel-react-best-practices"
  installs: number;  // 129977
  source: string;    // "vercel-labs/agent-skills"
}

async function searchSkills(query: string, limit = 20): Promise<SkillSearchResult[]> {
  const url = `https://skills.sh/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.skills;
}
```

---

### 11.2 解析来源字符串

CLI 支持多种输入格式，源码中 `source-parser.ts` 定义了完整的解析规则。你的软件需要支持以下格式：

| 输入格式 | 解析类型 | 示例 |
|---|---|---|
| `owner/repo` | github | `vercel-labs/agent-skills` |
| `owner/repo@skill-name` | github + skillFilter | `vercel-labs/skills@find-skills` |
| `owner/repo/sub/path` | github + subpath | `vercel-labs/agent-skills/skills/react-best-practices` |
| `https://github.com/owner/repo` | github | 完整 GitHub URL |
| `https://github.com/owner/repo/tree/main/path` | github + ref + subpath | 带分支和路径 |
| `https://gitlab.com/group/repo` | gitlab | GitLab URL |
| `./local/path` | local | 本地路径 |
| `https://example.com` | well-known | 自建 Skill 源 |
| `https://docs.bun.com/docs/skill.md` | direct-url | 直接指向 SKILL.md |

**核心解析逻辑**（简化版）：

```typescript
interface ParsedSource {
  type: 'github' | 'gitlab' | 'git' | 'local' | 'direct-url' | 'well-known';
  url: string;
  subpath?: string;    // 仓库内子路径
  ref?: string;        // 分支名
  skillFilter?: string; // @skill 语法指定的 skill 名
}

function parseSource(input: string): ParsedSource {
  // 1. 本地路径
  if (input.startsWith('/') || input.startsWith('./') || input.startsWith('../')) {
    return { type: 'local', url: path.resolve(input) };
  }

  // 2. 直接 SKILL.md URL（非 GitHub/GitLab）
  if (input.startsWith('http') && input.toLowerCase().endsWith('/skill.md')) {
    return { type: 'direct-url', url: input };
  }

  // 3. GitHub URL 带路径：github.com/owner/repo/tree/branch/path
  const ghTreePath = input.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (ghTreePath) {
    const [, owner, repo, ref, subpath] = ghTreePath;
    return { type: 'github', url: `https://github.com/${owner}/${repo}.git`, ref, subpath };
  }

  // 4. GitHub URL：github.com/owner/repo
  const ghRepo = input.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (ghRepo) {
    const [, owner, repo] = ghRepo;
    return {
      type: 'github',
      url: `https://github.com/${owner}/${repo!.replace(/\.git$/, '')}.git`,
    };
  }

  // 5. owner/repo@skill 简写
  const atSkill = input.match(/^([^/]+)\/([^/@]+)@(.+)$/);
  if (atSkill && !input.includes(':')) {
    const [, owner, repo, skillFilter] = atSkill;
    return { type: 'github', url: `https://github.com/${owner}/${repo}.git`, skillFilter };
  }

  // 6. owner/repo 简写
  const shorthand = input.match(/^([^/]+)\/([^/]+)(?:\/(.+))?$/);
  if (shorthand && !input.includes(':')) {
    const [, owner, repo, subpath] = shorthand;
    return { type: 'github', url: `https://github.com/${owner}/${repo}.git`, subpath };
  }

  // 7. 其他 HTTP URL → well-known 协议
  if (input.startsWith('http')) {
    return { type: 'well-known', url: input };
  }

  // 8. 兜底：当作 Git URL
  return { type: 'git', url: input };
}
```

---

### 11.3 从 GitHub 仓库获取 Skill 内容（不依赖 git clone）

CLI 原始流程是 `git clone --depth 1` 到临时目录再扫描文件。在你的软件中可以**完全跳过 clone**，用纯 HTTP API 实现：

**步骤 1：通过 Trees API 获取仓库文件结构**

```typescript
interface TreeEntry {
  path: string;
  type: 'tree' | 'blob';
  sha: string;
  size?: number;
}

async function fetchRepoTree(
  ownerRepo: string,
  token?: string
): Promise<{ sha: string; tree: TreeEntry[] } | null> {
  for (const branch of ['main', 'master']) {
    const url = `https://api.github.com/repos/${ownerRepo}/git/trees/${branch}?recursive=1`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'my-app',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (res.ok) return await res.json();
  }
  return null;
}
```

**步骤 2：从文件树中发现所有 Skill**

```typescript
function discoverSkillsFromTree(tree: TreeEntry[]): Array<{
  skillPath: string;       // "skills/react-best-practices"
  skillMdSha: string;      // blob SHA of SKILL.md
  folderSha: string;       // tree SHA（用于版本检测）
  files: TreeEntry[];      // 该 Skill 目录下的所有文件
}> {
  // 找到所有 SKILL.md 文件
  const skillMdEntries = tree.filter(
    e => e.type === 'blob' && e.path.endsWith('/SKILL.md')
  );

  return skillMdEntries.map(entry => {
    // 提取文件夹路径："skills/react-best-practices/SKILL.md" → "skills/react-best-practices"
    const folderPath = entry.path.replace(/\/SKILL\.md$/, '');

    // 找到对应的文件夹 tree entry（获取 folder SHA）
    const folderEntry = tree.find(e => e.type === 'tree' && e.path === folderPath);

    // 找到该目录下所有文件
    const files = tree.filter(
      e => e.type === 'blob' && e.path.startsWith(folderPath + '/')
    );

    return {
      skillPath: folderPath,
      skillMdSha: entry.sha,
      folderSha: folderEntry?.sha || '',
      files,
    };
  });
}
```

**步骤 3：通过 Blob API 下载 SKILL.md 内容**

```typescript
async function fetchBlobContent(
  ownerRepo: string,
  sha: string,
  token?: string
): Promise<string> {
  const url = `https://api.github.com/repos/${ownerRepo}/git/blobs/${sha}`;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'my-app',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  const data = await res.json();
  // GitHub Blob API 返回 base64 编码的内容
  return Buffer.from(data.content, 'base64').toString('utf-8');
}
```

**步骤 4：解析 SKILL.md 的 frontmatter**

SKILL.md 使用 YAML frontmatter，需要用 `gray-matter` 解析：

```typescript
import matter from 'gray-matter';

interface SkillMetadata {
  name: string;
  description: string;
  metadata?: Record<string, unknown>;
  rawContent: string;
}

function parseSkillMd(content: string): SkillMetadata | null {
  const { data } = matter(content);
  if (!data.name || !data.description) return null;
  if (typeof data.name !== 'string' || typeof data.description !== 'string') return null;

  // 跳过内部 Skill（除非明确需要）
  if (data.metadata?.internal === true) return null;

  return {
    name: data.name,
    description: data.description,
    metadata: data.metadata,
    rawContent: content,
  };
}
```

**完整示例：从仓库获取所有 Skill 信息**

```typescript
async function getAllSkillsFromRepo(ownerRepo: string, token?: string) {
  // 1. 获取文件树
  const treeData = await fetchRepoTree(ownerRepo, token);
  if (!treeData) throw new Error('无法获取仓库文件树');

  // 2. 发现所有 Skill
  const discovered = discoverSkillsFromTree(treeData.tree);

  // 3. 逐个下载并解析 SKILL.md
  const skills = [];
  for (const item of discovered) {
    const content = await fetchBlobContent(ownerRepo, item.skillMdSha, token);
    const parsed = parseSkillMd(content);
    if (parsed) {
      skills.push({
        ...parsed,
        source: ownerRepo,
        skillPath: item.skillPath,
        folderSha: item.folderSha,
        fileCount: item.files.length,
      });
    }
  }

  return skills;
}

// 使用示例
const skills = await getAllSkillsFromRepo('vercel-labs/agent-skills');
// 结果:
// [
//   { name: "vercel-react-best-practices", description: "...", folderSha: "079b06a1...", ... },
//   { name: "web-design-guidelines", description: "...", folderSha: "3116f3e6...", ... },
//   ...
// ]
```

---

### 11.4 安装 Skill 到本地 Agent 目录

CLI 的安装逻辑在 `installer.ts` 中，核心是**写文件到正确的目录**。以下是完整的目录规范。

**目录结构规范**

安装使用两层结构：
- **规范目录（Canonical）**：`.agents/skills/{skill-name}/` — 存放 Skill 文件的唯一真实副本
- **Agent 目录**：`.cursor/skills/{skill-name}/` — 指向规范目录的 symlink

```
项目级安装:
  {cwd}/.agents/skills/{skill-name}/SKILL.md     ← 规范目录（真实文件）
  {cwd}/.cursor/skills/{skill-name}/              ← symlink → ../../.agents/skills/{skill-name}
  {cwd}/.claude/skills/{skill-name}/              ← symlink → ../../.agents/skills/{skill-name}

全局安装:
  ~/.agents/skills/{skill-name}/SKILL.md          ← 规范目录（真实文件）
  ~/.cursor/skills/{skill-name}/                   ← symlink → ~/.agents/skills/{skill-name}
  ~/.claude/skills/{skill-name}/                   ← symlink → ~/.agents/skills/{skill-name}
```

**完整 Agent 目录配置表**（摘自源码 `agents.ts`，共 38 个 Agent）：

| Agent | 项目级 skillsDir | 全局 globalSkillsDir |
|---|---|---|
| Cursor | `.cursor/skills` | `~/.cursor/skills` |
| Claude Code | `.claude/skills` | `~/.claude/skills` |
| Codex | `.agents/skills` | `~/.codex/skills` |
| OpenCode | `.agents/skills` | `~/.config/opencode/skills` |
| Windsurf | `.windsurf/skills` | `~/.codeium/windsurf/skills` |
| GitHub Copilot | `.agents/skills` | `~/.copilot/skills` |
| Gemini CLI | `.agents/skills` | `~/.gemini/skills` |
| Cline | `.cline/skills` | `~/.cline/skills` |
| Roo Code | `.roo/skills` | `~/.roo/skills` |
| Trae | `.trae/skills` | `~/.trae/skills` |
| Continue | `.continue/skills` | `~/.continue/skills` |
| Goose | `.goose/skills` | `~/.config/goose/skills` |
| Amp | `.agents/skills` | `~/.config/agents/skills` |
| Junie | `.junie/skills` | `~/.junie/skills` |
| Kilo Code | `.kilocode/skills` | `~/.kilocode/skills` |

> 注：`skillsDir` 为 `.agents/skills` 的 Agent 被称为"通用 Agent"（Universal Agent），它们共享同一目录，无需创建 symlink。

**Skill 名称安全处理**

源码中 `sanitizeName` 函数确保目录名不会导致路径遍历攻击：

```typescript
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, '-')       // 非法字符替换为连字符
    .replace(/^[.\-]+|[.\-]+$/g, '')      // 去除首尾的点和连字符
    .substring(0, 255) || 'unnamed-skill'; // 限制长度
}
```

**安装实现**（简化版）：

```typescript
import { mkdir, writeFile, symlink, rm, lstat } from 'fs/promises';
import { join, dirname, relative, resolve } from 'path';
import { homedir, platform } from 'os';

async function installSkill(
  skillName: string,
  skillContent: string,               // SKILL.md 的完整内容
  extraFiles: Map<string, string>,     // 附属文件 { "rules/xxx.md": "content" }
  agents: string[],                    // ["cursor", "claude-code"]
  scope: 'project' | 'global'
): Promise<void> {
  const safeName = sanitizeName(skillName);
  const home = homedir();
  const cwd = process.cwd();

  // 1. 写入规范目录
  const canonicalBase = scope === 'global'
    ? join(home, '.agents', 'skills')
    : join(cwd, '.agents', 'skills');
  const canonicalDir = join(canonicalBase, safeName);

  await rm(canonicalDir, { recursive: true, force: true }).catch(() => {});
  await mkdir(canonicalDir, { recursive: true });
  await writeFile(join(canonicalDir, 'SKILL.md'), skillContent, 'utf-8');

  // 写入附属文件
  for (const [filePath, content] of extraFiles) {
    const fullPath = join(canonicalDir, filePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  }

  // 2. 为每个 Agent 创建 symlink（或 copy）
  const AGENT_DIRS: Record<string, { project: string; global: string }> = {
    'cursor':        { project: '.cursor/skills',     global: join(home, '.cursor/skills') },
    'claude-code':   { project: '.claude/skills',     global: join(home, '.claude/skills') },
    'windsurf':      { project: '.windsurf/skills',   global: join(home, '.codeium/windsurf/skills') },
    'cline':         { project: '.cline/skills',      global: join(home, '.cline/skills') },
    'roo':           { project: '.roo/skills',        global: join(home, '.roo/skills') },
    'trae':          { project: '.trae/skills',       global: join(home, '.trae/skills') },
    // ... 其他 Agent（完整列表见上方表格）
  };

  // 通用 Agent（skillsDir = .agents/skills）无需创建 symlink，已在规范目录中
  const UNIVERSAL_AGENTS = ['codex', 'opencode', 'gemini-cli', 'github-copilot', 'amp', 'replit'];

  for (const agent of agents) {
    if (UNIVERSAL_AGENTS.includes(agent)) continue; // 已经在 .agents/skills 中

    const dirs = AGENT_DIRS[agent];
    if (!dirs) continue;

    const agentBase = scope === 'global' ? dirs.global : join(cwd, dirs.project);
    const agentDir = join(agentBase, safeName);

    // 如果 symlink 目标和源相同（解析后），跳过
    if (resolve(agentDir) === resolve(canonicalDir)) continue;

    // 删除旧的（无论是 symlink 还是目录）
    try { await rm(agentDir, { recursive: true, force: true }); } catch {}

    // 创建父目录
    await mkdir(dirname(agentDir), { recursive: true });

    // 创建相对路径 symlink（Windows 用 junction）
    try {
      const relativePath = relative(dirname(agentDir), canonicalDir);
      const symlinkType = platform() === 'win32' ? 'junction' : undefined;
      await symlink(relativePath, agentDir, symlinkType);
    } catch {
      // symlink 失败，回退为直接复制
      await mkdir(agentDir, { recursive: true });
      await writeFile(join(agentDir, 'SKILL.md'), skillContent, 'utf-8');
      for (const [filePath, content] of extraFiles) {
        const fullPath = join(agentDir, filePath);
        await mkdir(dirname(fullPath), { recursive: true });
        await writeFile(fullPath, content, 'utf-8');
      }
    }
  }
}
```

**安装时排除的文件**（源码规则）：

```
排除的文件: README.md, metadata.json
排除以 _ 开头的文件: _template.md, _sections.md
排除的目录: .git
```

---

### 11.5 检测 Skill 是否有新版本

**原理**：对比安装时记录的 `folderSha`（GitHub tree SHA）与最新的 tree SHA。

```typescript
async function checkSkillUpdate(
  ownerRepo: string,       // "vercel-labs/agent-skills"
  skillPath: string,       // "skills/react-best-practices"
  savedFolderSha: string,  // 安装时记录的 SHA
  token?: string
): Promise<{ hasUpdate: boolean; latestSha: string | null }> {
  const treeData = await fetchRepoTree(ownerRepo, token);
  if (!treeData) return { hasUpdate: false, latestSha: null };

  const folderEntry = treeData.tree.find(
    e => e.type === 'tree' && e.path === skillPath
  );

  const latestSha = folderEntry?.sha || null;
  return {
    hasUpdate: !!latestSha && latestSha !== savedFolderSha,
    latestSha,
  };
}

// 批量检测（同仓库只需一次 API 调用）
async function batchCheckUpdates(
  skills: Array<{ ownerRepo: string; skillPath: string; savedSha: string }>,
  token?: string
): Promise<Map<string, { hasUpdate: boolean; latestSha: string | null }>> {
  const results = new Map();

  // 按仓库分组，每个仓库只调用一次 Trees API
  const byRepo = new Map<string, typeof skills>();
  for (const skill of skills) {
    const group = byRepo.get(skill.ownerRepo) || [];
    group.push(skill);
    byRepo.set(skill.ownerRepo, group);
  }

  for (const [ownerRepo, group] of byRepo) {
    const treeData = await fetchRepoTree(ownerRepo, token);
    if (!treeData) continue;

    for (const skill of group) {
      const folderEntry = treeData.tree.find(
        e => e.type === 'tree' && e.path === skill.skillPath
      );
      const latestSha = folderEntry?.sha || null;
      const key = `${skill.ownerRepo}/${skill.skillPath}`;
      results.set(key, {
        hasUpdate: !!latestSha && latestSha !== skill.savedSha,
        latestSha,
      });
    }
  }

  return results;
}
```

**关键点**：同一仓库下的多个 Skill 共享一次 Trees API 调用结果，这是 CLI 源码中的核心优化策略。

---

### 11.6 从 Well-Known 协议获取 Skill

对于自建 Skill 源（非 GitHub），使用 well-known 协议。

```typescript
interface WellKnownSkillEntry {
  name: string;
  description: string;
  files: string[];
}

async function fetchWellKnownSkills(baseUrl: string): Promise<WellKnownSkillEntry[]> {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  const indexUrl = `${cleanUrl}/.well-known/skills/index.json`;
  const res = await fetch(indexUrl);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.skills || !Array.isArray(data.skills)) return [];

  return data.skills.filter((entry: any) => {
    if (!entry.name || !entry.description || !Array.isArray(entry.files)) return false;
    return entry.files.some((f: string) => f.toLowerCase() === 'skill.md');
  });
}

async function fetchWellKnownSkillContent(
  baseUrl: string,
  skillName: string,
  files: string[]
): Promise<Map<string, string>> {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  const skillBaseUrl = `${cleanUrl}/.well-known/skills/${skillName}`;
  const result = new Map<string, string>();

  await Promise.all(
    files.map(async (filePath) => {
      try {
        const res = await fetch(`${skillBaseUrl}/${filePath}`);
        if (res.ok) result.set(filePath, await res.text());
      } catch { /* 跳过失败的文件 */ }
    })
  );

  return result;
}
```

---

### 11.7 列出本地已安装的 Skill

扫描规范目录和各 Agent 目录，查找包含 `SKILL.md` 的子目录。

```typescript
import { readdir, stat, readFile } from 'fs/promises';
import matter from 'gray-matter';

interface InstalledSkill {
  name: string;
  description: string;
  dirName: string;
  path: string;
  scope: 'project' | 'global';
}

async function listInstalledSkills(
  scope: 'project' | 'global'
): Promise<InstalledSkill[]> {
  const home = homedir();
  const cwd = process.cwd();
  const skills: InstalledSkill[] = [];

  const baseDir = scope === 'global'
    ? join(home, '.agents', 'skills')
    : join(cwd, '.agents', 'skills');

  try {
    const entries = await readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillMdPath = join(baseDir, entry.name, 'SKILL.md');
      try {
        await stat(skillMdPath);
        const content = await readFile(skillMdPath, 'utf-8');
        const { data } = matter(content);
        if (data.name && data.description) {
          skills.push({
            name: data.name,
            description: data.description,
            dirName: entry.name,
            path: join(baseDir, entry.name),
            scope,
          });
        }
      } catch { /* SKILL.md 不存在，跳过 */ }
    }
  } catch { /* 目录不存在 */ }

  return skills;
}
```

---

### 11.8 Git Clone 方式（可选，用于私有仓库）

当无法使用 API（如私有仓库或非 GitHub/GitLab 源），可回退到 CLI 原始的 clone 方式。CLI 使用 `simple-git` 库：

```typescript
import simpleGit from 'simple-git';
import { mkdtemp, rm, readdir, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const CLONE_TIMEOUT = 60000; // 60秒超时

async function cloneAndDiscover(
  gitUrl: string,
  ref?: string,
  subpath?: string
): Promise<Array<{ name: string; path: string; content: string }>> {
  // 1. 克隆到临时目录（浅克隆）
  const tempDir = await mkdtemp(join(tmpdir(), 'skills-'));
  const git = simpleGit({ timeout: { block: CLONE_TIMEOUT } });
  const cloneOpts = ref ? ['--depth', '1', '--branch', ref] : ['--depth', '1'];

  try {
    await git.clone(gitUrl, tempDir, cloneOpts);

    // 2. 确定扫描的起始目录
    const scanDir = subpath ? join(tempDir, subpath) : tempDir;

    // 3. 递归查找所有 SKILL.md 文件
    const skills = await findSkillMdFiles(scanDir);
    return skills;
  } finally {
    // 4. 清理临时目录
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function findSkillMdFiles(
  dir: string
): Promise<Array<{ name: string; path: string; content: string }>> {
  const results: Array<{ name: string; path: string; content: string }> = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name === 'SKILL.md') {
        const content = await readFile(fullPath, 'utf-8');
        results.push({
          name: entry.name,
          path: currentDir,  // SKILL.md 所在的文件夹路径
          content,
        });
      }
    }
  }

  await walk(dir);
  return results;
}
```

---

### 11.9 私有仓库检测

在决定使用 API 还是 Clone 方式前，可先检测仓库是否为私有：

```typescript
async function isRepoPrivate(owner: string, repo: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok) return null; // 无法确定
    const data = await res.json();
    return data.private === true;
  } catch {
    return null;
  }
}

// 使用策略：
// - 公开仓库 → Trees API + Blob API（快速、无需 clone）
// - 私有仓库 → git clone（需要本地 SSH key 或 Token）
// - 无法确定 → 先尝试 API，失败后回退到 clone
```

---

### 11.10 完整工作流总结

```
┌──────────────────────────────────────────────────────────────────┐
│                       你的软件                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  搜索    ─── fetch("skills.sh/api/search?q=xx") ──→ JSON        │
│                                                                  │
│  发现    ─── GitHub Trees API ──→ 仓库内所有 SKILL.md            │
│                                                                  │
│  下载    ─── GitHub Blob API ──→ SKILL.md 原始内容               │
│          ─── gray-matter 解析 ──→ name, description, content     │
│                                                                  │
│  安装    ─── 写入 .agents/skills/{name}/SKILL.md                 │
│          ─── 为各 Agent 创建 symlink                              │
│                                                                  │
│  更新检测 ─── GitHub Trees API ──→ 最新 folder SHA               │
│           ─── 对比存储的 SHA ──→ 有/无更新                       │
│                                                                  │
│  更新执行 ─── 重新下载 + 覆盖安装                                │
│                                                                  │
│  私有仓库 ─── git clone --depth 1 ──→ 临时目录 ──→ 扫描 SKILL.md│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

API 调用量优化：
  - 同一仓库只需 1 次 Trees API = 发现 + 版本检测 + 文件列表
  - 每个 SKILL.md 需 1 次 Blob API 获取内容
  - 搜索接口无需 Token，GitHub API 建议带 Token（5000次/小时 vs 60次/小时）
```

---

### 11.11 依赖总结

| 功能 | 需要的依赖 | 说明 |
|---|---|---|
| 搜索 | 无（原生 fetch） | 调用 skills.sh API |
| frontmatter 解析 | `gray-matter` | 解析 SKILL.md 的 YAML 头部 |
| 文件操作 | Node.js `fs/promises` | 写文件、创建 symlink |
| Git clone（可选） | `simple-git` | 仅当需要支持私有仓库或非 GitHub 源时 |
| XDG 路径（可选） | `xdg-basedir` | 获取 `~/.config` 等标准路径，部分 Agent 需要 |
