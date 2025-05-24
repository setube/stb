#!/bin/bash

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Git 是否安装
if ! command_exists git; then
    echo "错误：Git 未安装。请先安装 Git 后再运行此脚本。"
    exit 1
fi

# 检查 Docker 是否安装
if ! command_exists docker; then
    echo "错误：Docker 未安装。请先安装 Docker 后再运行此脚本。"
    exit 1
fi

# 检查 Docker Compose 是否可用
if ! docker compose version >/dev/null 2>&1; then
    echo "错误：Docker Compose (v2) 未安装或未正确配置。请确保您可以使用 'docker compose' 命令。"
    exit 1
fi


# 1. 下载源码
if [ -d "stb" ]; then
    echo "目录 'stb' 已存在，跳过下载。"
else
    echo "正在从 GitHub 下载源码..."
    git clone https://github.com/setube/stb.git
    if [ $? -ne 0 ]; then
        echo "错误：下载源码失败。"
        exit 1
    fi
fi

cd stb

# 2. 创建 docker-compose.yml 文件
echo "正在创建 docker-compose.yml 文件..."
cat <<EOL > docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "25519:25519"
    volumes:
      - ./server/uploads:/app/server/uploads
      - ./.env:/app/server/.env
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    environment:
      - PORT=25519
      - UPLOAD_DIR=/app/server/uploads
      - MONGODB_URI=mongodb://mongodb:27017/stb
      - JWT_SECRET=\${JWT_SECRET:?error}
      - VITE_BASE_URL=\${VITE_BASE_URL:?error}
      - VITE_APP_TITLE=\${VITE_APP_TITLE:?error}
    expose:
      - 25519

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "'db.runCommand({ping: 1})'"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    container_name: mongodb

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
EOL

# 3. 创建 .env 文件并设置变量
if [ -f ".env" ]; then
    echo ".env 文件已存在，跳过创建。"
else
    echo "正在创建并配置 .env 文件..."
    # 为 JWT_SECRET 生成一个随机字符串
    JWT_SECRET_VALUE=$(openssl rand -hex 32)
    cat <<EOL > .env
# 应用配置
VITE_APP_TITLE=STB
VITE_BASE_URL=http://localhost:25519

# 安全密钥 (自动生成)
JWT_SECRET=${JWT_SECRET_VALUE}
EOL
fi

# 4. 运行 Docker Compose
echo "正在使用 Docker Compose 启动服务..."
docker compose up -d

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "服务正在后台运行。"
    echo "您现在可以通过 http://localhost:25519 访问应用。"
else
    echo "❌ 部署失败。请检查以上输出信息。"
fi
