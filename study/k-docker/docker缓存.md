# docker存RUN npm安装指令


## 1. 使用.dockerignore文件

这个策略涉及排除node_modules目录被复制到镜像中。这是通过创建一个.dockerignore文件并在其中列出node_modules目录来实现的。当镜像被构建时，node_modules目录下的文件不会被复制，”RUN npm install “指令会被再次执行。这种策略实现起来很简单，但它有一个缺点，那就是增加了镜像的大小，因为它将包含所有的依赖关系。

## 2. 多阶段构建

这种策略涉及在Docker文件中`使用多个FROM语句`来创建多个镜像，每个镜像都有特定的目的。

构建的第一阶段安装依赖项并复制node_modules目录。

第二阶段的构建只复制第一阶段的必要文件，如应用程序代码。

这种策略减少了镜像的大小，但它的设置和维护可能更复杂


```sh
# 多阶段构建的示例

# 第一阶段：使用 Node.js 镜像构建应用
FROM node:14 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# 第二阶段：使用 Nginx 镜像作为最终镜像
FROM nginx:alpine

# 复制第一阶段构建的产物到最终镜像  ---------
COPY --from=builder /app/dist /usr/share/nginx/html

# 如果需要，可以添加一些额外的配置或修改

# 暴露 Nginx 的默认端口
EXPOSE 80

# 启动 Nginx 服务器
CMD ["nginx", "-g", "daemon off;"]

```

## 使用包锁文件


```sh
# package-lock.json or yarn.lock file
...

# Dockerfile
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

```

## 使用npm缓存卷



