# 高德地图React集成指南

## 概述

本文档展示了如何在React项目中集成高德地图JS API，遵循官方推荐的最佳实践。

## 官方推荐的最佳实践

基于高德地图官方文档（2024年04月26日更新），以下是推荐的集成方式：

### 1. 安装依赖

```bash
npm i @amap/amap-jsapi-loader --save
```

### 2. 基础配置

```javascript
// 安全密钥配置
window._AMapSecurityConfig = {
  securityJsCode: "你申请的安全密钥",
};

// 加载地图API
AMapLoader.load({
  key: "你申请的API Key",
  version: "2.0",
  plugins: ["AMap.Scale"],
}).then((AMap) => {
  // 创建地图实例
  map = new AMap.Map("container", {
    viewMode: "3D",
    zoom: 11,
    center: [116.397428, 39.90923],
  });
}).catch(e => {
  console.log(e);
});
```

## 我们的实现方案

### 方案一：简化版组件（推荐入门使用）

```typescript
// src/components/SimpleMapComponent.tsx
import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

export const SimpleMapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    // 安全密钥配置
    window._AMapSecurityConfig = {
      securityJsCode: process.env.REACT_APP_AMAP_SECURITY_KEY || '',
    };

    // 加载地图API
    AMapLoader.load({
      key: process.env.REACT_APP_AMAP_API_KEY || '',
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar'],
    })
      .then((AMap) => {
        map.current = new AMap.Map(mapRef.current, {
          viewMode: '3D',
          zoom: 11,
          center: [116.397428, 39.90923],
        });
      })
      .catch((e) => {
        console.error('地图加载失败:', e);
      });

    // 清理函数
    return () => {
      if (map.current) {
        map.current.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '400px' }}
    />
  );
};
```

### 方案二：企业级组件（当前项目使用）

```typescript
// src/components/MapComponent.tsx - 企业级实现
// 包含以下高级功能：
// - 环境区分配置（开发/生产）
// - 安全上下文验证
// - 错误处理和自动降级
// - 实时数据集成
// - 多层次回退方案
// - 完整的生命周期管理
```

## 使用方式对比

### 简化版使用
```jsx
import { SimpleMapComponent } from './components';

function App() {
  return (
    <div>
      <h1>简单地图示例</h1>
      <SimpleMapComponent />
    </div>
  );
}
```

### 企业级使用
```jsx
import { MapComponent } from './components';

function App() {
  return (
    <div>
      <h1>AI市场仿真游戏</h1>
      <MapComponent className="game-map" />
    </div>
  );
}
```

## 环境配置

### 开发环境 (.env.development)
```bash
REACT_APP_AMAP_API_KEY=your_api_key_here
REACT_APP_AMAP_SECURITY_KEY=your_security_key_here
REACT_APP_API_BASE_URL=http://localhost:3002
```

### 生产环境 (.env.production)
```bash
REACT_APP_AMAP_API_KEY=your_api_key_here
# 生产环境不设置SECURITY_KEY，使用代理服务器
REACT_APP_API_BASE_URL=https://your-production-domain.com
```

## 特性对比

| 特性 | 简化版组件 | 企业级组件 |
|------|-----------|-----------|
| 官方推荐实践 | ✅ | ✅ |
| 基础地图显示 | ✅ | ✅ |
| 生命周期管理 | ✅ | ✅ |
| 错误处理 | 基础 | 高级 |
| 环境区分 | 基础 | 高级 |
| 安全配置 | 基础 | 高级 |
| 实时数据 | ❌ | ✅ |
| 自动降级 | ❌ | ✅ |
| 数据验证 | ❌ | ✅ |
| 代理服务器 | ❌ | ✅ |

## 推荐场景

### 使用简化版组件的场景
- 快速原型开发
- 学习和测试
- 简单的地图展示需求
- 小型项目

### 使用企业级组件的场景
- 生产环境部署
- 复杂的业务逻辑
- 需要高可用性
- 大型项目
- 需要实时数据更新

## 最佳实践建议

1. **开发阶段**：使用简化版组件快速开发和测试
2. **生产部署**：使用企业级组件确保稳定性和安全性
3. **渐进式升级**：从简化版开始，根据需求逐步升级到企业级
4. **环境管理**：严格区分开发和生产环境配置
5. **错误监控**：在生产环境中添加错误监控和报警

## 常见问题

### Q1: 为什么需要两个版本的组件？
A: 简化版遵循官方推荐，便于学习和快速开发；企业级版本在此基础上增加了生产环境所需的安全性和稳定性特性。

### Q2: 如何选择合适的版本？
A: 根据项目复杂度和部署环境选择。简单项目用简化版，复杂生产项目用企业级版本。

### Q3: 两个版本可以同时使用吗？
A: 可以，它们是独立的组件，可以根据不同页面的需求选择使用。

---

*基于高德地图官方文档更新于 2024年04月26日*  
*项目实现版本: v2.0*