
# ReadySet 技术详解与部署实践指南

本文旨在提供一份关于 ReadySet 的全面技术指南，覆盖其核心概念、工作原理、多种部署架构及具体实践。目标是为技术人员在评估和使用 ReadySet 时，提供清晰、客观的决策依据和操作步骤。

---

## 1. ReadySet 是什么？

ReadySet 是一个SQL缓存层，部署在应用程序和数据库之间。它的主要功能是缓存高频或慢速的 `SELECT` 查询结果，并能**自动、实时地**根据数据库的数据变更来更新这些缓存。

这解决了传统缓存方案（如Redis）中最核心的难题：手动进行缓存失效（Cache Invalidation），以及由此产生的代码复杂性和数据过时（Stale Data）风险。

### 1.1. 与传统缓存 (Redis) 的核心区别

| 对比维度 | Redis (或其他手动缓存) | ReadySet |
| :--- | :--- | :--- |
| **缓存管理** | **手动**：需在应用代码中显式调用 `set`/`del` 等命令。 | **自动**：监听数据库变更，自动更新已缓存的查询结果。 |
| **数据一致性** | **最终一致性**：依赖开发者的失效策略，容易出现数据不一致。 | **强一致性**：缓存与数据库的变更实时同步。 |
| **应用代码** | **侵入式**：业务逻辑与缓存逻辑高度耦合。 | **非侵入式**：应用代码无需修改，缓存层对应用透明。 |
| **查询支持** | 通常是简单的键值对或数据结构。 | 复杂的 SQL 查询，包括 `JOIN`, `GROUP BY` 等。 |

---

## 2. 工作原理与背景

### 2.1. 技术背景

ReadySet 由 ReadySet, Inc. 公司开发，其技术核心源于麻省理工学院计算机科学与人工智能实验室 (MIT CSAIL) 的 **Noria** 数据流系统研究项目。这表明其架构基于经过验证的计算机科学理论。

### 2.2. 核心机制

ReadySet 的自动化能力依赖于以下机制：

1.  **数据库代理**：应用程序的数据库连接指向 ReadySet。ReadySet 充当代理，接收所有 SQL 请求。
2.  **复制流监听**：ReadySet 连接到主数据库的**复制流 (Replication Stream)**（例如 PostgreSQL 的逻辑复制或 MySQL 的 binlog）。这使其可以实时捕获所有 `INSERT`, `UPDATE`, `DELETE` 操作。
3.  **查询缓存创建**: 开发者通过 `CREATE CACHE FROM SELECT ...` 这样的 SQL 命令，声明需要被缓存的查询。
4.  **增量更新**: 当 ReadySet 从复制流监听到影响已缓存查询的数据变更时，它会在内存中对缓存结果进行**增量计算和更新**。此过程效率远高于重新执行原始查询。
5.  **请求路由**:
    * 如果接收到的 `SELECT` 查询命中缓存，ReadySet 直接从内存返回结果。
    * 如果查询未被缓存，或者是写操作，请求将被透明地转发到后端主数据库。

---

## 3. 本地部署与基础使用 (Docker)

本节介绍如何使用 Docker 在本地快速搭建一个测试环境。

**前提**: 已安装 Docker 和 Docker Compose。

1.  **配置文件**
    在一个空目录下，创建以下两个文件：

    * `docker-compose.yml`:
        ```yaml
        version: '3.8'
        services:
          db:
            image: postgres:15
            container_name: readyset-postgres-db
            ports: ["5432:5432"]
            environment:
              - POSTGRES_USER=user
              - POSTGRES_PASSWORD=password
              - POSTGRES_DB=testdb
            command: postgres -c wal_level=logical
            volumes:
              - ./init.sql:/docker-entrypoint-initdb.d/init.sql
          readyset:
            image: readyset/readyset:latest
            container_name: readyset-cache
            ports: ["6432:6432"]
            command: >
              sqld
              --adapter-listen-addr 0.0.0.0:6432
              --upstream-db-url postgres://user:password@db:5432/testdb
              --read-replica-urls postgres://user:password@db:5432/testdb?replication=true
            depends_on:
              - db
        ```

    * `init.sql`:
        ```sql
        CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100));
        INSERT INTO users (name, email) VALUES
        ('Alice', 'alice@example.com'),
        ('Bob', 'bob@example.com');
        ```

2.  **启动服务**
    ```bash
    docker-compose up -d
    ```

