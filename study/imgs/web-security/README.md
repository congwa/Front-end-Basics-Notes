# Web 应用安全配图

这组图片用于 [Web 应用安全的八层防线](../../h-后端/Web应用安全的八层防线.md)。全部通过内置 imagegen 生成，并在核对技术关系后局部修订；不是下载后直接使用的网图，也没有对应的可编辑 SVG。

| 图片 | 表达的机制 |
| --- | --- |
| 01-security-layers.png | 六个请求检查位置及覆盖全链路的两层职责 |
| 02-browser-boundaries.png | XSS、CSRF 与 CORS 的不同边界 |
| 03-object-authorization.png | 同一登录身份对不同资源的授权结果 |
| 04-concurrent-claim.png | 先查后改与条件扣减的并发顺序 |
| 05-ddl-locks.png | 先提交 NOT VALID，再以较弱锁验证历史数据 |
| 06-ddl-rollout.png | 扩展、回填与切换、收缩期间的结构及应用共存 |
| 07-outbox-recovery.png | 提交前、提交后及外部发送后的恢复方式 |

视觉组织参考 [pgroll 的迁移时间条](https://pgroll.com/blog/introducing-pgroll-zero-downtime-reversible-schema-migrations-for-postgres) 和 [Cloudflare 的请求防护示意](https://blog.cloudflare.com/waf-attack-score-for-business-plan/)，重新设计了本文的图形与内容。图片不包含借用网站的原图、品牌标识或水印；数据库标识仅用于识别技术主题。

原始生成提示词和局部修订提示词见 [generation-prompts.json](generation-prompts.json)。修改时可将现有 PNG 作为编辑对象，使用对应提示词重新生成，并重新核对中文、箭头、事务边界及时间顺序。图中时间条是机制示意，不是实测耗时。
