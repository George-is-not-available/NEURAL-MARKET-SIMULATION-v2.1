#!/bin/bash

# 🛑 AI模拟市场游戏系统 - 停止服务脚本

echo "🛑 停止AI模拟市场游戏系统服务"
echo "================================"

# 读取PID文件
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔧 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端服务进程不存在"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "⚛️  停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端服务进程不存在"
    fi
    rm -f .frontend.pid
fi

# 强制杀死可能残留的进程
echo "🧹 清理残留进程..."
pkill -f "npm start" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

# 检查端口占用
PORTS_IN_USE=$(lsof -ti:3000,3002 2>/dev/null)
if [ ! -z "$PORTS_IN_USE" ]; then
    echo "⚠️  检测到端口仍被占用:"
    lsof -i:3000,3002 2>/dev/null | head -10
    echo ""
    read -p "是否强制释放端口? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$PORTS_IN_USE" | xargs kill -9 2>/dev/null
        echo "✅ 端口已强制释放"
    fi
fi

echo "🎉 所有服务已停止"