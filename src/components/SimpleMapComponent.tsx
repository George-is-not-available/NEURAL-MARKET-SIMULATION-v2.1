import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

interface SimpleMapComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 简化版高德地图组件
 * 完全遵循官方推荐的最佳实践
 * 
 * 基于官方文档: https://lbs.amap.com/api/jsapi-v2/guide/abc/quickstart
 */
export const SimpleMapComponent: React.FC<SimpleMapComponentProps> = ({ 
  className = '', 
  style = { height: '400px' } 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    // 高德地图安全密钥配置
    window._AMapSecurityConfig = {
      securityJSCode: process.env.REACT_APP_AMAP_SECURITY_KEY || '',
    };

    // 加载高德地图 API
    AMapLoader.load({
      key: process.env.REACT_APP_AMAP_API_KEY || '', // 申请好的Web端开发者Key
      version: '2.0', // 指定要加载的 JSAPI 的版本
      plugins: ['AMap.Scale', 'AMap.ToolBar'], // 需要使用的插件列表
    })
      .then((AMap) => {
        // 创建地图实例
        map.current = new AMap.Map(mapRef.current, {
          viewMode: '3D', // 是否为3D地图模式
          zoom: 11, // 初始化地图级别
          center: [116.397428, 39.90923], // 初始化地图中心点位置（北京）
        });

        // 添加比例尺控件
        const scale = new AMap.Scale({
          position: {
            top: '10px',
            right: '10px',
          },
        });
        map.current.addControl(scale);

        // 添加工具条控件
        const toolbar = new AMap.ToolBar({
          position: {
            top: '10px',
            right: '40px',
          },
        });
        map.current.addControl(toolbar);

        console.log('🗺️ 高德地图加载成功');
      })
      .catch((e) => {
        console.error('🗺️ 高德地图加载失败:', e);
      });

    // 清理函数，在组件卸载时销毁地图
    return () => {
      if (map.current) {
        map.current.destroy();
        console.log('🗺️ 地图已销毁');
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className={`amap-container ${className}`}
      style={{
        width: '100%',
        ...style,
      }}
    />
  );
};

export default SimpleMapComponent;