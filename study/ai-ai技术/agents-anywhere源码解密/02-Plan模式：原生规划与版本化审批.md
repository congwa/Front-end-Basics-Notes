# Plan 模式解密：一份计划怎样被写出、存好、批准，再交给 AI 执行

假设你在手机上对 AA 说：“先想好怎么修复登录问题，给我看过以后再动手。”

AI 开始写计划。你读完说：“第二步改一下。”AI 重新写了一份。你再点“同意并执行”，工作电脑上的 AI 才开始实施。

这篇文章跟着这件事走完一遍，重点看每一步的数据去了哪里，以及点击按钮后，程序具体如何继续。

AA 是 Agents Anywhere，连接手机、网页、桌面和工作电脑上的 AI 程序。它连接的 Codex、Claude、DSH，下面统称“原生程序”。原生程序负责实际与模型交流和执行工具，AA 负责把跨设备流程接起来。

先读[审批架构](01-审批架构：从LangGraph到Codex再到AA.md)，可以更容易理解原生等待怎样恢复。另一篇讲[目标自动续跑](03-目标模式：持久状态与自动续跑.md)。

## 1. 先把一份计划的四个阶段分开

| 阶段 | 发生什么 | 能不能批准 |
| --- | --- | --- |
| 写草稿 | AI 一段一段输出，正文还会变 | 不能 |
| 交终稿 | 一份完整正文已经固定并保存 | 满足其他条件后可以 |
| 等审阅 | 用户可以同意、提修改意见、暂不执行 | 只处理当前有效版本 |
| 实施 | 决定已传给原生程序，开始做事 | 后续工具仍可能需要权限审批 |

计划正文就像一张施工图。批准时必须知道你看的是哪张图，不能在你点按钮后悄悄换成另一张。

还要区分“进入计划模式”和“交出计划”。前者是让原生程序采用规划方式工作；后者才是产生一份可以审阅的文档。

## 2. 第一步：手机输入 /plan，任务还没有直接交给模型

已有会话中，只输入 `/plan`，AA 请求原生程序进入规划，不会发送一个空任务。

输入 `/plan 修复登录问题`，AA 会识别规划意图，先安排原生规划条件，再提交任务。新会话则带着这个意图创建，而不是先普通运行、再补切模式。

这个顺序很重要：如果先让普通任务启动，等 AI 已经改文件以后才切计划模式，就失去了“先审后做”的意义。

手机发出的规划操作带 `operationId`，也就是“这次操作的编号”。网络重试时沿用这个编号，服务器就能认出是同一次操作。

```json
{
  "command": "submit_task",
  "operationId": "op-1",
  "content": "修复登录问题",
  "attachments": []
}
```

已有会话使用 `/api/v2/sessions/{id}/planning` 入口。Server 检查会话归属和控制条件，再把命令交给工作电脑上的 Connector。

## 3. Server 先记下操作，再把它送出去

Server 的 PlanningService 先整理请求，计算一份内容指纹，然后调用 `reserve_planning_operation()`。

指纹是对请求内容计算出来的摘要，用来检查“同一个编号是不是被拿去做了另一件事”。

PostgreSQL 的 `planning_operations` 表主要有：

| 列 | 作用 |
| --- | --- |
| session_id | 哪个会话 |
| operation_id | 哪次操作 |
| fingerprint | 请求内容的指纹 |
| payload | 操作回执，保存为 JSON 字符串 |

`session_id + operation_id` 是联合主键，也就是两列一起确定唯一一行。

预留时，数据库事务先锁住会话行，检查是否已有同编号操作：

```text
已有同编号、同指纹 → 返回已有回执，不重发
已有同编号、不同指纹 → 拒绝，编号被错误复用
没有 → 插入初始回执，再提交事务
```

初始回执会说明结果尚不确定，不能提前写成成功。随后 Server 才通过 `session.planning.execute` RPC 发送命令。RPC 就是“请另一处程序执行一个操作，并返回结果”。

所以，网络中断后，Server 至少知道：“op-1 已受理，不能当成从未发生过。”

来源：[Server 用例](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/server/agent_server/services/planning/service.py)、[数据库预留和回执](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/server/agent_server/infra/repositories/planning.py)。

## 4. Connector 收到命令，也先写一份本地记录