3.  **创建与验证缓存**
    * **连接到 ReadySet (注意端口是 6432)**:
        ```bash
        psql "postgres://user:password@localhost:6432/testdb"
        ```
    * **声明要缓存的查询**:
        ```sql
        CREATE CACHE FROM SELECT id, name FROM users WHERE email LIKE '%@example.com';
        ```
    * **验证自动缓存同步**:
        打开一个**新的终端**，连接到**主数据库 (端口 5432)** 并修改数据：
        ```bash
        psql "postgres://user:password@localhost:5432/testdb"
        INSERT INTO users (name, email) VALUES ('David', 'david@example.com');
        ```
        回到第一个连接 ReadySet 的终端，再次执行查询，可以看到结果已自动包含 David。
        ```sql
        SELECT id, name FROM users WHERE email LIKE '%@example.com';
        ```

---

## 4. 部署架构分析

根据业务需求，ReadySet 有多种部署模式。

### 4.1. 单机部署

* **架构**: ReadySet 与应用程序共同运行在同一服务器上，应用通过 `localhost` 连接 ReadySet。
* **优点**: 部署简单、成本最低、应用到缓存的延迟极低。
* **缺点**: **单点故障 (SPOF)**，服务器宕机则应用和缓存都将失效；应用与 ReadySet 存在资源竞争。
* **适用场景**: 开发、测试环境；对可用性要求不高的非核心内部应用。

### 4.2. 高可用部署

* **架构**: 至少部署两台 ReadySet 服务器，通过负载均衡（SLB）或 Keepalived+HaVip 方案实现流量分发和故障转移。
* **数据库架构要求**:
    * **最小需求**: 1 台数据库实例。
    * **生产推荐**: **主从 (Primary-Replica) 架构**。让 ReadySet 从只读副本上消费复制流，以隔离对主库的性能影响。
* **优点**: 消除单点故障，服务可用性高；数据库主从分离，架构稳健。
* **缺点**: 部署相对复杂，资源成本更高。
* **适用场景**: 所有对可用性有要求的生产环境。

---

## 5. 阿里云生产部署实践

以阿里云为例，构建一套生产级高可用 ReadySet 服务。

1.  **数据库层 (RDS)**:
    * 使用 **RDS 高可用版**，确保主备跨可用区容灾。
    * 在参数设置中开启**逻辑复制**。
    * 创建一个**只读实例**，专门用于 ReadySet 读取复制流。

2.  **缓存服务层 (ReadySet)**:
    * 创建**至少两台 ECS**，分布在**不同可用区**。
    * 在每台 ECS 上使用 Docker 容器运行 ReadySet，并配置 `systemd` 服务来保证进程的稳定运行和自动重启。

3.  **接入层 (SLB 或 HaVip)**:
    * **方案A (推荐)**: 部署一个**负载均衡 SLB** 实例（推荐使用网络型 NLB），配置健康检查，将流量转发到后端的 ReadySet ECS 集群。这是最简单、最可靠的方案。
    * **方案B (低成本替代)**: 如果对成本极其敏感，可以不使用 SLB，转而采用在 ECS 上配置 **Keepalived + HaVip** 的方式，手动实现主备切换。此方案大幅增加了运维复杂性和风险。

---

## 6. 决策依据：是否应该使用 ReadySet？

在单机部署模型下，是否值得引入 ReadySet？

| 对比维度 | 不使用 ReadySet | 单机使用 ReadySet |
| :--- | :--- | :--- |
| **读取性能** | 依赖数据库，复杂查询可能成为瓶颈 | 缓存命中时极高，显著提升性能 |
| **数据库负载** | 高，所有读请求均由数据库处理 | 显著降低，大量读请求被缓存层拦截 |
| **代码复杂度**| 若需优化，则要手动实现缓存，复杂度高 | 极低，缓存对应用透明，无需修改代码 |
| **运维复杂度**| 简单，只需管理应用进程 | 增加，需要额外管理 ReadySet 进程 |
| **成本** | 基础成本 (ECS + RDS) | 基础成本 + ReadySet 消耗的少量计算资源 |
| **可靠性** | 两个故障点：ECS 和 RDS | ECS 成为更集中的单点故障 (应用+缓存) |

### 核心权衡

决策的关键在于权衡：

> **是否愿意用「增加一个组件的运维成本和单点故障风险」，来换取「数据库性能的显著提升」和「应用开发复杂度的**大幅**降低」？**

* **如果你的应用读负载低，数据库性能充裕**：不需要 ReadySet。
* **如果你的应用读负载高，存在慢查询瓶颈，或被手动缓存逻辑困扰**：ReadySet 是一个值得重点考虑的解决方案。


### 文章参考

- [用数据库替换缓存服务 https://avi.im/blag/2025/db-cache/](https://avi.im/blag/2025/db-cache/)
