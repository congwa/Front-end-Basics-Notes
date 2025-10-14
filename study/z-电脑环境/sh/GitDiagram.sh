#!/bin/bash

# 设置颜色变量，用于美化输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 转义 sed 特殊字符的辅助函数
escape_sed() {
    printf '%s' "$1" | sed 's/[&|]/\\&/g'
}

# set -e: 如果任何命令失败，脚本将立即退出
set -e

echo -e "${GREEN}### 开始一键部署 GitDiagram ###${NC}"

# 1. 检查所需工具
echo -e "\n${YELLOW}Step 1: 正在检查所需工具 (git, pnpm, docker)...${NC}"
command -v git >/dev/null 2>&1 || { echo >&2 "错误：git 未安装。请先安装 git。"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo >&2 "错误：pnpm 未安装。请先安装 Node.js 和 pnpm。"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo >&2 "错误：docker 未安装。请先安装 Docker Desktop。"; exit 1; }
echo "所有工具已找到。"

# 2. 输入部署路径与 API 信息
echo -e "\n${YELLOW}Step 2: 请输入部署路径与接口信息...${NC}"
read -p "请输入项目安装路径（默认当前目录）: " INSTALL_PATH
if [ -z "$INSTALL_PATH" ]; then
    INSTALL_PATH="$(pwd)"
fi
mkdir -p "$INSTALL_PATH"
cd "$INSTALL_PATH"
echo "项目将安装到: $INSTALL_PATH"

read -p "请输入后端 API 地址（默认 http://localhost:8000）: " API_URL
if [ -z "$API_URL" ]; then
    API_URL="http://localhost:8000"
fi

read -p "请输入 OpenAI API Key（可留空）: " OPENAI_KEY

while true; do
    read -s -p "请输入 PostgreSQL 密码: " POSTGRES_PASSWORD
    echo
    read -s -p "请再次输入 PostgreSQL 密码以确认: " POSTGRES_PASSWORD_CONFIRM
    echo
    if [ -z "$POSTGRES_PASSWORD" ]; then
        echo "密码不能为空，请重新输入。"
    elif [ "$POSTGRES_PASSWORD" != "$POSTGRES_PASSWORD_CONFIRM" ]; then
        echo "两次输入不一致，请重新输入。"
    else
        break
    fi
done

if [ -d "gitdiagram" ]; then
    echo "错误：目标路径下已存在 'gitdiagram' 目录，请先处理后重试。"
    exit 1
fi

# 3. 克隆仓库并进入目录
echo -e "\n${YELLOW}Step 3: 正在从 GitHub 克隆项目...${NC}"
git clone https://github.com/ahmedkhaleel2004/gitdiagram.git
cd gitdiagram
echo "克隆完成，已进入项目目录。"

# 4. 安装依赖
echo -e "\n${YELLOW}Step 4: 正在使用 pnpm 安装依赖...${NC}"
pnpm i
echo "依赖安装完成。"

# 5. 创建并自动填充 .env 文件
echo -e "\n${YELLOW}Step 5: 正在创建并自动填充 .env 配置文件...${NC}"
cp .env.example .env
API_URL_ESCAPED=$(escape_sed "$API_URL")
OPENAI_KEY_ESCAPED=$(escape_sed "$OPENAI_KEY")
sed -i.bak "s|^NEXT_PUBLIC_API_DEV_URL=.*|NEXT_PUBLIC_API_DEV_URL=${API_URL_ESCAPED}|" .env
sed -i.bak "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=${OPENAI_KEY_ESCAPED}|" .env
rm -f .env.bak
echo "已更新 .env 中的 NEXT_PUBLIC_API_DEV_URL=$API_URL"
if [ -n "$OPENAI_KEY" ]; then
    echo "OPENAI_API_KEY 已写入。"
else
    echo "OPENAI_API_KEY 仍为空，如有需要请稍后手动补充。"
fi

# 6. 启动后端服务
echo -e "\n${YELLOW}Step 6: 正在使用 Docker Compose 启动后端服务... (可能需要几分钟)${NC}"
docker-compose up --build -d
echo "后端服务已在后台启动。"

# 7. 启动 PostgreSQL 容器
echo -e "\n${YELLOW}Step 7: 正在启动 PostgreSQL 容器...${NC}"
if docker ps -a --format '{{.Names}}' | grep -qx 'priceless_tu'; then
    if docker ps --format '{{.Names}}' | grep -qx 'priceless_tu'; then
        echo "检测到容器 'priceless_tu' 已在运行。"
    else
        docker start priceless_tu
        echo "已重新启动现有容器 'priceless_tu' (如需更改密码，请先删除容器)。"
    fi
else
    docker run -d --name priceless_tu -p 5432:5432 -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" postgres:latest
    echo "已创建并启动新的 PostgreSQL 容器 'priceless_tu'。"
fi

echo "PostgreSQL 密码: $POSTGRES_PASSWORD"

# 8. 启动并初始化数据库
echo -e "\n${YELLOW}Step 8: 正在启动并初始化数据库...${NC}"
chmod +x start-database.sh
# 使用 'yes' 命令自动对脚本的提问回答 'yes'
yes | ./start-database.sh
echo "数据库容器已启动。"
pnpm db:push
echo "数据库 Schema 初始化完成。"


# 7. 完成提示
echo -e "\n${GREEN}##############################################${NC}"
echo -e "${GREEN}### ✅ 部署准备工作全部完成！ ###${NC}"
echo -e "${GREEN}##############################################${NC}"
echo -e "\n现在，你可以随时通过以下命令来启动前端应用："
echo -e "${YELLOW}cd gitdiagram${NC} (如果不在目录中)"
echo -e "${YELLOW}pnpm dev${NC}"
echo -e "\n然后，在浏览器中打开 ${GREEN}http://localhost:3000${NC} 即可访问。"