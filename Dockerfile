# 使用多阶段构建
FROM node:18-alpine AS build

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY pnpm-workspace.yaml package.json ./

# 复制前端和后端的 package.json 文件
COPY server/package.json ./server/
COPY view/package.json ./view/

# 安装依赖
RUN pnpm install

# 复制源代码
COPY server ./server
COPY view ./view

# 构建前端项目
RUN pnpm --filter="./view" build

# 最终镜像
FROM node:18-alpine

WORKDIR /app

# 安装 MongoDB Shell
RUN apk add --no-cache mongodb-tools

# 安装 pnpm
RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY pnpm-workspace.yaml package.json ./

# 复制后端代码和前端构建产物
COPY --from=build /app/server ./server

# 生产环境仅需后端依赖
WORKDIR /app/server
RUN pnpm install --prod

# 创建上传目录
RUN mkdir -p uploads/watermarks

# 生成随机 JWT_SECRET 并创建 .env 文件
RUN node -e "require('fs').writeFileSync('.env', \
  'JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex') + '\n' + \
  '# 端口号\n' + \
  'PORT=25519\n' + \
  '# 数据库连接字符串 27017是mongodb的默认端口 stb是数据库默认名称\n' + \
  'MONGODB_URI=mongodb://mongodb:27017/stb\n' + \
  '# 图床标题\n' + \
  'VITE_APP_TITLE=Stb 图床\n' \
  )"

# 切回主目录
WORKDIR /app

# 复制入口脚本并给予执行权限
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 25519

ENTRYPOINT ["/docker-entrypoint.sh"]

# 启动命令
CMD ["pnpm", "--filter=./server", "start"] 