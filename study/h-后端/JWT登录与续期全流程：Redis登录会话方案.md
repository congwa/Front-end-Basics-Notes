# JWT 登录与续期全流程：增加 Redis 登录会话后的方案

本方案在 access token 与 refresh token 的基础上，增加 `login_session:{family_id}`，让后端在每次业务请求时检查这次登录是否仍然有效。退出时删除登录记录，同一登录链中尚未到期的 access token 也会被拒绝。

下文根据提供的流程说明整理。`login_session`、`user_login_sessions`、续期时清理旧 Set 成员，以及原子续期流程属于新增设计，不能视为原 Sub2API 已实现的行为。本文不代表已完成代码实现或运行验证。

示例有效期统一为：`access_token` 24 小时，`refresh_token` 和登录记录 30 天。登录或成功续期后，相关 Redis key 的 TTL 从操作时刻重新计算；实际有效期以实现配置为准。

## 数据存放地图

| 位置 | 数据或 key | 存放内容 | 过期方式 |
| --- | --- | --- | --- |
| PostgreSQL | `users` | `id`、`email`、`password_hash`、`role`、`status` | 不使用 Redis TTL |
| PostgreSQL | `security_secrets` | `key = jwt_secret` 对应的 `value` | 长期保存，没有 TTL |
| 后端进程内存 | `jwt_secret` | 运行时签名和验签使用的密钥 | 随进程生命周期存在，启动时加载 |
| JWT 内容 | `access_token` | `user_id`、`email`、`role`、`token_version`、`sid`、`iat`、`nbf`、`exp` | 后端验证 `exp`、`nbf` 等字段 |
| Redis String | `login_session:{family_id}` | 用户编号字符串，用于判断这次登录是否有效 | 本示例 TTL 为 30 天 |
| Redis String | `refresh_token:{token_hash}` | refresh token 的 JSON 主记录 | 本示例 TTL 为 30 天；程序另查 `expires_at` |
| Redis Set | `user_refresh_tokens:{user_id}` | 该用户的 `token_hash` 索引 | 整个 key 有 TTL，成员没有独立 TTL |
| Redis Set | `token_family:{family_id}` | 该登录链的 `token_hash` 索引 | 整个 key 有 TTL，成员没有独立 TTL |
| Redis Set | `user_login_sessions:{user_id}` | 该用户的 `family_id` 索引 | 整个 key 有 TTL，成员没有独立 TTL |
| 浏览器 localStorage | `auth_token` | access token 原值 | 不自动删除 |
| 浏览器 localStorage | `refresh_token` | refresh token 原值 | 不自动删除 |
| 浏览器 localStorage | `auth_user` | 用户资料的 JSON 字符串 | 不自动删除 |
| 浏览器 localStorage | `token_expires_at` | 前端计算的 access token 到期毫秒时间 | 只是时间值，不是自动删除的 TTL |

`family_id` 表示一次登录链：续期沿用它，重新登录通常生成新的值；JWT 中的 `sid` 等于这个 `family_id`。`token_hash` 是完整 refresh token 的 SHA-256，用于定位 Redis 主记录。`token_version` 根据 `email` 和 `password_hash` 计算，用于检查凭据是否仍符合当前账号状态，续期不会把它加一。

refresh token 主记录决定凭据能否用于续期；登录记录决定该登录链是否仍有效；三个 Set 用于查找、批量清理，不能代替主记录的有效性检查。

## 一、系统启动：准备签名密钥

```text
后端启动
    ↓
读取 PostgreSQL 的 security_secrets 表
找到 key = jwt_secret 的那一行
    ↓
已有 jwt_secret？
    ├─ 有 → 读取 value
    └─ 没有 → 使用配置值，或安全随机生成
              再保存到 security_secrets.value
    ↓
把 jwt_secret 加载到后端内存
    ↓
以后生成 access_token，用它签名
以后检查 access_token，用它验签

存储结果：
PostgreSQL → 长期保存 jwt_secret，没有 TTL
后端内存   → 保存运行时使用的 jwt_secret
浏览器     → 不接收 jwt_secret
```

## 二、登录：生成并保存全部数据

```text
浏览器提交 email、password
    ↓
后端按 email 查询 PostgreSQL users 表
    ↓
读取 id、email、password_hash、role、status
    ↓
核对 password 与 password_hash
检查 status 是否允许登录
    ↓
根据 email、password_hash 计算 token_version
    ↓
安全随机生成 family_id
    ↓
生成 access_token
JWT 内包含：
user_id、email、role、token_version、sid
iat、nbf、exp

其中：
sid = family_id
exp = 后端当前时间 + 24 小时
    ↓
安全随机生成 refresh_token
    ↓
计算 token_hash = SHA256(完整 refresh_token)
    ↓
准备 refresh_token 的记录：
user_id、token_version、family_id
created_at、expires_at

其中：
created_at = 后端当前时间
expires_at = created_at + 30 天
    ↓
写入 Redis，全部成功后才返回登录成功：

① SET login_session:{family_id}
   value = 用户编号字符串
   TTL = 30 天

② SET refresh_token:{token_hash}
   value = 上面那段记录的 JSON 字符串
   TTL = 30 天

③ SADD user_refresh_tokens:{user_id} token_hash
   再 EXPIRE 整个 Set，TTL = 30 天

④ SADD token_family:{family_id} token_hash
   再 EXPIRE 整个 Set，TTL = 30 天

⑤ SADD user_login_sessions:{user_id} family_id
   再 EXPIRE 整个 Set，TTL = 30 天
    ↓
返回给浏览器：
access_token、refresh_token、expires_in、用户资料
    ↓
浏览器保存 localStorage：

auth_token       = access_token 原值
refresh_token    = refresh_token 原值
auth_user        = 用户资料的 JSON 字符串
token_expires_at = 当前毫秒时间 + expires_in × 1000
```