工作电脑上的 Connector 有自己的规划服务。它还要检查原生能力、操作编号、是否已有正在处理的操作等。

它使用本地 SQLite 文件 `planning.sqlite3`，主要包含三张表：

| 表 | 唯一身份 | 保存什么 |
| --- | --- | --- |
| planning_operation | session_id + operation_id | 请求指纹和操作结果 |
| planning_state | session_id | 当前规划状态 |
| planning_document | session_id + plan_id + revision | 每个正文版本和发布标记 |

为什么 Server 记过，Connector 还要记？因为它们可能分别重启，网络也可能只断在中间。Server 知道自己发过命令，不等于工作电脑已经完成；Connector 的记录能够说明自己处理到了哪一步。

Connector 在调用原生程序前，先保存准备派发的操作。然后释放保护本地状态的短锁，再执行原生调用。它不会把一把锁一直拿到用户审阅完成，否则原生事件回流也可能被堵住。

接下来，各适配器才调用 Codex、Claude 或 DSH 的原生规划接口。AA 不在这里另造一个模型循环。

来源：[Connector 编排](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/planning/application/service.py)、[SQLite 写入](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/planning/infrastructure/store.py)。

## 5. 写草稿时，手机看到的内容从哪里来

原生程序开始输出计划。Connector 的适配器把不同程序的事件，转换成统一的“草稿观察”。规划服务更新内存中的 draft，再把当前状态传给 Server，最后更新手机。

```text
原生正文增量
  → 适配器识别为计划草稿
  → Connector 更新 draft
  → 合并短时间内的多次更新
  → 发状态变化
  → Server 分发给各端
```

草稿有自己的编号、文本和递增序号。界面看到“还在生成”，就不应该提供批准。

这里不是每吐出一个字就向 PostgreSQL 插入一版历史正文。草稿走实时更新，终稿走可靠保存，二者承担不同任务。

最终的完整正文也不是“拿最后一次收到的草稿凑一下”。适配器以原生完成事件提供的完整内容为准，替换草稿，避免网络增量遗漏让批准内容残缺。

## 6. 交终稿时，怎样确定“这是同一份文字”

Connector 收到完整计划后，领域对象的 `finalize()` 做这些事：

1. 检查正文非空，UTF-8 字节不超过 2 MiB。
2. 计算 SHA-256 摘要。
3. 确定这份逻辑计划的 planId。
4. 给它分配新的 revision，也就是版本号。
5. 建立完整正文记录。
6. 清除草稿，建立对应审阅。

摘要可以理解成内容的指纹。文字哪怕只改了一个换行，字节不同，指纹也可能不同。AA 不先 trim 或改换行再计算。

正文记录示意：

```json
{
  "planId": "plan-6",
  "revision": 1,
  "contentHash": "sha256:<正文指纹>",
  "markdown": "# 登录修复计划\n\n1. 排查会话失效原因……",
  "contentState": "ready"
}
```

对应审阅：

```json
{
  "reviewId": "review-6-1",
  "planId": "plan-6",
  "planRevision": 1,
  "contentHash": "sha256:<同一正文指纹>",
  "status": "open",
  "actions": ["approve_and_execute", "request_revision", "dismiss_review"]
}
```

这时审阅已经在本地建立，但**还要完成 Server 持久保存，才能真正批准**。[正文与审阅生成](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/planning/domain/session.py)。

## 7. 先写 SQLite，再交 PostgreSQL：一份正文的两次落盘

Connector 的 `PlanningStore.save()` 把正文插入 `planning_document`，同时保存当前状态。正文有 `published` 列，开始为 0，表示尚未确认送达 Server。

```text
planning_document
session_id = session-a
plan_id    = plan-6
revision   = 1
payload    = 完整正文 JSON 字符串
published  = 0
```

同一正文身份重复保存时，不覆盖已有本地文档。

接着，发布程序查询 published=0 的文档，逐份上传。这里使用需要等待结果的 ingest 调用，而不只是发一条通知就走。

Server 收到后先验证：这是当前 Connector 对应 Runtime 的会话吗？数据能通过模型校验吗？然后调用 `save_planning()`。

PostgreSQL 事务内：

```text
锁住 sessions 中的会话行
  → 查 plan_documents 有没有 plan-6 的第 1 版
  → 没有：插入正文
  → 有且 hash 相同：接受重复上传
  → 有但 hash 不同：拒绝，不允许改写旧版本
  → 按规则保存当前规划状态
  → 提交
```

