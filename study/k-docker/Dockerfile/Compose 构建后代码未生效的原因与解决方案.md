# Dockerfile/Compose 构建后代码未生效的原因与解决方案

在使用 Dockerfile + Docker Compose 时，明明修改了 `app/` 目录的一行代码，但运行 `git pull && docker compose up -d` 或 `docker compose up -d --build` 却没有应用最新代码的常见原因与稳定解决方案。目标是在保留构建缓存（加速）的同时，确保代码变更总能触发更新。

## 常见原因

- 未触发镜像重建
  `docker compose up -d` 默认不会重建镜像；不加 `--build` 的话，容器会继续使用旧镜像。
- 构建缓存命中导致代码层未更新
  即使加了 `--build`，若 Docker 认为 `COPY app/` 这一层没有变化，会直接使用缓存，导致镜像里的代码仍旧。
- 构建上下文或 .dockerignore 排除了源码
  如果 `build.context` 范围不含你的变更，或 `.dockerignore` 把 `app/` 忽略了，`COPY app/` 看不到变化，自然命中缓存。
- 运行时被挂载覆盖
  若 `volumes` 把宿主机的某个目录挂到容器内覆盖了镜像中的代码（比如 `/app` 或 `/app/app`），生效的是挂载内容，而不是镜像内文件。
- 实际运行的不是本地构建的镜像
  Compose 使用了 `image:` 从 registry 拉镜像而非本地 `build:`，即使本地代码更新也不会被使用（你当前配置使用的是 `build:`，一般没这个问题）。
- 运行入口/工作目录错误
  启动命令从其他位置加载了代码，或被旧的字节码/缓存遮住，表象像“没更新”。

## 你的 Compose 关键点

- 当前 `backend` 没有挂载源码目录（没有 `./app:/app/app`），容器使用的是镜像内打包的代码。
- 仅运行 `docker compose up -d` 时不会重建镜像；即使 `--build`，如果 Docker 判断 `COPY app/` 无变化，仍会使用缓存。

## 快速排查步骤

1. 强制重建并重启（一次性验证是否为缓存问题）
   - `docker compose build --no-cache backend`
   - `docker compose up -d --force-recreate backend`
   - 如果此后代码生效，说明是缓存命中问题。

2. 容器内对比代码
   - `docker compose exec backend sh -lc 'head -n 5 /app/app/你改动的文件.py'`
   - 确认容器里是否是新代码。

3. 检查 Compose 配置
   - `services.backend.build.context` 是否包含源码目录；
   - 是否存在覆盖代码的 `volumes`；
   - 是否混用远程 `image:` 而未 `build:`（你当前用的是 `build:`）。

4. 检查 `.dockerignore`
   - 确保没有忽略 `app/`、`run.py` 等源文件。

5. 检查镜像层
   - `docker compose images`
   - `docker history <你的后端镜像名:tag>`
     看 `COPY app/ ./app/` 这一层是否为最新时间。

## 不关闭缓存也能稳定生效的做法

在保留缓存的情况下，我们需要一个“变更指示器”来只打破代码层的缓存，让依赖层继续命中缓存。推荐两种方案：

### 方案一：基于 Git 提交的“变更指示器”（推荐）

思路：在构建时传入 `GIT_SHA`，让 Dockerfile 在复制代码前引入一个与提交绑定的文件，从而使紧随其后的 `COPY app/` 层在提交变化时失效、重建。

- Compose 里传入构建参数：
  ```yaml
  services:
    backend:
      build:
        context: .
        dockerfile: Dockerfile
        args:
          APP_UID: ${APP_UID:-1000}
          APP_GID: ${APP_GID:-1000}
          GIT_SHA: ${GIT_SHA:-dev}
  ```
- 构建/启动命令（先导出当前提交短 SHA）：
  ```bash
  GIT_SHA=$(git rev-parse --short HEAD)
  GIT_SHA=$GIT_SHA docker compose up -d --build backend
  # 或
  GIT_SHA=$GIT_SHA docker compose build backend && docker compose up -d backend
  ```
- Dockerfile 中加入（在 COPY 源码之前）：
  ```dockerfile
  ARG GIT_SHA=dev
  LABEL org.opencontainers.image.revision=$GIT_SHA

  # 在复制代码之前写入一个与提交绑定的文件，打破后续代码层缓存
  RUN echo "$GIT_SHA" > /app/.build-rev

  # 然后复制源码
  COPY app/ ./app/
  ```

优点：
- 每次提交变化只重建代码层；依赖层（poetry 安装）缓存仍复用，构建快。
- 操作简单，贴合 CI/CD（镜像还能带上提交信息）。

### 方案二：基于源码校验和的“变更指示器”

思路：构建前生成源码校验和清单，把它先 COPY 进镜像；清单变化时，后续 `COPY app/` 会重建。

- 构建前生成校验和清单：
  ```bash
  find app -type f -not -path "*/__pycache__/*" -exec sha1sum {} \; | sort -k 2 > app.checksums
  docker compose build backend
  ```
- Dockerfile 中：
  ```dockerfile
  COPY app.checksums /app/app.checksums
  COPY app/ ./app/
  ```

优点：
- 不依赖 git；任何文件改动都会触发代码层重建。
- 依赖层仍然缓存。

注意：
- 需要在每次构建前生成 `app.checksums`（可写成脚本或 CI 步骤）。

## 生产与开发的两种工作模式

根据你的场景选择其中一种：

- 生产/打包模式（不挂源码）
  - 使用方案一（或二）确保变更能触发代码层重建。
  - 命令简化：`docker compose up -d --build backend`（加上 `GIT_SHA`）。
  - 建议镜像唯一标签，例如：
    - Compose 增加 `image: myapp-backend:${GIT_SHA:-dev}`
    - 构建前导出 `GIT_SHA=$(git rev-parse --short HEAD)`，避免同名旧镜像被复用。

- 开发/热更新模式（挂源码）
  - 在 `backend.volumes` 增加：`- ./app:/app/app:rw`
  - 启动命令使用开发参数（仅开发环境）：
    ```yaml
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
  - 这样代码改动立即生效，无需构建。

## 建议的 .dockerignore

确保不要把源码排除；仅忽略无用大文件和缓存：

```
.git
__pycache__/
*.pyc
.venv/
.mypy_cache/
.pytest_cache/
logs/
app/data/
```

## 常用验证命令

- 强制重建验证缓存是否问题：
  ```
  docker compose build --no-cache backend
  docker compose up -d --force-recreate backend
  ```
- 容器内检查文件是否最新：
  ```
  docker compose exec backend sh -lc 'head -n 5 /app/app/你改的文件.py'
  ```
- 检查镜像层是否重建：
  ```
  docker compose images
  docker history <镜像名:tag>
  ```

## 总结

- 仅 `up -d` 不会重建镜像；`--build` 有时仍会命中缓存导致代码层不更新。
- 使用“变更指示器”（推荐基于 `GIT_SHA`）让 `COPY app/` 在代码变化时必定重建，同时保留依赖层缓存。
- 开发环境用源码挂载与 `--reload`；生产环境用唯一标签 + 指示器触发重建，稳定高效。