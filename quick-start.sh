#!/bin/bash

# 🚀 AI模拟市场游戏系统 - 快速启动脚本

echo "🎮 AI模拟市场游戏系统 - 快速启动"
echo "================================"

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    echo "💡 提示: cd ai-market-game && ./quick-start.sh"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 检查MongoDB是否运行
echo "🔍 检查MongoDB连接..."
if ! mongo --eval "db.adminCommand('ismaster')" >/dev/null 2>&1; then
    if ! mongod --version >/dev/null 2>&1; then
        echo "⚠️  MongoDB未安装或未启动"
        echo "💡 快速解决方案:"
        echo "   - macOS: brew services start mongodb-community"
        echo "   - Ubuntu: sudo systemctl start mongod"
        echo "   - 或使用MongoDB Atlas云数据库"
        echo ""
        read -p "是否继续启动? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# 启动服务
echo "🚀 启动服务..."

# 后台启动后端
echo "⚙️  启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:3002/api/health >/dev/null 2>&1; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "⚠️  后端服务可能启动失败，但继续启动前端..."
fi

# 启动前端
echo "⚛️  启动前端服务..."
npm start &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待服务启动完成..."
sleep 5

echo ""
echo "🎉 系统启动完成！"
echo "================================"
echo "🌐 前端地址: http://localhost:3000"
echo "⚙️  后端地址: http://localhost:3002"
echo "📊 数据库: MongoDB"
echo ""
echo "🎮 使用指南:"
echo "1. 打开浏览器访问 http://localhost:3000"
echo "2. 点击 '► START SIMULATION' 开始AI模拟"
echo "3. 观察实时数据更新和AI行为"
echo ""
echo "🛑 停止服务:"
echo "   Ctrl+C 或运行: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# 保存PID到文件以便后续停止
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo "✅ 服务已停止"; exit 0' INT

echo "💡 按 Ctrl+C 停止所有服务"
wait