事务完成后，Server 的持久确认才一路返回 Connector。Connector 再把本地 published 设为 1，并把这个文档身份加入已发布集合。

如果在“数据库保存成功、确认返回前”断网，本地仍可能是 0。下次再上传同一版，Server 能识别重复；不能因此生成一个不同的“第 1 版”。

```text
SQLite published=0
  → 上传
  → PostgreSQL 保存
  → Server 回持久确认
  → SQLite published=1
  → 可以通过“已保存”检查
```

来源：[发布循环](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/planning/application/service.py)、[Server 接收验证](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/server/agent_server/services/connector_notifications.py)、[持久上传入口](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/server/runtime_host.py)。

## 8. PostgreSQL 的四张表分别怎么用

| 表 | 主键 | 其他主要列 | 谁会读取 |
| --- | --- | --- | --- |
| session_planning | session_id | payload TEXT | 当前规划状态和离线回退读取 |
| plan_documents | session_id + plan_id + revision | content_hash、payload、created_at | 计划阅读器、历史、Markdown 下载 |
| planning_operations | session_id + operation_id | fingerprint、payload | 操作重试、结果查询 |
| planning_creations | connector_id + runtime_id + operation_id | fingerprint、payload | 新会话创建去重 |

这些 payload 实际是 TEXT，里面装应用序列化的 JSON，不是 JSONB。

读取某一版时，服务器按下面三个条件找文档：

```sql
SELECT payload
FROM plan_documents
WHERE session_id = :session
  AND plan_id = :plan
  AND revision = :revision;
```

这份历史正文不会因为 Connector 离线、原生临时文件清理或产生新草稿而消失。

当前状态与历史正文分开保存，原因也很简单：“现在有没有待审计划”会变，“你上周批准的第 1 版正文”应该保留。

来源：[数据库迁移](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/server/migrations/versions/v2_46.py)、[文档读写](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/server/agent_server/infra/repositories/planning.py)。

## 9. 终稿怎样变成屏幕上的计划卡片

前面完成的是保存。屏幕上的卡片还需要走一次“数据到组件”的过程。

Connector 发布完整规划状态，Server 将它映射为 `planning.state.updated`。Web 会话页收到事件后，调用 `planning.ingest()`；Desktop 的规划代码也有对应处理。

```text
原生终稿
  → Connector 固定正文并保存
  → Server 保存、发布 planning.state.updated
  → 前端 ingest 接收状态
  → 按 planId + revision 合并文档
  → 聊天时间线渲染计划卡片
```

前端同时维护两份东西：一份是“当前规划状态”，另一份是“已经拿到的文档版本列表”。后者按 `planId:revision` 合并，不能每收到一次状态更新就重复插一张卡片。

同一控制实例里，较旧的状态版本不能覆盖新状态。切换会话或账号后，旧请求晚到的结果也不能跑到新会话中。

重新打开会话时，前端分别读取 `/planning` 和 `/plans`：前者用于校准当前审阅与执行状态，后者恢复历史文档。所以你退出再回来，不需要让模型重新写一份计划才有卡片。

[前端状态接收与文档合并](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/features/planning/use-session-planning.ts)、[会话页接收事件](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/components/session-detail.tsx)。

## 10. “弹出卡片”实际分成正文卡片和确认面板

你看到计划出现时，屏幕上有两个分工不同的地方：

```text
聊天时间线
┌────────────────────────────┐
│ 登录修复计划 · 第 1 版        │
│ 计划正文预览……              │
│ [展开全文]       [打开计划]  │
└────────────────────────────┘

原来输入框的位置
┌────────────────────────────┐
│ 是否执行这个计划？第 1 版    │
│ [同意并执行] [修改计划]      │
│ [暂不执行]                  │
└────────────────────────────┘
```

这是布局示意，不表示按钮在各个屏幕上的间距完全相同。

**正文卡片负责阅读，确认面板负责决定。** 当前实现不会在终稿出现时自动打开一个全文模态弹窗。点击“打开计划”，才进入阅读器。

草稿也有卡片，但标题是正在生成或已中断，正文跟着增量变化，不提供终稿阅读动作或批准入口。生成动画会根据卡片是否可见、页面是否在前台等条件暂停，不要求离屏卡片一直动。

