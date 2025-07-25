  @echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🎮 AI模拟市场游戏系统 - Windows自动部署
echo ================================

REM 检查Node.js
echo 📋 检查系统要求...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%

npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未找到
    pause
    exit /b 1
)

for /f %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm 版本: %NPM_VERSION%

REM 创建项目目录
set PROJECT_NAME=ai-market-game
if exist "%PROJECT_NAME%" (
    echo ⚠️  目录 %PROJECT_NAME% 已存在
    set /p REPLY="是否删除并重新创建? (y/N): "
    if /i "!REPLY!"=="y" (
        rmdir /s /q "%PROJECT_NAME%"
        echo ✅ 已删除旧目录
    ) else (
        echo ❌ 部署取消
        pause
        exit /b 1
    )
)

echo 📁 创建项目目录...
mkdir "%PROJECT_NAME%"
cd "%PROJECT_NAME%"

REM 初始化前端项目
echo ⚛️  初始化前端项目...
call npx create-react-app . --template typescript

REM 安装前端依赖
echo 📦 安装前端依赖...
call npm install tailwindcss@3 postcss@8 autoprefixer@10 @amap/amap-jsapi-loader react-amap socket.io-client chart.js react-chartjs-2

REM 初始化Tailwind CSS
echo 🎨 配置 Tailwind CSS...
call npx tailwindcss init -p --ts

REM 创建后端项目
echo 🔧 创建后端项目...
mkdir backend
cd backend

REM 创建package.json
echo 📄 创建后端配置...
(
echo {
echo   "name": "ai-market-backend",
echo   "version": "1.0.0",
echo   "description": "AI Market Game Backend",
echo   "main": "dist/server.js",
echo   "scripts": {
echo     "dev": "nodemon src/server.ts",
echo     "build": "tsc",
echo     "start": "node dist/server.js"
echo   },
echo   "keywords": ["ai", "market", "game", "simulation"],
echo   "author": "",
echo   "license": "MIT"
echo }
) > package.json

REM 安装后端依赖
echo 📦 安装后端依赖...
call npm install express typescript ts-node nodemon socket.io mongoose cors dotenv @types/express @types/cors @types/node

REM 创建TypeScript配置
call npx tsc --init

cd ..

REM 创建环境变量文件
echo ⚙️  创建环境配置...
(
echo # MongoDB Configuration
echo MONGO_INNER_HOST=127.0.0.1
echo MONGO_INNER_PORT=27017
echo MONGO_PASSWORD=ai_market_password
echo MONGO_DB=ai_market_game
echo MONGO_USER=ai_market_user
echo MONGODB_URI=mongodb://127.0.0.1:27017/ai_market_game
echo.
echo # Server Configuration
echo PORT=3002
echo NODE_ENV=development
echo.
echo # Amap API Configuration
echo REACT_APP_AMAP_API_KEY=YOUR_AMAP_API_KEY_HERE
echo.
echo # Socket.io Server Configuration
echo REACT_APP_SERVER_URL=http://localhost:3002
) > .env

REM 复制到backend目录
copy .env backend\.env >nul

REM 创建必要的目录结构
echo 📁 创建项目结构...
mkdir src\components src\hooks src\services >nul 2>&1
mkdir backend\src\models backend\src\routes backend\src\services >nul 2>&1

echo.
echo 🎉 部署完成！
echo ================================
echo 📍 项目路径: %CD%
echo 🌐 前端地址: http://localhost:3000
echo ⚙️  后端地址: http://localhost:3002
echo.
echo 🚀 启动步骤:
echo 1. 启动后端: cd backend ^&^& npm run dev
echo 2. 启动前端: npm start ^(新命令行窗口^)
echo.
echo ⚠️  注意事项:
echo - 需要配置MongoDB数据库
echo - 可选配置高德地图API密钥
echo - 详细说明请查看 deployment-guide.md
echo.
pause