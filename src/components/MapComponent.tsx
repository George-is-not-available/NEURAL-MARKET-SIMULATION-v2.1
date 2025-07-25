import React, { useEffect, useRef, useState, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useAIPositions } from '../hooks/useSocket';

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

  useEffect(() => {
    initializeMap();
  }, []);

  // 使用实时数据或模拟数据
  useEffect(() => {
    if (realtimePositions.length > 0) {
      // 使用实时Socket.io数据
      setAiPositions(realtimePositions);
    } else {
      // 使用模拟数据并向服务器发送更新
      const interval = setInterval(() => {
        const updatedPositions = mockAIPositions.map(ai => {
          const newPosition = {
            ...ai,
            lng: ai.lng + (Math.random() - 0.5) * 0.001,
            lat: ai.lat + (Math.random() - 0.5) * 0.001,
            balance: ai.balance + Math.floor((Math.random() - 0.5) * 100),
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

      // 从环境变量获取高德地图API Key
      const apiKey = process.env.REACT_APP_AMAP_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_AMAP_API_KEY_HERE') {
        throw new Error('请配置高德地图API Key到环境变量 REACT_APP_AMAP_API_KEY 中');
      }

      const AMap = await AMapLoader.load({
        key: apiKey,
        version: '2.0',
        plugins: ['AMap.Marker', 'AMap.InfoWindow', 'AMap.Circle'],
      });

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
      setError('地图加载失败，请检查网络连接或API Key配置');
      setIsLoading(false);
    }
  };

  const updateMarkers = useCallback(() => {
    if (!map) return;

    // 清除现有标记
    markers.forEach(marker => {
      map.remove(marker);
    });

    // 创建新标记
    const newMarkers = aiPositions.map(ai => {
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
            $${ai.balance.toLocaleString()}
          </div>
        </div>
      `;

      const marker = new (window as any).AMap.Marker({
        position: [ai.lng, ai.lat],
        content: markerContent,
        offset: new (window as any).AMap.Pixel(-12, -12),
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
                  <span class="text-green-400">$${ai.balance.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>位置:</span>
                  <span class="text-gray-300">${ai.lng.toFixed(6)}, ${ai.lat.toFixed(6)}</span>
                </div>
              </div>
            </div>
          `,
          offset: new (window as any).AMap.Pixel(0, -30),
        });
        infoWindow.open(map, [ai.lng, ai.lat]);
      });

      // 添加范围圈显示AI的活动区域
      const circle = new (window as any).AMap.Circle({
        center: [ai.lng, ai.lat],
        radius: 200, // 200米范围
        strokeColor: ai.color,
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: ai.color,
        fillOpacity: 0.1,
      });

      map.add([marker, circle]);
      return marker;
    });

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
  );
};