终稿卡片显示标题、版本、状态和正文预览。Web 中较长预览会折叠，可以就地展开；预览为避免重复标题，可能隐藏与卡片标题相同的首行。它只是显示处理，保存和交给模型的完整 Markdown 不因此改变。

[卡片与确认面板组件](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/components/session/planning-panel.tsx)。

## 11. 卡片为什么出现在这个位置，旧版本又去了哪里

计划卡片不是永远钉在聊天最底部。前端按计划定稿时间，把它放到“定稿以后第一条用户消息”之前。

```text
你的规划任务
AI 的规划过程
计划第 1 版卡片
你批准后产生的实施任务
AI 的修改、命令和结果
```

还在等审阅时，没有后续用户任务，计划通常留在末尾。批准并出现后续实施内容后，它就在实施内容上方，方便回看“这次到底按什么做”。

同一 planId 有多个版本时，只有最新版本保留完整卡片；旧版本缩成一行，说明已被新版本替代，仍可打开历史阅读。

原生程序有时还会把计划正文作为 system 消息回显。前端会过滤与计划正文匹配的这类回显，减少“同一份计划出现一张卡片和一大段重复文字”。不是把所有普通回答都过滤掉。

[卡片放置、版本折叠与重复正文过滤](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/features/planning/timeline.ts)。

## 12. 确认面板什么时候出现，为什么有时按钮点不了

前端先找一个有效的“审阅目标”，不是只要有 Markdown 就展示批准按钮。

它检查当前 proposal 与 review 的 planId、版本和内容指纹能不能对上，审阅是否 open，以及会话和规划能力是否允许相应操作。

```text
有文档但没有当前审阅 → 可以读，不直接显示可批准面板
文档和审阅版本不一致 → 不能拿这份文档批准另一版
有效的 open 审阅 → 显示确认面板
原生状态待核对 → 相应动作禁用，先刷新
```

Web 会用确认面板暂时代替普通输入框。普通输入组件是隐藏，不是直接删除；用户原先写的聊天草稿和已有附件因此不必丢掉。审阅结束后恢复普通输入。

点击“修改计划”先展开意见输入框，此时还没有发修改请求。意见非空后点击“提交修改意见”，才调用 request_revision。取消只是收起这次意见编辑，不等于暂不执行整个计划。

新版本或新控制实例到来时，表单用 sessionId、epoch、reviewId、文档版本和 hash 组成身份，重新建立对应表单。旧版本的意见输入不能不加区分地拿去批准新版本。

Android、iOS 也有输入区确认组件；屏幕窄时按钮会换布局，完整阅读进入移动端阅读页。Web/Desktop 则可以在聊天旁打开全文阅读器；Web 阅读器按会话和文档版本记住本次页面中的滚动位置，提供复制和 Markdown 下载。

[Web 审阅目标检查](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/components/session/planning-panel.tsx)、[Desktop 对应组件](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/desktop-workbench/renderer/src/components/session/planning-panel.tsx)、[Android 面板](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/android/app/src/main/java/com/agentsanywhere/app/ui/screens/sessiondetail/SessionPlanningPanel.kt)、[iOS 面板](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/ios/Agents%20Anywhere/Agents%20Anywhere/Views/Chat/SessionPlanningPanel.swift)。

## 13. 按下“同意并执行”的这一刻，前端先做什么

假设你正在看第 1 版，点击同意：

1. 表单检查目前不忙、状态有效、操作被允许。
2. 本地记住正在提交 approve_and_execute，显示对应按钮的忙碌状态，禁用重复提交。
3. 调用规划 hook 的 execute，再用 activeOperation 防止同一页面同时发两次操作。
4. 为这次请求生成 operationId，带上 reviewId、planId、planRevision、contentHash 和 epoch。
5. POST 到会话的 `/planning`。

收到结果后，前端不会只看 HTTP 状态。它先接收响应中的规划 state，检查业务 ok，显示相应错误，并主动刷新一次当前规划。

等待期间也可能先收到 Server 推来的 responding 或 approved 状态。面板会跟随当前状态变化，不要求一直等最初那个 HTTP 回执才更新。

如果你在请求尚未返回时切换到另一个会话，旧会话回执不会改掉新会话的卡片。

