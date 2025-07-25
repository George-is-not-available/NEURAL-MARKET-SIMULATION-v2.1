# 🚀 AI模拟市场游戏系统 - 本地部署指南

## 📋 系统要求

- **Node.js**: 18.0+ 或 20.0+
- **npm**: 8.0+ 或 **yarn**: 1.22+
- **MongoDB**: 5.0+ (可选择本地安装或使用云服务)
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## 🛠️ 部署步骤

### 第一步：创建项目目录
```bash
mkdir ai-market-game
cd ai-market-game
```

### 第二步：初始化前端项目
```bash
# 创建React TypeScript项目
npx create-react-app . --template typescript

# 安装依赖
npm install tailwindcss@3 postcss@8 autoprefixer@10
npm install @amap/amap-jsapi-loader react-amap
npm install socket.io-client
npm install chart.js react-chartjs-2

# 初始化Tailwind CSS
npx tailwindcss init -p --ts
```

### 第三步：创建后端项目
```bash
# 创建后端目录
mkdir backend
cd backend

# 初始化Node.js项目
npm init -y

# 安装后端依赖
npm install express typescript ts-node nodemon
npm install socket.io mongoose cors dotenv
npm install @types/express @types/cors @types/node

# 创建TypeScript配置
npx tsc --init
```

### 第四步：配置数据库

**选项A: 本地MongoDB安装**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS (使用Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Windows
# 下载并安装: https://www.mongodb.com/try/download/community
```

**选项B: 使用MongoDB Atlas (云数据库)**
1. 访问 https://www.mongodb.com/atlas
2. 创建免费账户和集群
3. 获取连接字符串

### 第五步：配置环境变量

**根目录创建 `.env` 文件:**
```env
# MongoDB Configuration (本地)
MONGO_INNER_HOST=127.0.0.1
MONGO_INNER_PORT=27017
MONGO_PASSWORD=your_password
MONGO_DB=ai_market_game
MONGO_USER=your_username
MONGODB_URI=mongodb://your_username:your_password@127.0.0.1:27017/ai_market_game

# 或者使用MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_market_game

# Server Configuration
PORT=3002
NODE_ENV=development

# Amap API Configuration (可选)
REACT_APP_AMAP_API_KEY=YOUR_AMAP_API_KEY_HERE

# Socket.io Server Configuration
REACT_APP_SERVER_URL=http://localhost:3002
```

**backend目录创建 `.env` 文件:**
```env
# MongoDB Configuration
MONGO_INNER_HOST=127.0.0.1
MONGO_INNER_PORT=27017
MONGO_PASSWORD=your_password
MONGO_DB=ai_market_game
MONGO_USER=your_username
MONGODB_URI=mongodb://your_username:your_password@127.0.0.1:27017/ai_market_game

# Server Configuration
PORT=3002
NODE_ENV=development
```

## 📁 项目结构

```
ai-market-game/
├── public/
├── src/
│   ├── components/
│   │   ├── MapComponent.tsx
│   │   ├── FinancialChart.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   └── useSocket.ts
│   ├── services/
│   │   └── socketService.ts
│   ├── App.tsx
│   └── index.tsx
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   ├── package.json
│   └── .env
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── .env
```

## 🎮 启动系统

### 启动后端服务
```bash
cd backend
npm run dev
```

### 启动前端服务 (新终端)
```bash
npm start
```

### 访问系统
- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:3002

## 🔧 常见问题解决

### 1. 端口冲突
```bash
# 查看端口占用
netstat -ano | findstr :3000  # Windows
lsof -ti:3000                 # macOS/Linux

# 杀死进程
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux
```

### 2. MongoDB连接问题
```bash
# 启动MongoDB服务
sudo systemctl start mongod   # Linux
brew services start mongodb   # macOS
net start MongoDB             # Windows
```

### 3. 依赖安装问题
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 🔑 获取高德地图API Key (可选)

1. 访问 https://console.amap.com
2. 注册账户并登录
3. 创建应用获取API Key
4. 将Key添加到 `.env` 文件

## 🚀 生产环境部署

### 构建生产版本
```bash
# 前端构建
npm run build

# 后端构建
cd backend
npm run build
```

### 使用PM2管理进程
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start backend/dist/server.js --name ai-market-backend
pm2 serve build 3000 --name ai-market-frontend
```

## 📝 注意事项

1. **防火墙设置**: 确保端口3000和3002未被防火墙阻挡
2. **Node版本**: 推荐使用Node.js 18+
3. **内存要求**: 建议至少4GB RAM
4. **数据库**: 生产环境建议使用独立的MongoDB实例

## 🆘 技术支持

如果遇到问题，请检查：
1. Node.js和npm版本
2. 防火墙和端口设置
3. 数据库连接状态
4. 环境变量配置
5. 浏览器控制台错误信息