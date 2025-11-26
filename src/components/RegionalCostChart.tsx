import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Globe, TrendingUp, TrendingDown, Minus, Eye, BarChart3 } from 'lucide-react';
import { RegionalCostBreakdown } from '../store/hauntedStore';

interface RegionalCostChartProps {
  data: RegionalCostBreakdown[];
  isLoading?: boolean;
}

export const RegionalCostChart: React.FC<RegionalCostChartProps> = ({ data, isLoading = false }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionalCostBreakdown | null>(null);
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');

  // 🎃 할로윈 색상 팔레트 (Halloween Color Palette)
  const spookyColors = [
    '#ff6b35',  // 호박색 (Pumpkin Orange)
    '#8b5cf6',  // 보라색 (Purple)
    '#f59e0b',  // 황금색 (Golden)
    '#ef4444',  // 빨간색 (Red)
    '#10b981',  // 초록색 (Green)
    '#06b6d4',  // 청록색 (Cyan)
    '#f97316',  // 주황색 (Orange)
    '#6366f1',  // 인디고 (Indigo)
  ];

  // 파이 차트용 데이터 변환
  const pieData = data.map((region, index) => ({
    name: region.displayName,
    value: region.totalCost,
    percentage: region.percentage,
    color: spookyColors[index % spookyColors.length],
    region: region.region,
    trend: region.trend
  }));

  // 바 차트용 데이터 변환
  const barData = data.map((region, index) => ({
    name: region.displayName.length > 15 ? 
          region.displayName.substring(0, 15) + '...' : 
          region.displayName,
    fullName: region.displayName,
    cost: region.totalCost,
    percentage: region.percentage,
    color: spookyColors[index % spookyColors.length],
    trend: region.trend
  }));

  // 트렌드 아이콘 반환
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <Minus className="w-4 h-4 text-blue-400" />;
    }
  };

  // 커스텀 파이 차트 툴팁
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 rounded-lg border-2 border-orange-500/50 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <p className="text-orange-300 font-bold">{data.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-white text-sm">
              <span className="font-medium">Cost:</span>
              <span className="ml-2 font-bold">${data.value.toLocaleString()}</span>
            </p>
            <p className="text-white text-sm">
              <span className="font-medium">Percentage:</span>
              <span className="ml-2 font-bold">{data.percentage.toFixed(2)}%</span>
            </p>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(data.trend)}
              <span className="text-xs text-gray-300 capitalize">{data.trend}</span>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // 커스텀 바 차트 툴팁
  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 rounded-lg border-2 border-orange-500/50 shadow-2xl backdrop-blur-sm"
        >
          <p className="text-orange-300 font-bold mb-2">{data.fullName}</p>
          <div className="space-y-1">
            <p className="text-white text-sm">
              <span className="font-medium">Cost:</span>
              <span className="ml-2 font-bold">${data.cost.toLocaleString()}</span>
            </p>
            <p className="text-white text-sm">
              <span className="font-medium">Percentage:</span>
              <span className="ml-2 font-bold">{data.percentage.toFixed(2)}%</span>
            </p>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(data.trend)}
              <span className="text-xs text-gray-300 capitalize">{data.trend}</span>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl border-2 border-orange-500/40 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-orange-500/20 rounded mb-4"></div>
          <div className="h-64 bg-purple-500/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl border-2 border-orange-500/40 p-6 shadow-2xl relative overflow-hidden"
    >
      {/* 🎃 할로윈 배경 효과 (Halloween Background Effects) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 right-2 text-orange-400/20 text-2xl animate-pulse">🌍</div>
        <div className="absolute bottom-2 left-2 text-purple-400/20 text-xl animate-bounce">🦇</div>
        
        {/* 세계 지도 실루엣 효과 */}
        <motion.div
          className="absolute inset-0 opacity-5"
          animate={{
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <div className="w-full h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-xl" 
               style={{
                 maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 50\'%3E%3Cpath d=\'M10,20 Q20,15 30,20 Q40,25 50,20 Q60,15 70,20 Q80,25 90,20\' fill=\'none\' stroke=\'white\' stroke-width=\'2\'/%3E%3C/svg%3E")',
                 maskRepeat: 'repeat'
               }}
          />
        </motion.div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-2xl"
          >
            🌍
          </motion.div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              Regional Cost Analysis 🗺️
            </h3>
            <p className="text-orange-200/80 text-sm">
              Spooky costs spread across the globe
            </p>
          </div>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1 border border-orange-500/30">
          <motion.button
            onClick={() => setViewMode('pie')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'pie' 
                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' 
                : 'text-orange-200/60 hover:text-orange-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-4 h-4" />
            Pie
          </motion.button>
          <motion.button
            onClick={() => setViewMode('bar')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'bar' 
                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' 
                : 'text-orange-200/60 hover:text-orange-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart3 className="w-4 h-4" />
            Bar
          </motion.button>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="h-80 relative z-10">
        <AnimatePresence mode="wait">
          {viewMode === 'pie' ? (
            <motion.div
              key="pie"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={(_, index) => setSelectedRegion(data[index])}
                    onMouseLeave={() => setSelectedRegion(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={selectedRegion?.region === data[index]?.region ? '#fff' : 'none'}
                        strokeWidth={selectedRegion?.region === data[index]?.region ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#f97316"
                    fontSize={10}
                    fontWeight="bold"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#f97316"
                    fontSize={12}
                    fontWeight="bold"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar 
                    dataKey="cost" 
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(data, index) => setSelectedRegion(data[index])}
                    onMouseLeave={() => setSelectedRegion(null)}
                  >
                    {barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 리전 목록 */}
      <div className="mt-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {data.slice(0, 6).map((region, index) => (
            <motion.div
              key={region.region}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedRegion?.region === region.region
                  ? 'bg-orange-500/20 border-orange-500/50'
                  : 'bg-black/20 border-gray-600/30 hover:border-orange-500/30'
              }`}
              whileHover={{ scale: 1.02 }}
              onMouseEnter={() => setSelectedRegion(region)}
              onMouseLeave={() => setSelectedRegion(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: spookyColors[index % spookyColors.length] }}
                  />
                  <div>
                    <p className="text-white text-sm font-medium">
                      {region.displayName.length > 20 ? 
                        region.displayName.substring(0, 20) + '...' : 
                        region.displayName}
                    </p>
                    <p className="text-orange-200/60 text-xs">
                      ${region.totalCost.toLocaleString()} ({region.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                {getTrendIcon(region.trend)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 선택된 리전 상세 정보 */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30 relative z-10"
          >
            <h4 className="text-orange-300 font-bold mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {selectedRegion.displayName} Details
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {selectedRegion.services.slice(0, 3).map((service, index) => (
                <div key={service.service} className="text-center">
                  <p className="text-orange-200/60 text-xs">{service.service}</p>
                  <p className="text-white font-bold text-sm">
                    ${service.cost.toFixed(2)}
                  </p>
                  <p className="text-orange-300 text-xs">
                    {service.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};