本地按钮禁用只是减少误触。另一台手机仍可能同时操作，所以真正的并发检查还在 Server、Connector 和原生程序里，接下来就是这条链路。

[按钮处理](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/components/session/planning-panel.tsx)、[请求生成和回执处理](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/features/planning/use-session-planning.ts)。

## 14. 用户点“同意并执行”，先检查哪几件事

手机把当前阅读版本的身份带回来：

```json
{
  "command": "approve_and_execute",
  "operationId": "op-2",
  "reviewId": "review-6-1",
  "planId": "plan-6",
  "planRevision": 1,
  "contentHash": "sha256:<正文指纹>",
  "epoch": "computer-process-a",
  "expectedRevision": 12
}
```

epoch 是当前控制实例的标记。工作电脑上的规划服务重启以后会换一个标记，用来识别旧页面带回来的操作。

这次仍先经过 Server 的操作预留，再到 Connector。

Connector 在会话短锁内检查：

```text
当前审阅还 open 吗？
当前状态是刚校准过的吗？
reviewId、planId、planRevision、contentHash 都匹配吗？
epoch 还是同一个吗？
若传了 expectedRevision，整份状态版本也匹配吗？
正文已经得到 Server 的持久确认吗？
```

通过后，review 改为 responding，记录正在处理的操作，把状态和初始操作回执写进 SQLite。然后释放锁，才去调用原生程序。

两台手机同时批准时，后到的一台会看到“正在处理”或审阅已不再 open，不能再次消费同一审阅。

这里的编号并非装饰，它们让“我同意”具体指向“这台控制实例里，这份计划的这一版”。[请求检查](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/server/agent_server/core/planning/models.py)、[本地检查与派发](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/planning/application/service.py)。

## 15. Claude：把决定放回正在等答案的 Future

Claude 原生规划可以在 ExitPlanMode 等待决定。AA 适配器在 Connector 中保留这个交互的引用。

批准时不是从 PostgreSQL 读正文后直接说“执行吧”，而是：

```text
按 noticeId 找原生交互 Future
  → Future 必须仍存在且尚未结束
  → 再读原生计划正文
  → 与用户审阅的 hash 比较
  → 一致才构造批准决定
  → 交回原生交互等待
  → 原生继续执行
```

如果用户在电脑上改过计划文件，hash 不同，AA 会保存新观察到的版本，并拒绝用旧版本批准。

批准决定还会恢复用户之前明确选择的执行权限。批准方案不等于顺便提升所有工具权限。

这与审批篇里的 LangGraph 有明显区别：这里依赖一个还活着的原生回调，不是靠 PostgreSQL 恢复整段 Claude 执行现场。[Claude 适配器](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/runtimes/claude/planning.py)。

## 16. DSH：回应原生问题，再等下一步生效

DSH 原生 Plan 插件把计划审阅表达为一个待答问题。AA 先查询当前 notices，确认对应问题还 open、正文 hash 仍相同。

然后按原生问题编号和选项编号回答：

```json
{
  "answers": {
    "<questionId>": {"optionIds": ["<approveOptionId>"]}
  }
}
```

调用走原有的 `respond_interaction()`。这才把决定交回 DSH 原生等待。原生接受决定后，下一步才退出规划，所以 AA 可以先记录“已接受、等待生效”，再根据后续事件确认实施。

修改计划用问题的自定义文本传修改意见。暂不执行在当前适配中使用原生回合取消，结束等待，避免取消审阅变成工具错误后又多跑一步模型。

[DSH 适配器](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/runtimes/dsh/planning.py)。

## 17. Codex：这条路径没有同样的“原生整份计划待答”

Codex 的计划正文来自原生 Plan item；执行步骤进度则是另一类数据。

AA 在这里提供整份计划的确认。批准时，适配器先读原生最新会话内容，确认当前有效计划与被审阅的 hash 一致；如果已有更新的用户回合，旧审阅不能照常继续。

通过后：

```text
把协作模式切到 normal
  → 取用户批准的完整 Markdown
  → 将它作为明确的实施任务提交给 Codex
  → 通过原来的回合启动通道执行
```

用户提出修改意见时，保留 plan 模式，提交修改意见。暂不执行则不提交实施任务。

