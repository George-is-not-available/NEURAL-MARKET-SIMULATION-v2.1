#!/bin/bash

# AI Market Game 开发环境启动脚本
echo "🚀 启动 AI Market Game 开发环境..."

# 确保在正确的目录中
cd /home/runner/app

# 启动前端服务 (React)
echo "📱 启动前端服务 (React) 在端口 3000..."
npm start &
FRONTEND_PID=$!

# 等待2秒确保前端开始启动
sleep 2

# 启动后端服务 (Express)
echo "🔧 启动后端服务 (Express) 在端口 3002..."
cd backend
npm run dev &
BACKEND_PID=$!

# 回到根目录
cd ..

# 输出进程信息
echo "✅ 开发环境启动完成!"
echo "📱 前端服务: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "🔧 后端服务: http://localhost:3002 (PID: $BACKEND_PID)"
echo "🗺️  AMap 代理: http://localhost:3002/_AMapService"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
wait