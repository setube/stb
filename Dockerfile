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

# 启动命令
CMD ["pnpm", "start"] 
