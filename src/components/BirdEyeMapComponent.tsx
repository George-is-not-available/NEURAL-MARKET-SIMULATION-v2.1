import React, { useEffect, useState, useRef } from 'react';
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

interface BirdEyeMapComponentProps {
  className?: string;
}

// 示例AI位置数据
const mockAIPositions: AIPosition[] = [
  { id: 'ai1', name: 'Alex Trader', lng: 116.397428, lat: 39.90923, status: 'trading', balance: 12500, color: '#10b981' },
  { id: 'ai2', name: 'Sam Business', lng: 116.405285, lat: 39.904989, status: 'active', balance: 8900, color: '#3b82f6' },
  { id: 'ai3', name: 'Jordan Investor', lng: 116.395645, lat: 39.913423, status: 'thinking', balance: 15200, color: '#8b5cf6' },
  { id: 'ai4', name: 'Riley Entrepreneur', lng: 116.400000, lat: 39.900000, status: 'idle', balance: 7300, color: '#f59e0b' },
  { id: 'ai5', name: 'Morgan Analyst', lng: 116.410000, lat: 39.920000, status: 'active', balance: 11800, color: '#ef4444' },
];

// 北京主要地标和道路
const beijingLandmarks = [
  { name: '天安门广场', lng: 116.397428, lat: 39.90923, type: 'landmark' },
  { name: '故宫', lng: 116.397230, lat: 39.916668, type: 'landmark' },
  { name: '王府井', lng: 116.416357, lat: 39.909865, type: 'landmark' },
  { name: '三里屯', lng: 116.456434, lat: 39.937147, type: 'landmark' },
  { name: '中关村', lng: 116.310316, lat: 39.983497, type: 'landmark' },
];

// 主要道路
const beijingRoads = [
  { name: '长安街', points: [[116.360000, 39.906000], [116.430000, 39.906000]], type: 'main' },
  { name: '二环路', points: [[116.370000, 39.890000], [116.420000, 39.890000], [116.420000, 39.920000], [116.370000, 39.920000]], type: 'ring' },
  { name: '建国门内大街', points: [[116.397428, 39.90923], [116.416357, 39.909865]], type: 'street' },
];

