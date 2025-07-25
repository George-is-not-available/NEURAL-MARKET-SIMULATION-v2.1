 import React, { useEffect, useRef, useState, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useAIPositions } from '../hooks/useSocket';
import { MockMapComponent } from './MockMapComponent';
import { BirdEyeMapComponent } from './BirdEyeMapComponent';
import { ErrorBoundary } from './ErrorBoundary';

// 扩展window对象类型
declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJSCode?: string;
      serviceHost?: string;
    };
  }
}

interface AIPosition {
  id: string;
  name: string;
  lng: number;
  lat: number;
  status: 'active' | 'trading' | 'thinking' | 'idle' | 'bankrupt';
  balance: number;
  color: string;
}

interface MapComponentProps {
  className?: string;
}

// 示例AI位置数据 - 在实际应用中这些数据会来自Socket.io实时更新
const mockAIPositions: AIPosition[] = [
  { id: 'ai1', name: 'Alex Trader', lng: 116.397428, lat: 39.90923, status: 'trading', balance: 12500, color: '#10b981' },
  { id: 'ai2', name: 'Sam Business', lng: 116.405285, lat: 39.904989, status: 'active', balance: 8900, color: '#3b82f6' },
  { id: 'ai3', name: 'Jordan Investor', lng: 116.395645, lat: 39.913423, status: 'thinking', balance: 15200, color: '#8b5cf6' },
  { id: 'ai4', name: 'Riley Entrepreneur', lng: 116.400000, lat: 39.900000, status: 'idle', balance: 7300, color: '#f59e0b' },
  { id: 'ai5', name: 'Morgan Analyst', lng: 116.410000, lat: 39.920000, status: 'active', balance: 11800, color: '#ef4444' },
];

