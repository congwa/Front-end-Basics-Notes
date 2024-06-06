# 技术极简主义： 一切皆用Postgres

如果你们拥有超过一百万用户，超过五十名开发者，并且你们确实需要 Kafka、Spark 和 Kubernetes，那么请便。如果你的**系统数量比开发者还多，只用 Postgres 就是一个明智之选**。

> **全面使用 Postgres 并不意味着单台服务器搞定一切**

Postgres 能够取代许多后端技术，包括 Kafka、RabbitMQ、ElasticSearch，Mongo和 Redis ，至少到数百万用户时都毫无问题

- **替代redis**:使用 Postgres 替代 Redis 作为缓存，使用 UNLOGGED Table[3] 并用 TEXT 类型存储 JSON 数据，并使用存储过程来添加并强制执行过期时间，正如 Redis 所做的那样
- **代替Kafka**:使用 Postgres 作为消息队列，采用 SKIP LOCKED[4] 来代替Kafka（如果你只需要消息队列的能力）
- **代替数据仓库**: 使用加装了 TimescaleDB 扩展的 Postgres 作为数据仓库
- **替代 MongoDB**: 使用 PostgreSQL 的 JSONB类型来存储、索引、搜索 JSON 文档，从而替代 MongoD
- **定时任务（job center）**: 使用加装 pg_cron  扩展的 Postgres 作为定时任务守护程序，在特定时间执行特定任务，例如发送邮件，或向消息队列中添加事件
- **地理空间查询**: 使用 Postgres + PostGIS 执行 地理空间查询
- **替代 ElasticSearch**: 使用 Postgres 进行全文搜索，加装 ParadeDB 替代 ElasticSearch
- **免去服务器代码编写**: 使用 Postgres 在数据库中生成JSON，免去服务器端代码编写，直接供 API 使用
- **GraphQL 服务**: 使用 GraphQL适配器，也可以让 PostgreSQL 提供 GraphQL 服务

[原文](https://mp.weixin.qq.com/s/yI06zdqnW5uWnqvKmgM-9g)

![postgressql](/study/imgs/postgresql.webp)