export const BirdEyeMapComponent: React.FC<BirdEyeMapComponentProps> = ({ className }) => {
  const { positions: realtimePositions, updatePosition } = useAIPositions();
  const [aiPositions, setAiPositions] = useState<AIPosition[]>(mockAIPositions);
  const [selectedAI, setSelectedAI] = useState<AIPosition | null>(null);
  const [mapCenter, setMapCenter] = useState({ lng: 116.397428, lat: 39.90923 });
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStart, setAnimationStart] = useState(0);
  const [animationDuration] = useState(300); // 300ms
  const [targetCenter, setTargetCenter] = useState({ lng: 116.397428, lat: 39.90923 });
  const [startCenter, setStartCenter] = useState({ lng: 116.397428, lat: 39.90923 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 坐标转换函数 - 将经纬度转换为画布坐标
  const lngLatToCanvas = (lng: number, lat: number, canvasWidth: number, canvasHeight: number) => {
    const scale = Math.pow(2, zoomLevel);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // 简化的墨卡托投影
    const x = centerX + (lng - mapCenter.lng) * scale * 10000;
    const y = centerY - (lat - mapCenter.lat) * scale * 10000;
    
    return { x, y };
  };

  // 绘制地图
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景 - 模拟卫星图的效果
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, '#1a2332');
    gradient.addColorStop(0.5, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制网格线（模拟经纬线）
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // 绘制地标建筑
    beijingLandmarks.forEach(landmark => {
      const pos = lngLatToCanvas(landmark.lng, landmark.lat, width, height);
      
      if (pos.x >= 0 && pos.x <= width && pos.y >= 0 && pos.y <= height) {
        // 绘制建筑物
        ctx.fillStyle = '#475569';
        ctx.fillRect(pos.x - 8, pos.y - 8, 16, 16);
        
        // 绘制建筑物阴影
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(pos.x - 8 + 2, pos.y - 8 + 2, 16, 16);
        
        // 绘制建筑物顶部
        ctx.fillStyle = '#64748b';
        ctx.fillRect(pos.x - 8, pos.y - 8, 16, 16);
        
        // 绘制地标名称
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(landmark.name, pos.x, pos.y - 12);
      }
    });

    // 绘制道路
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    beijingRoads.forEach(road => {
      if (road.points.length >= 2) {
        ctx.beginPath();
        const startPos = lngLatToCanvas(road.points[0][0], road.points[0][1], width, height);
        ctx.moveTo(startPos.x, startPos.y);
        
        for (let i = 1; i < road.points.length; i++) {
          const pos = lngLatToCanvas(road.points[i][0], road.points[i][1], width, height);
          ctx.lineTo(pos.x, pos.y);
        }
        
        ctx.stroke();
      }
    });

    // 绘制AI代理
    aiPositions.forEach(ai => {
      const pos = lngLatToCanvas(ai.lng, ai.lat, width, height);
      
      if (pos.x >= 0 && pos.x <= width && pos.y >= 0 && pos.y <= height) {
        // 绘制活动范围圆圈
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
        ctx.fillStyle = ai.color + '20';
        ctx.fill();
        ctx.strokeStyle = ai.color + '80';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 绘制AI代理点
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = ai.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制脉冲效果
        const pulseRadius = 15 + Math.sin(Date.now() * 0.005) * 5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = ai.color + '60';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 绘制AI信息面板
        const panelWidth = 140;
        const panelHeight = 60;
        const panelX = pos.x + 15;
        const panelY = pos.y - 30;

        // 确保面板在画布内
        const finalPanelX = Math.min(Math.max(panelX, 0), width - panelWidth);
        const finalPanelY = Math.min(Math.max(panelY, 0), height - panelHeight);

        // 绘制面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(finalPanelX, finalPanelY, panelWidth, panelHeight);
        
        // 绘制面板边框
        ctx.strokeStyle = ai.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(finalPanelX, finalPanelY, panelWidth, panelHeight);

        // 绘制连接线
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(finalPanelX, finalPanelY + panelHeight / 2);
        ctx.strokeStyle = ai.color + '80';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 绘制AI信息
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(ai.name, finalPanelX + 5, finalPanelY + 15);
        
        ctx.font = '10px Arial';
        ctx.fillStyle = getStatusColor(ai.status);
        ctx.fillText(`状态: ${getStatusText(ai.status)}`, finalPanelX + 5, finalPanelY + 30);
        
        ctx.fillStyle = '#10b981';
        ctx.fillText(`余额: $${ai.balance.toLocaleString()}`, finalPanelX + 5, finalPanelY + 45);
      }
    });

    // 绘制比例尺
    drawScale(ctx, width, height);
    
    // 绘制指北针
    drawCompass(ctx, width, height);
  };

  // 绘制比例尺
  const drawScale = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const scaleLength = 100;
    const scaleX = 20;
    const scaleY = height - 30;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleLength, scaleY);
    ctx.stroke();

    // 刻度线
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 5);
    ctx.lineTo(scaleX, scaleY + 5);
    ctx.moveTo(scaleX + scaleLength, scaleY - 5);
    ctx.lineTo(scaleX + scaleLength, scaleY + 5);
    ctx.stroke();

    // 比例尺标签
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('1km', scaleX + scaleLength / 2, scaleY + 20);
  };

  // 绘制指北针
  const drawCompass = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const compassX = width - 50;
    const compassY = 50;
    const compassRadius = 25;

    // 外圆
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 指针
    ctx.beginPath();
    ctx.moveTo(compassX, compassY);
    ctx.lineTo(compassX, compassY - compassRadius + 5);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    // N标记
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', compassX, compassY - compassRadius - 5);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'trading': return '#3b82f6';
      case 'thinking': return '#8b5cf6';
      case 'idle': return '#f59e0b';
      case 'bankrupt': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'trading': return '交易中';
      case 'thinking': return '思考中';
      case 'idle': return '空闲';
      case 'bankrupt': return '破产';
      default: return '未知';
    }
  };

  // 处理鼠标按下
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 检查是否点击了AI代理
    for (const ai of aiPositions) {
      const pos = lngLatToCanvas(ai.lng, ai.lat, canvas.width, canvas.height);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      
      if (distance <= 25) {
        setSelectedAI(ai);
        return;
      }
    }

    // 开始拖拽
    setIsDragging(true);
    setDragStart({ x, y });
    setLastPanPosition({ x, y });
    setSelectedAI(null);
  };

  // 处理鼠标移动
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const deltaX = x - lastPanPosition.x;
    const deltaY = y - lastPanPosition.y;

    // 计算地图中心的新位置
    const scale = Math.pow(2, zoomLevel);
    const lngDelta = -deltaX / (scale * 10000);
    const latDelta = deltaY / (scale * 10000);

    const newCenter = {
      lng: mapCenter.lng + lngDelta,
      lat: mapCenter.lat + latDelta
    };

    setMapCenter(newCenter);
    setTargetCenter(newCenter);
    setStartCenter(newCenter);

    setLastPanPosition({ x, y });
  };

  // 处理鼠标松开
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 处理鼠标离开画布
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 处理触摸事件（移动设备支持）
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
    setLastPanPosition({ x, y });
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const deltaX = x - lastPanPosition.x;
    const deltaY = y - lastPanPosition.y;

    const scale = Math.pow(2, zoomLevel);
    const lngDelta = -deltaX / (scale * 10000);
    const latDelta = deltaY / (scale * 10000);

    const newCenter = {
      lng: mapCenter.lng + lngDelta,
      lat: mapCenter.lat + latDelta
    };

    setMapCenter(newCenter);
    setTargetCenter(newCenter);
    setStartCenter(newCenter);

    setLastPanPosition({ x, y });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 动画到指定中心点
  const animateToCenter = (newCenter: { lng: number; lat: number }) => {
    setStartCenter(mapCenter);
    setTargetCenter(newCenter);
    setIsAnimating(true);
    setAnimationStart(Date.now());
  };

  // 缓动函数
  const easeOutQuad = (t: number): number => {
    return t * (2 - t);
  };

  // 更新动画
  const updateAnimation = () => {
    if (!isAnimating) return;

    const now = Date.now();
    const elapsed = now - animationStart;
    const progress = Math.min(elapsed / animationDuration, 1);

    if (progress >= 1) {
      setMapCenter(targetCenter);
      setIsAnimating(false);
      return;
    }

    const easedProgress = easeOutQuad(progress);
    const currentCenter = {
      lng: startCenter.lng + (targetCenter.lng - startCenter.lng) * easedProgress,
      lat: startCenter.lat + (targetCenter.lat - startCenter.lat) * easedProgress
    };

    setMapCenter(currentCenter);
  };

  // 使用实时数据或模拟数据
  useEffect(() => {
    if (realtimePositions.length > 0) {
      setAiPositions(realtimePositions);
    } else {
      const interval = setInterval(() => {
        const updatedPositions = mockAIPositions.map(ai => {
          const newPosition = {
            ...ai,
            lng: ai.lng + (Math.random() - 0.5) * 0.001,
            lat: ai.lat + (Math.random() - 0.5) * 0.001,
            balance: ai.balance + Math.floor((Math.random() - 0.5) * 100),
            status: Math.random() > 0.8 ? 
              (['active', 'trading', 'thinking', 'idle'] as const)[Math.floor(Math.random() * 4)] : 
              ai.status
          };
          
          updatePosition(newPosition);
          return newPosition;
        });
        
        setAiPositions(updatedPositions);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [realtimePositions, updatePosition]);

  // 绘制地图
  useEffect(() => {
    drawMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiPositions, mapCenter, zoomLevel]);

  // 动画循环
  useEffect(() => {
    const animate = () => {
      updateAnimation();
      drawMap();
      requestAnimationFrame(animate);
    };
    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`${className} relative bg-gray-900 rounded-lg border border-cyan-500/30 overflow-hidden`}>
      {/* 控制面板 */}
      <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-cyan-400 font-bold">鸟瞰图</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 10))}
              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
            >
              -
            </button>
            <span className="text-white text-sm w-8 text-center">{zoomLevel}</span>
            <button
              onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 20))}
              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
            >
              +
            </button>
          </div>
          <button
            onClick={() => animateToCenter({ lng: 116.397428, lat: 39.90923 })}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-xs"
            title="重置视图"
          >
            重置
          </button>
          <div className="text-xs text-gray-400">
            在线: {aiPositions.filter(ai => ai.status !== 'bankrupt').length}/{aiPositions.length}
          </div>
        </div>
      </div>

      {/* 地图画布 */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ width: '100%', height: '100%' }}
      />

      {/* 选中AI的详细信息 */}
      {selectedAI && (
        <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/30 max-w-xs">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-lg font-bold text-cyan-400">选中代理</h4>
            <button
              onClick={() => setSelectedAI(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">名称:</span>
              <span className="text-white font-medium">{selectedAI.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">状态:</span>
              <span style={{ color: getStatusColor(selectedAI.status) }}>
                {getStatusText(selectedAI.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">余额:</span>
              <span className="text-green-400">${selectedAI.balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">坐标:</span>
              <span className="text-yellow-400 font-mono text-xs">
                {selectedAI.lng.toFixed(4)}, {selectedAI.lat.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30">
        <div className="text-xs text-cyan-400 mb-2 font-bold">图例</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-gray-600 rounded"></div>
            <span className="text-gray-300">地标建筑</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-1 bg-gray-500"></div>
            <span className="text-gray-300">道路</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-300">AI代理</span>
          </div>
        </div>
      </div>
    </div>
  );
};