外部 Codex App 持有线程时，仍尊重现有 IPC 所有权。不能因为某条控制路径不可用，就偷偷换另一个写入者抢占线程。

所以 Plan 确实建立在“先等有效决定，再继续”的审批思想上，但三家继续的办法不同：Claude 回原生 Future，DSH 回原生问题，Codex 由 AA 确认后启动实施任务。[Codex 适配器](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/runtimes/codex/planning.py)。

## 18. 执行整份计划，不是 AA 把每个编号拆成独立任务

这里的“执行计划”容易让人以为 AA 会做下面的事：读 Markdown 第一步，执行完再读取第二步，自动为每一步创建一个任务。

当前这条统一 Plan 链路不是这样运作。它把经过批准的完整正文交给原生程序，或批准原生正在等待的计划。之后由原生模型和工具循环推进工作。

以 Codex 为例，AA 组装的实施输入是：

```text
PLEASE IMPLEMENT THIS PLAN:

<用户批准的完整 Markdown>
```

然后复用原有的 `runtime.start_turn()`，把 operationId 作为 client_message_id。真正开始的是一轮普通原生执行，不是只在数据库中把“计划状态”改成运行中。

```text
批准检查通过
  → 原生模式切换成功
  → start_turn(完整计划正文)
  → Codex 收到实施任务
  → 模型选择工具
  → 工具修改文件、运行命令
  → 结果回到模型，继续后面的工作
```

Claude、DSH 则沿前面介绍的原生等待继续，不需要都另发一条同样的实施消息。两种方式都必须保留同一个核心约束：实际继续工作的内容，要对应用户批准的那份正文。

[公共回合提交](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/planning/infrastructure/submission.py)、[Codex 实施正文和模式切换](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/runtimes/codex/planning.py)。

## 19. 怎样知道已经开始实施，而不只是“批准成功”

AA 分开保存 review 和 execution。它们可以是：

| review | execution | 说明 |
| --- | --- | --- |
| approved | accepted | 方案已同意，原生已接受继续请求 |
| approved | started | 已观察到实施开始，或回合启动已返回明确身份 |
| approved | rejected | 方案已同意，但实施启动被明确拒绝 |
| unknown | unknown | 决定或启动结果尚无法确认 |

公共回合提交拿到 turnId 时，可以返回 started；成功但未拿到明确回合身份时，先返回 accepted。Claude 和 DSH 的批准也可能先停在 accepted，等待原生后续事件。

后续怎样变成 started？适配器把原生事件转换成执行观察。例如 Codex 的回合开始事件、Claude 离开规划后收到的相应内容增量，会进入规划服务。服务把与当前批准操作关联的 execution 从 accepted 更新为 started，再保存和发布状态。

它还处理一种快回执竞争：原生已经发出了开始事件，HTTP 操作结果才回来。收尾不能把已观察到的 started 倒退为 accepted。

屏幕上，当前版本卡片的状态也根据这两份事实计算。需要特别注意：**这里卡片显示的“已执行”，对应 execution=started，意思是已经启动实施，不是所有修改和验证都完成。** 是否做完，要继续看原生回答、工具结果和验证证据。

[执行开始观察与收尾](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/planning/application/service.py)、[卡片状态计算](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/features/planning/timeline.ts)。

## 20. 执行时的步骤、工具结果和失败，分别出现在哪里

实施开始后，聊天恢复显示原生回答、工具调用和工具结果。它们走原有 Timeline 链路，不会全部塞回计划 Markdown 里。

另外，原生如果提供步骤进度，可以单独更新 executionProgress。Codex 的 `turn/plan/updated` 会转换成 progress 观察，内容类似：

```json
{
  "steps": [
    {"step": "定位登录失败原因", "status": "completed"},
    {"step": "修复会话刷新", "status": "in_progress"},
    {"step": "执行回归检查", "status": "pending"}
  ]
}
```

规划服务保存这份进度并发布更新。Web 的规划区域把它显示为可展开步骤列表。没有原生步骤事件，就不能凭计划里的编号编造“已经完成第几步”。

这里有三份不同的材料：

```text
计划卡片：当时批准的方案，版本固定
步骤进度：原生报告目前推进到哪里
聊天和工具结果：实际做了什么、返回了什么
```

执行中再次触发工具权限审批，就进入普通审批流程。之前批准计划，不代表命令、文件或网络权限全部放行。

