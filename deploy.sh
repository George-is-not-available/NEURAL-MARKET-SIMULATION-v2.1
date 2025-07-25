#!/bin/bash

# 🚀 AI模拟市场游戏系统 - 自动部署脚本

echo "🎮 AI模拟市场游戏系统 - 自动部署开始"
echo "================================"

# 检查Node.js版本
echo "📋 检查系统要求..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低，需要 16+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"

# 创建项目目录
PROJECT_NAME="ai-market-game"
if [ -d "$PROJECT_NAME" ]; then
    echo "⚠️  目录 $PROJECT_NAME 已存在"
    read -p "是否删除并重新创建? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_NAME"
        echo "✅ 已删除旧目录"
    else
        echo "❌ 部署取消"
        exit 1
    fi
fi

echo "📁 创建项目目录..."
mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME"

# 初始化前端项目
echo "⚛️  初始化前端项目..."
npx create-react-app . --template typescript --silent

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install --silent \
    tailwindcss@3 postcss@8 autoprefixer@10 \
    @amap/amap-jsapi-loader react-amap \
    socket.io-client \
    chart.js react-chartjs-2

# 初始化Tailwind CSS
echo "🎨 配置 Tailwind CSS..."
npx tailwindcss init -p --ts --silent

# 创建后端项目
echo "🔧 创建后端项目..."
mkdir backend
cd backend

# 创建package.json
cat > package.json << EOF
{
  "name": "ai-market-backend",
  "version": "1.0.0",
  "description": "AI Market Game Backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "keywords": ["ai", "market", "game", "simulation"],
  "author": "",
  "license": "MIT"
}
EOF

# 安装后端依赖
echo "📦 安装后端依赖..."
npm install --silent \
    express typescript ts-node nodemon \
    socket.io mongoose cors dotenv \
    @types/express @types/cors @types/node

# 创建TypeScript配置
npx tsc --init --silent

cd ..

# 创建环境变量文件
echo "⚙️  创建环境配置..."
cat > .env << EOF
# MongoDB Configuration
MONGO_INNER_HOST=127.0.0.1
MONGO_INNER_PORT=27017
MONGO_PASSWORD=ai_market_password
MONGO_DB=ai_market_game
MONGO_USER=ai_market_user
MONGODB_URI=mongodb://127.0.0.1:27017/ai_market_game

# Server Configuration
PORT=3002
NODE_ENV=development

# Amap API Configuration
REACT_APP_AMAP_API_KEY=YOUR_AMAP_API_KEY_HERE

# Socket.io Server Configuration
REACT_APP_SERVER_URL=http://localhost:3002
EOF

# 复制到backend目录
cp .env backend/.env

# 创建必要的目录结构
echo "📁 创建项目结构..."
mkdir -p src/components src/hooks src/services
mkdir -p backend/src/models backend/src/routes backend/src/services

echo ""
echo "🎉 部署完成！"
echo "================================"
echo "📍 项目路径: $(pwd)"
echo "🌐 前端地址: http://localhost:3000"
echo "⚙️  后端地址: http://localhost:3002"
echo ""
echo "🚀 启动步骤:"
echo "1. 启动后端: cd backend && npm run dev"
echo "2. 启动前端: npm start (新终端窗口)"
echo ""
echo "⚠️  注意事项:"
echo "- 需要配置MongoDB数据库"
echo "- 可选配置高德地图API密钥"
echo "- 详细说明请查看 deployment-guide.md"
echo ""
echo "📚 查看完整部署指南:"
echo "cat deployment-guide.md"