本示例中 `expires_in` 是 `86400` 秒。**localStorage 的四个 key 都没有自动删除的 TTL。**

## 三、请求业务接口：每次都检查登录是否有效

```text
浏览器读取 localStorage.auth_token
    ↓
放进请求头：
Authorization: Bearer access_token原值
    ↓
后端验证 JWT 签名
    ↓
检查 exp、nbf
    ↓
按 JWT.user_id 读取当前账号
    ↓
检查 status
比较 JWT.token_version 与当前计算的 token_version
    ↓
从 JWT.sid 取得 family_id
    ↓
GET login_session:{family_id}
    ↓
记录存在，而且用户编号匹配？
    ├─ 是 → 按当前账号权限处理业务
    └─ 否 → 返回 401，拒绝访问

这一过程：
不生成新 token
不修改 token
不延长 Redis TTL
```

## 四、续期：完整的生成、删除、添加和覆盖

```text
浏览器读取 localStorage.refresh_token
    ↓
提交 refresh_token 原值
    ↓
后端计算旧 token_hash
    ↓
GET refresh_token:{旧 token_hash}
    ↓
检查主记录是否存在
检查 JSON.expires_at 是否已过期
    ↓
从主记录取得 user_id、family_id、token_version
    ↓
查询当前账号
检查 status、token_version
    ↓
GET login_session:{family_id}
检查登录记录存在，且属于同一个用户
    ↓
准备新数据，暂时不返回浏览器：

生成新 access_token
生成新 refresh_token
计算新 token_hash
准备新的 JSON 记录和到期时间

沿用原 family_id
根据当前账号计算 token_version
    ↓
进入 Redis 原子操作
再次确认旧主记录未被消费、登录记录仍有效
    ↓
删除旧数据：

① DEL refresh_token:{旧 token_hash}
② SREM user_refresh_tokens:{user_id} 旧 token_hash
③ SREM token_family:{family_id} 旧 token_hash
    ↓
保存新数据：

④ SET refresh_token:{新 token_hash}
   value = 新记录的 JSON 字符串
   TTL = 从现在开始 30 天

⑤ SADD user_refresh_tokens:{user_id} 新 token_hash
   EXPIRE 整个 Set，重设 30 天

⑥ SADD token_family:{family_id} 新 token_hash
   EXPIRE 整个 Set，重设 30 天

⑦ EXPIRE login_session:{family_id}
   重设登录记录的 TTL 为 30 天

⑧ SADD user_login_sessions:{user_id} family_id
   EXPIRE 整个 Set，重设 30 天
    ↓
Redis 操作成功
    ↓
返回新 access_token、新 refresh_token、新 expires_in
    ↓
浏览器覆盖：

auth_token       = 新 access_token
refresh_token    = 新 refresh_token
token_expires_at = 重新计算的毫秒时间

auth_user 没有变化时，可以保留
```

这一轮**不删除 `login_session`，不更换 `family_id`**。

旧 `access_token` 没有单独存放在服务端，因此这里没有对它执行 `DEL`。它通常仍能用到自身 `exp`，但之后一旦退出，登录记录被删除，同一登录链中的新旧 `access_token` 都会被拒绝。

“再次检查 → 删除旧数据 → 保存新数据”应放在同一个 Redis Lua 脚本中完成。脚本发现登录记录不存在，就拒绝续期，**不能重新创建已经退出的登录记录**。

## 五、退出：撤销这一次登录的全部凭据

```text
浏览器请求退出登录
    ↓
后端验证登录凭据
取得可信的 user_id、family_id
    ↓
DEL login_session:{family_id}
    ↓
这条登录链的 access_token
从此不能再通过登录状态检查
    ↓
SMEMBERS token_family:{family_id}
取得这条登录链中的全部 token_hash
    ↓
对每个 token_hash 执行：

DEL refresh_token:{token_hash}
SREM user_refresh_tokens:{user_id} token_hash
    ↓
DEL token_family:{family_id}
SREM user_login_sessions:{user_id} family_id
    ↓
如果 user_refresh_tokens:{user_id}
或 user_login_sessions:{user_id} 已没有成员
对应 Set 也随之不存在
    ↓
确认服务端撤销成功
    ↓
浏览器删除：

auth_token
refresh_token
auth_user
token_expires_at
    ↓
跳回登录页
```

