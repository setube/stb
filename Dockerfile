# 构建前端
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# 复制前端文件
COPY view/package.json view/pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

# 复制前端源代码
COPY view/ .

# 构建前端
RUN pnpm build

# 构建后端
FROM node:18-alpine

WORKDIR /app

# 安装 MongoDB Shell
RUN apk add --no-cache mongodb-tools

# 复制后端 package.json
COPY server/package.json server/pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

# 复制后端源代码
COPY server/ .

# 复制前端构建产物
COPY --from=frontend-build /app/frontend/dist ./public

# 创建上传目录
RUN mkdir -p uploads/watermarks

# 生成随机 JWT_SECRET 并创建 .env 文件
RUN node -e "require('fs').writeFileSync('.env', \
    'JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex') + '\n' + \
    '# 端口号\n' + \
    'PORT=25519\n' + \
    '# 数据库连接字符串 27017是mongodb的默认端口 stb是数据库默认名称\n' + \
    'MONGODB_URI=mongodb://mongodb:27017/stb\n' + \
    '# 默认上传目录\n' + \
    'UPLOAD_DIR=/app/uploads\n' \
)"

# 创建等待脚本
RUN echo '#!/bin/sh\n\
echo "Waiting for MongoDB to be ready..."\n\
until mongo --host mongodb --eval "db.adminCommand(\"ping\")" > /dev/null 2>&1; do\n\
  echo "MongoDB is not ready yet. Waiting..."\n\
  sleep 2\n\
done\n\
echo "MongoDB is ready!"\n\
exec "$@"' > /app/wait-for-mongodb.sh && \
chmod +x /app/wait-for-mongodb.sh

# 暴露端口
EXPOSE 25519

# 启动命令
CMD ["/app/wait-for-mongodb.sh", "pnpm", "start"] 