若实施启动明确被拒绝，且后端标记可重试，确认区会出现“重试启动”，而不是再次要求你批准另一份正文。若结果 unknown，则展示待核对状态，不能自动把完整实施消息再发一遍。

另一台设备处理了审阅后，本端接到新状态，原确认面板随之退出或改变；历史正文卡片保留。重新打开会话时，也先核对当前状态，不能只凭历史卡片重新制造一次批准。

[Codex 步骤事件映射](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/connector/connector/runtimes/codex/planning.py)、[进度和重试界面](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/web-next/src/components/session/planning-panel.tsx)。

## 21. 提修改意见以后，旧计划怎么处理

假设你对第 1 版说：“第二步增加回归检查。”

这个决定仍绑定第 1 版的 review。适配器把意见送到原生程序，原生再写新终稿。AA 保留同一逻辑 planId，分配 revision=2，计算新 hash，建立新的 review，再走一遍 SQLite → PostgreSQL → 持久确认。

```text
plan-6 第 1 版 → 提修改意见 → 原生重新规划
plan-6 第 2 版 → 新的正文指纹 → 新的审阅
```

第 1 版可以继续阅读，但它的按钮不能再批准第 2 版。数据库也不会用新文字覆盖第 1 版。

## 22. “允许成功，但启动实施超时”，数据库怎么记

这种情况不能只写成功或失败。

例如 Codex 模式切换已经完成，实施消息提交时断网。对端可能没收到，也可能收到后回执丢了。

AA 另外记录操作 outcome 和 execution：

| 记录 | 含义 |
| --- | --- |
| applied | 这一步已应用 |
| pending | 仍待原生后续确认 |
| rejected | 明确被拒绝 |
| unknown | 无法判断是否已经发生 |

Connector 写本地操作回执，再将结果返回 Server，Server 更新 PostgreSQL 的 planning_operations。

客户端查询操作结果时，Server 读已有回执；若 unknown，再调用 `session.planning.operation` 查 Connector 日志。**查询不会顺手再执行一次批准。**

只有“批准已成功、实施明确未派发，而且适配器允许恢复”的情形，才只恢复实施阶段。未知结果先核对，不能一超时就重新发。

[操作结果与查询](https://github.com/anywhere-labs/Agents-Anywhere/blob/1f827133d6d6de86df424898d9b9738b6b3aebf3/server/agent_server/services/planning/service.py)。

## 23. 重启以后，哪些东西能读，哪些不能直接继续

| 事情 | 恢复办法 |
| --- | --- |
| 手机刷新后重读正文 | 按 sessionId、planId、revision 读 PostgreSQL |
| Connector 上传途中断网 | 从 SQLite 找 published=0 的版本重传 |
| Server 不知道 op-2 结果 | 查 PostgreSQL 回执，再查询 Connector 日志 |
| Connector 重启 | 读 SQLite 状态，换 epoch，并向原生重新校准 |
| 原生审批等待已消失 | 正文仍可读，但旧按钮不能复活它 |

Server 读取当前规划时，会优先请求原生校准。原生不可达时，返回保存的内容，同时标记 stale，意思是“这份当前状态可能过期”；阅读保留，审批动作禁用。

这就是为什么“存了计划”和“能批准计划”必须分开。数据库能保存施工图，却不一定还保留着那次正在等你签字的施工任务。

## 24. Redis 在这件事里做什么

Redis 帮忙找 Connector 连在哪台 Server，以及在不同 Server 之间转发请求。真实键名和逐层回执见[审批篇](01-审批架构：从LangGraph到Codex再到AA.md)。

它不是这份计划正文的最终存档，也不能用一次 Pub/Sub 广播代替 PostgreSQL 持久确认。

把整个流程连起来看：

```text
手机提规划任务
  → Server 预留操作
  → Connector 记本地操作
  → 原生开始规划
  → 草稿实时显示
  → 完整终稿固定版本与 hash
  → SQLite 保存待上传文档
  → PostgreSQL 保存不可变正文并确认
  → 用户带版本身份批准
  → Connector 再检查当前原生交互
  → 各适配器让原生继续
  → 保存操作结果，观察实施状态
```

你在界面上看到的一个“同意并执行”，实际把文档、用户决定和工作电脑上的执行任务连在了一起。