如果 `access_token` 已过期，退出接口也可以通过**经过验证的 `refresh_token` 主记录**确定这条登录链。不能直接相信浏览器随便提交的 `family_id`。

其他设备若使用不同的 `family_id`，仍然保持登录。

## 六、退出所有设备：撤销这个用户的全部登录

为方便列出全部登录记录，本方案增加 `user_login_sessions:{user_id}`。它已经纳入前面的登录、续期和单次退出流程，维护规则如下：

```text
登录时额外维护 Redis Set：

user_login_sessions:{user_id}
成员 = family_id
    ↓
每次登录 SADD family_id
每次续期重设整个 Set 的 TTL
单次退出 SREM 对应 family_id
```

退出所有设备的流程：

```text
验证用户身份，取得 user_id
    ↓
SMEMBERS user_login_sessions:{user_id}
取得全部 family_id
    ↓
对每个 family_id：
执行上面的“退出这一次登录”服务端流程
    ↓
删除用户登录索引
user_login_sessions:{user_id}
    ↓
清理用户 refresh_token 索引中的残留记录
user_refresh_tokens:{user_id}
    ↓
当前浏览器清理四个 localStorage key
    ↓
其他设备下次请求：
login_session 不存在 → 返回 401
```

这个新增 Set 的 TTL 应覆盖用户仍有效的登录记录，默认每次登录或续期重设为 30 天；成员本身没有独立 TTL。

## 七、改密码：旧凭据为什么失效

```text
验证当前用户和密码修改条件
    ↓
后端对新密码生成新的 password_hash
    ↓
更新 PostgreSQL users.password_hash
    ↓
当前 token_version 的计算结果改变
    ↓
旧 access_token 携带旧 token_version
旧 refresh_token 主记录保存旧 token_version
    ↓
与当前计算结果不匹配
    ↓
访问接口、续期都被拒绝
    ↓
如果产品要求改密后全部退出
再执行“退出所有设备”的 Redis 清理流程
```

这里没有在数据库里把 `token_version` 加一。数据库持久化的是新的 `password_hash`。

## 八、自然过期：分别由谁处理

```text
access_token 到达 JWT.exp
    ↓
服务器验证时拒绝
浏览器字符串不会自动消失
```

```text
refresh_token 主记录的 Redis TTL 到期
    ↓
refresh_token:{token_hash} 不再可读
    ↓
旧 refresh_token 无法续期

JSON.expires_at 也供程序检查截止时间
仅写 expires_at，不会让 Redis 自动删除
```

```text
login_session:{family_id} 的 TTL 到期
    ↓
登录记录不再可读
    ↓
该登录链的 access_token、refresh_token 都被拒绝
```

```text
三个索引 Set 的 TTL 到期：

user_refresh_tokens:{user_id}
token_family:{family_id}
user_login_sessions:{user_id}
    ↓
整个 Set key 失效
    ↓
不是每个成员分别过期

主记录提前删除或过期
不会自动从其他 Set 移除对应成员
```

```text
localStorage 到了 token_expires_at 指定的时间
    ↓
localStorage 不自动删除任何东西
    ↓
前端按时间尝试续期
成功 → 覆盖新凭据和时间
确定登录已失效 → 清理四个 key，回到登录页
```

服务端退出成功后，同一登录链的后续请求会被拒绝；已经通过鉴权、正在执行的请求不会自动中止。

## 九、实现时保持一致的规则

- **登录写入完整数据后再返回凭据。** 将登录记录、refresh token 主记录和三个索引作为一组维护；中途失败时清理本次写入的残留，避免只留下部分数据。
- **续期只允许消费一次旧凭据。** Lua 脚本内再次核对旧主记录与登录记录，成功后再删除旧数据、保存新数据。并发续期时，后到的请求不得继续使用已消费的旧记录。
- **Lua 原子执行不等于出错自动回滚。** 在写入前完成必要校验；脚本发生运行错误时，先前执行的写入可能仍然存在，需要设计恢复处理。
- **退出与续期不能让登录复活。** 单次退出先删除登录记录；续期只能延长仍存在且归属匹配的记录，不能重新创建它。退出后的 refresh token 残留仍须清理。
- **用户索引的 TTL 要覆盖全部有效会话。** 本文所有会话统一 30 天时，登录和续期重设用户索引为 30 天；若以后允许不同会话期限，应确保索引不会先于仍有效的会话过期。
- **退出所有设备需要处理并发。** 本文流程图描述列举并清理当前登录记录的步骤。若要求操作完成时所有旧会话都已撤销，需要协调并发登录、续期和清理，避免读取索引后又出现遗漏或误删；不能仅靠逐个删除保证这一点。
- **服务端成功与浏览器保存是两个步骤。** Redis 续期成功但响应丢失时，旧 refresh token 已被消费，浏览器可能没有拿到新凭据。实际实现需要明确这种情况下的恢复或重新登录规则。
- **前端区分凭据失效与临时故障。** 确认登录失效后清理四个 localStorage key；网络超时或服务暂时不可用，不应直接当作凭据已失效。Redis 检查失败时，后端不能跳过登录状态校验放行业务请求。