export const MapComponent: React.FC<MapComponentProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const { positions: realtimePositions, updatePosition } = useAIPositions();
  const [aiPositions, setAiPositions] = useState<AIPosition[]>(mockAIPositions);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockMap, setUseMockMap] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'list' | 'bird' | 'real'>('bird');

  // 安全的 AMap Pixel 创建函数
  const createSafePixel = (x: number, y: number) => {
    const safeX = typeof x === 'number' && !isNaN(x) && isFinite(x) ? x : 0;
    const safeY = typeof y === 'number' && !isNaN(y) && isFinite(y) ? y : 0;
    return new (window as any).AMap.Pixel(safeX, safeY);
  };

  useEffect(() => {
    initializeMap();
    
    // 清理函数，在组件卸载时销毁地图
    return () => {
      if (map) {
        map.destroy();
        console.log('🗺️ 地图已销毁');
      }
    };
  }, []);

  // 使用实时数据或模拟数据
  useEffect(() => {
    if (realtimePositions.length > 0) {
      // 使用实时Socket.io数据，但需要验证数据
      const validatedPositions = realtimePositions.map(pos => ({
        ...pos,
        lng: typeof pos.lng === 'number' && !isNaN(pos.lng) ? pos.lng : 116.397428,
        lat: typeof pos.lat === 'number' && !isNaN(pos.lat) ? pos.lat : 39.90923,
        balance: typeof pos.balance === 'number' && !isNaN(pos.balance) ? pos.balance : 0
      }));
      setAiPositions(validatedPositions);
    } else {
      // 使用模拟数据并向服务器发送更新
      const interval = setInterval(() => {
        const updatedPositions = mockAIPositions.map(ai => {
          // 验证原始数据
          const baseLng = typeof ai.lng === 'number' && !isNaN(ai.lng) ? ai.lng : 116.397428;
          const baseLat = typeof ai.lat === 'number' && !isNaN(ai.lat) ? ai.lat : 39.90923;
          const baseBalance = typeof ai.balance === 'number' && !isNaN(ai.balance) ? ai.balance : 10000;
          
          // 生成新位置时进行进一步验证
          const lngDelta = (Math.random() - 0.5) * 0.001;
          const latDelta = (Math.random() - 0.5) * 0.001;
          const balanceDelta = Math.floor((Math.random() - 0.5) * 100);
          
          const newLng = baseLng + lngDelta;
          const newLat = baseLat + latDelta;
          const newBalance = Math.max(0, baseBalance + balanceDelta);
          
          const newPosition = {
            ...ai,
            lng: isNaN(newLng) ? baseLng : newLng,
            lat: isNaN(newLat) ? baseLat : newLat,
            balance: isNaN(newBalance) ? baseBalance : newBalance,
            status: Math.random() > 0.7 ? 
              (['active', 'trading', 'thinking', 'idle'] as const)[Math.floor(Math.random() * 4)] : 
              ai.status
          };
          
          // 发送位置更新到服务器
          updatePosition(newPosition);
          
          return newPosition;
        });
        
        setAiPositions(updatedPositions);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [realtimePositions, updatePosition]);

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 高德API Key格式验证
      const isValidApiKey = (key: string) => {
        return key && key.length === 32 && /^[a-f0-9]{32}$/i.test(key);
      };
      
      // 高德安全密钥格式验证
      const isValidSecurityKey = (key: string) => {
        return key && key.length === 32 && /^[a-f0-9]{32}$/i.test(key);
      };

      // 从环境变量获取高德地图API Key和安全密钥
      const apiKey = process.env.REACT_APP_AMAP_API_KEY;
      const securityKey = process.env.REACT_APP_AMAP_SECURITY_KEY;
      
      if (!apiKey || apiKey === 'YOUR_AMAP_API_KEY_HERE' || !isValidApiKey(apiKey)) {
        console.log('AMap API Key 未配置或格式错误，使用模拟地图组件');
        setUseMockMap(true);
        setIsLoading(false);
        return;
      }
      
      if (securityKey && !isValidSecurityKey(securityKey)) {
        console.warn('⚠️ 安全密钥格式错误，使用模拟地图');
        setUseMockMap(true);
        setIsLoading(false);
        return;
      }

      // 设置安全密钥 - 环境区分配置
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      
      if (isDevelopment && securityKey) {
        // 开发环境：使用明文方式（仅在安全上下文中）
        if (isSecureContext) {
          window._AMapSecurityConfig = {
            securityJSCode: securityKey,
          };
          console.log('💡 开发环境：使用明文安全密钥配置（安全上下文）');
        } else {
          console.warn('⚠️ 非安全上下文，不允许使用明文安全密钥');
          setUseMockMap(true);
          setIsLoading(false);
          return;
        }
      } else if (!isDevelopment) {
        // 生产环境：使用代理服务器（推荐）
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
        window._AMapSecurityConfig = {
          serviceHost: `${apiBaseUrl}/_AMapService`,
        };
        console.log('🔒 生产环境：使用代理服务器安全配置');
      } else {
        // 如果没有密钥，使用模拟地图
        console.log('⚠️ 无安全密钥，切换到模拟地图');
        setUseMockMap(true);
        setIsLoading(false);
        return;
      }

      // 添加全局错误处理
      const originalOnError = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        if (source && source.includes('webapi.amap.com')) {
          console.warn('高德地图加载问题，切换到模拟地图');
          setUseMockMap(true);
          setIsLoading(false);
          return true;
        }
        // 处理 Pixel NaN 错误
        if (typeof message === 'string' && message.includes('Invalid Object: Pixel(NaN, NaN)')) {
          console.warn('检测到 AMap Pixel NaN 错误，切换到模拟地图');
          setUseMockMap(true);
          setIsLoading(false);
          return true;
        }
        if (originalOnError) {
          return originalOnError.call(this, message, source, lineno, colno, error);
        }
        return false;
      };

      // 添加超时处理
      const timeout = setTimeout(() => {
        console.warn('高德地图加载超时，切换到模拟地图');
        setUseMockMap(true);
        setIsLoading(false);
      }, 10000);

      const AMap = await AMapLoader.load({
        key: apiKey,
        version: '2.0',
        plugins: ['AMap.Marker', 'AMap.InfoWindow', 'AMap.Circle'],
      });

      clearTimeout(timeout);
      window.onerror = originalOnError;

      if (mapRef.current) {
        const mapInstance = new AMap.Map(mapRef.current, {
          center: [116.397428, 39.90923], // 地图中心点 (北京)
          zoom: 15,
          mapStyle: 'amap://styles/dark', // 深色主题匹配UI
          viewMode: '3D',
          pitch: 45,
        });

        setMap(mapInstance);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('地图初始化失败:', err);
      console.warn('高德地图加载失败，切换到模拟地图');
      setUseMockMap(true);
      setIsLoading(false);
    }
  };

  const updateMarkers = useCallback(() => {
    if (!map) return;

    // 清除现有标记
    markers.forEach(marker => {
      try {
        map.remove(marker);
      } catch (e) {
        console.warn('清除标记失败:', e);
      }
    });

    // 创建新标记
    const newMarkers = aiPositions.map(ai => {
      // 验证并修复经纬度数据
      const lng = typeof ai.lng === 'number' && !isNaN(ai.lng) && isFinite(ai.lng) ? ai.lng : 116.397428;
      const lat = typeof ai.lat === 'number' && !isNaN(ai.lat) && isFinite(ai.lat) ? ai.lat : 39.90923;
      const balance = typeof ai.balance === 'number' && !isNaN(ai.balance) && isFinite(ai.balance) ? ai.balance : 0;
      
      // 添加额外的边界检查
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.warn('无效的经纬度数据:', { lng, lat, name: ai.name });
        return null;
      }
      
      // 创建自定义标记内容
      const markerContent = document.createElement('div');
      markerContent.className = 'ai-marker';
      markerContent.innerHTML = `
        <div class="relative">
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg animate-pulse" 
               style="background-color: ${ai.color}; box-shadow: 0 0 12px ${ai.color}50">
          </div>
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm border border-cyan-500/30">
            ${ai.name}
          </div>
          <div class="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-green-400 text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm border border-green-500/30">
            $${balance.toLocaleString()}
          </div>
        </div>
      `;

      // 创建标记，确保所有数值都是有效的
      const marker = new (window as any).AMap.Marker({
        position: [lng, lat],
        content: markerContent,
        offset: createSafePixel(-12, -12),
      });

      // 添加点击事件
      marker.on('click', () => {
        const infoWindow = new (window as any).AMap.InfoWindow({
          content: `
            <div class="p-4 bg-gray-900 text-white rounded-lg border border-cyan-500/30" style="min-width: 200px;">
              <h3 class="text-lg font-bold text-cyan-400 mb-2">${ai.name}</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>状态:</span>
                  <span class="text-${getStatusColor(ai.status)}-400">${getStatusText(ai.status)}</span>
                </div>
                <div class="flex justify-between">
                  <span>资金:</span>
                  <span class="text-green-400">$${balance.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>位置:</span>
                  <span class="text-gray-300">${lng.toFixed(6)}, ${lat.toFixed(6)}</span>
                </div>
              </div>
            </div>
          `,
          offset: createSafePixel(0, -30),
        });
        infoWindow.open(map, [lng, lat]);
      });

      // 添加范围圈显示AI的活动区域
      const circle = new (window as any).AMap.Circle({
        center: [lng, lat],
        radius: 200, // 200米范围
        strokeColor: ai.color,
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: ai.color,
        fillOpacity: 0.1,
      });

      try {
        map.add([marker, circle]);
        return marker;
      } catch (error) {
        console.error('添加标记失败:', error, { ai: ai.name, lng, lat });
        return null;
      }
    }).filter(marker => marker !== null);

    setMarkers(newMarkers);
  }, [map, aiPositions, markers]);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [map, aiPositions, updateMarkers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'trading': return 'blue';
      case 'thinking': return 'purple';
      case 'idle': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'trading': return '交易中';
      case 'thinking': return '思考中';
      case 'idle': return '空闲';
      default: return '未知';
    }
  };

  // 如果使用模拟地图，根据模式返回相应组件
  if (useMockMap) {
    if (mapViewMode === 'bird') {
      return (
        <div className={className}>
          <div className="bg-gray-800 border-b border-cyan-500/30 px-4 py-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-400">AI 代理实时地图</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">视图模式:</span>
                <button
                  onClick={() => setMapViewMode('list')}
                  className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  列表
                </button>
                <button
                  onClick={() => setMapViewMode('bird')}
                  className="px-3 py-1 rounded text-sm bg-cyan-500 text-white"
                >
                  鸟瞰图
                </button>
                <button
                  onClick={() => setMapViewMode('real')}
                  className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  真实地图
                </button>
              </div>
            </div>
          </div>
          <BirdEyeMapComponent className="h-96" />
        </div>
      );
    } else if (mapViewMode === 'list') {
      return (
        <div className={className}>
          <div className="bg-gray-800 border-b border-cyan-500/30 px-4 py-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-400">AI 代理实时地图</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">视图模式:</span>
                <button
                  onClick={() => setMapViewMode('list')}
                  className="px-3 py-1 rounded text-sm bg-cyan-500 text-white"
                >
                  列表
                </button>
                <button
                  onClick={() => setMapViewMode('bird')}
                  className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  鸟瞰图
                </button>
                <button
                  onClick={() => setMapViewMode('real')}
                  className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  真实地图
                </button>
              </div>
            </div>
          </div>
          <MockMapComponent className="" />
        </div>
      );
    } else {
      // 真实地图模式 - 显示错误提示
      return (
        <div className={className}>
          <div className="bg-gray-800 border-b border-cyan-500/30 px-4 py-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-400">AI 代理实时地图</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">视图模式:</span>
                <button
                  onClick={() => setMapViewMode('list')}
                  className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  列表
                </button>
                <button
                  onClick={() => setMapViewMode('bird')}
                  className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  鸟瞰图
                </button>
                <button
                  onClick={() => {
                    setMapViewMode('real');
                    setUseMockMap(false);
                    initializeMap();
                  }}
                  className="px-3 py-1 rounded text-sm bg-cyan-500 text-white"
                >
                  真实地图
                </button>
              </div>
            </div>
          </div>
          <div className="h-96 bg-gradient-to-br from-red-900/20 to-red-700/20 rounded-lg border border-red-500/30 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 border-2 border-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-red-400 text-2xl">⚠</span>
              </div>
              <p className="text-red-300 font-mono text-sm mb-4">需要配置高德地图API Key才能使用真实地图</p>
              <p className="text-gray-400 text-xs mb-4">请在环境变量中设置 REACT_APP_AMAP_API_KEY</p>
              <button 
                onClick={() => setMapViewMode('bird')}
                className="bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-400 px-4 py-2 rounded font-mono text-xs transition-all duration-300"
              >
                返回鸟瞰图
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (error) {
    return (
      <div className={`${className} bg-gradient-to-br from-red-900/20 to-red-700/20 rounded-lg border border-red-500/30 flex items-center justify-center`}>
        <div className="text-center p-6">
          <div className="w-16 h-16 border-2 border-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-red-400 text-2xl">⚠</span>
          </div>
          <p className="text-red-300 font-mono text-sm">{error}</p>
          <button 
            onClick={initializeMap}
            className="mt-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 px-4 py-2 rounded font-mono text-xs transition-all duration-300"
          >
            重新加载地图
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <div className={`${className} bg-gradient-to-br from-red-900/20 to-red-700/20 rounded-lg border border-red-500/30 flex items-center justify-center`}>
          <div className="text-center p-6">
            <div className="w-16 h-16 border-2 border-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-red-400 text-2xl">⚠</span>
            </div>
            <p className="text-red-300 font-mono text-sm mb-4">地图组件错误，请刷新页面</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 px-4 py-2 rounded font-mono text-xs transition-all duration-300"
            >
              刷新页面
            </button>
          </div>
        </div>
      }
    >
      <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-blue-900/50 rounded-lg border border-cyan-500/20 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-cyan-400 rounded-full flex items-center justify-center mb-4 mx-auto animate-spin">
              <div className="w-8 h-8 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-cyan-300 font-mono">高德地图加载中...</p>
            <p className="text-xs text-gray-400 mt-2">GEOLOCATION SYSTEM INITIALIZING...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* AI位置统计面板 */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3">
        <div className="text-xs text-cyan-400 mb-2 font-mono">AI TRACKING</div>
        <div className="space-y-1">
          {aiPositions.map(ai => (
            <div key={ai.id} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full animate-pulse" 
                style={{ backgroundColor: ai.color }}
              ></div>
              <span className="text-white">{ai.name.split(' ')[0]}</span>
              <span className={`text-${getStatusColor(ai.status)}-400`}>
                {getStatusText(ai.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
};