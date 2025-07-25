# 🚀 AI模拟市场游戏系统 - 源代码文件清单

## 📋 需要创建的核心文件

### 1. 前端配置文件

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### postcss.config.js
```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

module.exports = config;
```

### 2. 前端核心组件

#### src/App.tsx
[参考当前项目中的完整App.tsx文件]

#### src/components/MapComponent.tsx
[参考当前项目中的完整MapComponent.tsx文件]

#### src/components/FinancialChart.tsx
[参考当前项目中的完整FinancialChart.tsx文件]

#### src/components/index.ts
```typescript
export { MapComponent } from './MapComponent';
export { FinancialChart } from './FinancialChart';
```

#### src/hooks/useSocket.ts
[参考当前项目中的完整useSocket.ts文件]

#### src/services/socketService.ts
[参考当前项目中的完整socketService.ts文件]

### 3. 后端核心文件

#### backend/src/server.ts
[参考当前项目中的完整server.ts文件]

#### backend/src/models/
- AIEntity.ts
- Transaction.ts
- GameSession.ts
- ChatLog.ts
- ThoughtProcess.ts

#### backend/src/services/
- AIDecisionEngine.ts
- AIAgent.ts
- AIManager.ts

### 4. 环境配置文件

#### .env (根目录)
```env
# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/ai_market_game
PORT=3002
NODE_ENV=development
REACT_APP_AMAP_API_KEY=YOUR_AMAP_API_KEY_HERE
REACT_APP_SERVER_URL=http://localhost:3002
```

#### backend/.env
```env
# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/ai_market_game
PORT=3002
NODE_ENV=development
```

### 5. TypeScript配置

#### backend/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["es2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "strict": true,
    "rootDir": "src",
    "outDir": "dist",
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 🛠️ 快速部署方法

### 方法一：使用脚本自动部署
```bash
# Linux/macOS
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

### 方法二：手动部署
1. 创建项目目录并初始化
2. 安装依赖包
3. 复制源代码文件
4. 配置环境变量
5. 启动服务

### 方法三：Git克隆 (如果有仓库)
```bash
git clone <repository-url>
cd ai-market-game
npm install
cd backend && npm install
```

## 📚 详细步骤

参考 `deployment-guide.md` 获取完整的部署指南和故障排除方法。