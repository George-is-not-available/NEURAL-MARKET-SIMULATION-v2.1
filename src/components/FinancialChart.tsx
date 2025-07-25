import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useFinancialUpdates } from '../hooks/useSocket';
import { TimeSelector } from './TimeSelector';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialChartProps {
  className?: string;
}

interface ChartDataPoint {
  time: string;
  totalValue: number;
  agents: { [key: string]: number };
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ className }) => {
  const { financialUpdates, totalMarketValue } = useFinancialUpdates();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timeRangeMinutes, setTimeRangeMinutes] = useState<number>(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 生成模拟历史数据
  useEffect(() => {
    const generateMockData = () => {
      const now = new Date();
      const mockData: ChartDataPoint[] = [];
      const points = 60;
      const intervalMs = timeRangeMinutes * 1000;

      for (let i = points; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMs);
        const baseValue = 45000;
        const variance = Math.sin(i * 0.1) * 5000 + Math.random() * 2000;
        
        mockData.push({
          time: timestamp.toLocaleTimeString(),
          totalValue: baseValue + variance,
          agents: {
            'Alex Trader': 12000 + Math.random() * 2000,
            'Sam Business': 8000 + Math.random() * 1500,
            'Jordan Investor': 15000 + Math.random() * 3000,
            'Riley Entrepreneur': 7000 + Math.random() * 1000,
            'Morgan Analyst': 11000 + Math.random() * 2500,
          }
        });
      }
      
      setChartData(mockData);
    };

    generateMockData();

    // 定期更新数据
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setChartData(prev => {
        const newPoint: ChartDataPoint = {
          time: new Date().toLocaleTimeString(),
          totalValue: totalMarketValue || (45000 + Math.random() * 10000),
          agents: {
            'Alex Trader': 12000 + Math.random() * 2000,
            'Sam Business': 8000 + Math.random() * 1500,
            'Jordan Investor': 15000 + Math.random() * 3000,
            'Riley Entrepreneur': 7000 + Math.random() * 1000,
            'Morgan Analyst': 11000 + Math.random() * 2500,
          }
        };
        
        const maxPoints = 60;
        return [...prev.slice(-(maxPoints - 1)), newPoint];
      });
    }, Math.min(timeRangeMinutes * 50, 5000)); // 更新频率根据时间范围调整，但最快5秒

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeRangeMinutes, totalMarketValue]);

  // 处理实时更新
  useEffect(() => {
    if (financialUpdates.length > 0) {
      const latestUpdate = financialUpdates[financialUpdates.length - 1];
      
      setChartData(prev => {
        if (prev.length === 0) return prev;
        
        const updatedData = [...prev];
        const lastPoint = updatedData[updatedData.length - 1];
        
        // 更新最新数据点中对应AI的资金
        if (lastPoint && lastPoint.agents[latestUpdate.agentName]) {
          lastPoint.agents[latestUpdate.agentName] = latestUpdate.currentBalance;
          lastPoint.totalValue = Object.values(lastPoint.agents).reduce((sum, value) => sum + value, 0);
        }
        
        return updatedData;
      });
    }
  }, [financialUpdates]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            family: 'monospace',
            size: 10,
          },
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#00bcd4',
        bodyColor: '#ffffff',
        borderColor: '#00bcd4',
        borderWidth: 1,
        titleFont: {
          family: 'monospace',
        },
        bodyFont: {
          family: 'monospace',
        },
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 188, 212, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'monospace',
            size: 9,
          },
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(16, 185, 129, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'monospace',
            size: 9,
          },
          callback: function(value) {
            return '$' + (Number(value) / 1000).toFixed(0) + 'K';
          }
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 2,
        hoverRadius: 4,
      },
    },
  };

  const getChartData = (): ChartData<'line'> => {
    if (chartData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = chartData.map(point => point.time);
    
    // 总市值线
    const totalValueData = chartData.map(point => point.totalValue);
    
    // 各AI资金线
    const agentNames = Object.keys(chartData[0]?.agents || {});
    const agentColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
    
    const agentDatasets = agentNames.map((agentName, index) => ({
      label: agentName,
      data: chartData.map(point => point.agents[agentName] || 0),
      borderColor: agentColors[index % agentColors.length],
      backgroundColor: agentColors[index % agentColors.length] + '20',
      fill: false,
      borderWidth: 1.5,
    }));

    return {
      labels,
      datasets: [
        {
          label: 'Total Market Value',
          data: totalValueData,
          borderColor: '#00bcd4',
          backgroundColor: 'rgba(0, 188, 212, 0.1)',
          fill: true,
          borderWidth: 2,
        },
        ...agentDatasets,
      ],
    };
  };

  const getMarketTrend = () => {
    if (chartData.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    
    const change = latest.totalValue - previous.totalValue;
    const percentage = (change / previous.totalValue) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(percentage),
      change: change,
    };
  };

  const trend = getMarketTrend();

  return (
    <div className={`${className} relative bg-gradient-to-br from-black-900/50 to-green-900/20 rounded-lg border border-green-500/20 overflow-hidden`}>
      {/* 时间选择器 */}
      <TimeSelector 
        defaultValue={timeRangeMinutes}
        onTimeChange={setTimeRangeMinutes}
      />

      {/* 市场趋势指示器 */}
      <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-sm border border-green-500/30 rounded px-3 py-2">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-mono ${
            trend.direction === 'up' ? 'text-green-400' : 
            trend.direction === 'down' ? 'text-red-400' : 
            'text-yellow-400'
          }`}>
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '●'}
          </span>
          <span className="text-xs text-white font-mono">
            {trend.percentage.toFixed(2)}%
          </span>
          <span className={`text-xs font-mono ${
            trend.direction === 'up' ? 'text-green-400' : 
            trend.direction === 'down' ? 'text-red-400' : 
            'text-yellow-400'
          }`}>
            ({(trend.change || 0) > 0 ? '+' : ''}${(trend.change || 0).toFixed(0)})
          </span>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="h-full w-full p-4 pt-16">
        {chartData.length > 0 ? (
          <Line data={getChartData()} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-green-400 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-green-300 text-sm font-mono">Loading market data...</p>
            </div>
          </div>
        )}
      </div>

      {/* 数据统计 */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm border border-green-500/30 rounded px-3 py-2">
        <div className="text-xs text-gray-400 font-mono">
          Data Points: {chartData.length} | Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};