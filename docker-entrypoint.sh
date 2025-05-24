#!/bin/sh
set -e

# --- 处理 VITE_APP_TITLE --- 
# 默认的 VITE_APP_TITLE
DEFAULT_VITE_APP_TITLE="Stb图床"
# 从环境变量获取 VITE_APP_TITLE，如果未设置，则使用默认值
RUNTIME_VITE_APP_TITLE=${VITE_APP_TITLE:-$DEFAULT_VITE_APP_TITLE}
echo "图床标题: $RUNTIME_VITE_APP_TITLE"

INDEX_HTML_FILE="/app/server/public/index.html"

if [ -f "$INDEX_HTML_FILE" ]; then
  echo "正在更新 $INDEX_HTML_FILE 中的标题..."
  # 使用 sed 替换占位符。注意 % 是 sed 的特殊字符，需要转义，或者使用其他分隔符
  # 使用 | 作为 sed 的分隔符可以避免与URL中的 /冲突，也方便处理 %
  sed -i "s|%VITE_APP_TITLE%|$RUNTIME_VITE_APP_TITLE|g" "$INDEX_HTML_FILE"
  echo "$INDEX_HTML_FILE 标题已更新."
else
  echo "警告: $INDEX_HTML_FILE 未找到. 跳过标题更新."
fi

# 执行传递给入口脚本的原始命令 (例如 node server/src/app.js 或者 nginx -g 'daemon off;')
exec "$@"