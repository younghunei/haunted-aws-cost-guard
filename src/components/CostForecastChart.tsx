import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { CostForecast } from '../store/hauntedStore';
import { format, parseISO } from 'date-fns';

interface CostForecastChartProps {
  forecast: CostForecast;
  isLoading?: boolean;
}

export const CostForecastChart: React.FC<CostForecastChartProps> = ({ forecast, isLoading = false }) => {
  // 🎃 할로윈 색상 팔레트 (Halloween Color Palette)
  const spookyColors = {
    actual: '#10b981',      // 초록색 (실제 비용)
    projected: '#f59e0b',   // 황금색 (예상 비용)
    danger: '#ef4444',      // 빨간색 (위험)
    warning: '#f97316',     // 주황색 (경고)
    ghost: '#8b5cf6'        // 보라색 (유령 효과)
  };

  // 차트 데이터 변환
  const chartData = forecast.dailyProjections.map(item => ({
    date: format(parseISO(item.date), 'MM/dd'),
    fullDate: item.date,
    projected: item.projectedCost,
    actual: item.actualCost || null,
    isActual: !!item.actualCost
  }));

  // 현재 날짜 찾기
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = chartData.findIndex(item => item.fullDate === today);

  // 예측 정확도 계산
  const accuracyColor = forecast.confidence >= 0.8 ? spookyColors.actual : 
                       forecast.confidence >= 0.6 ? spookyColors.warning : 
                       spookyColors.danger;

  // 비용 증가율 계산
  const costIncrease = ((forecast.projectedMonthEndCost - forecast.currentMonthCost) / forecast.currentMonthCost) * 100;

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 rounded-lg border-2 border-orange-500/50 shadow-2xl backdrop-blur-sm"
        >
          <p className="text-orange-300 font-bold mb-2 flex items-center gap-2">
            <span className="text-lg">📅</span>
            {data?.fullDate}
          </p>
          <div className="space-y-1">
            {data?.actual && (
              <p className="text-green-300 text-sm">
                <span className="font-medium">Actual Cost:</span>
                <span className="ml-2 font-bold">${data.actual.toLocaleString()}</span>
              </p>
            )}
            <p className="text-yellow-300 text-sm">
              <span className="font-medium">Projected Cost:</span>
              <span className="ml-2 font-bold">${data?.projected?.toLocaleString()}</span>
            </p>
          </div>
          {data?.isActual && (
            <div className="mt-2 pt-2 border-t border-orange-500/30">
              <p className="text-orange-200 text-xs">✅ Actual Data</p>
            </div>
          )}
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
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl border-2 border-orange-500/40 p-6 shadow-2xl relative overflow-hidden"
    >
      {/* 🎃 할로윈 배경 효과 (Halloween Background Effects) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 right-2 text-orange-400/20 text-2xl animate-pulse">🔮</div>
        <div className="absolute bottom-2 left-2 text-purple-400/20 text-xl animate-bounce">⚡</div>
        
        {/* 으스스한 안개 효과 */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-2xl"
          >
            🔮
          </motion.div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              End-of-Month Cost Forecast 🌙
            </h3>
            <p className="text-orange-200/80 text-sm">
              Future costs predicted by the mystical crystal ball
            </p>
          </div>
        </div>

        {/* 예측 신뢰도 */}
        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-black/30"
          style={{ 
            borderColor: `${accuracyColor}50`,
            backgroundColor: `${accuracyColor}10`
          }}
          whileHover={{ scale: 1.05 }}
        >
          <Target className="w-4 h-4" style={{ color: accuracyColor }} />
          <span className="text-sm font-medium" style={{ color: accuracyColor }}>
            Confidence {(forecast.confidence * 100).toFixed(0)}%
          </span>
        </motion.div>
      </div>

      {/* 주요 지표 카드들 */}
      <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
        {/* 현재 비용 */}
        <motion.div
          className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-4 border border-green-500/30"
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💰</span>
            <span className="text-green-300 text-sm font-medium">Current Cost</span>
          </div>
          <p className="text-green-200 text-2xl font-bold">
            ${forecast.currentMonthCost.toLocaleString()}
          </p>
        </motion.div>

        {/* 예상 월말 비용 */}
        <motion.div
          className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-lg p-4 border border-yellow-500/30"
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <span className="text-yellow-300 text-sm font-medium">Projected EOM</span>
          </div>
          <p className="text-yellow-200 text-2xl font-bold">
            ${forecast.projectedMonthEndCost.toLocaleString()}
          </p>
        </motion.div>

        {/* 증가율 */}
        <motion.div
          className={`bg-gradient-to-br rounded-lg p-4 border ${
            costIncrease > 20 
              ? 'from-red-900/30 to-red-800/20 border-red-500/30'
              : costIncrease > 10
              ? 'from-orange-900/30 to-orange-800/20 border-orange-500/30'
              : 'from-blue-900/30 to-blue-800/20 border-blue-500/30'
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            {costIncrease > 20 ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : costIncrease > 10 ? (
              <TrendingUp className="w-5 h-5 text-orange-400" />
            ) : (
              <Zap className="w-5 h-5 text-blue-400" />
            )}
            <span className={`text-sm font-medium ${
              costIncrease > 20 ? 'text-red-300' : 
              costIncrease > 10 ? 'text-orange-300' : 'text-blue-300'
            }`}>
              Growth Rate
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            costIncrease > 20 ? 'text-red-200' : 
            costIncrease > 10 ? 'text-orange-200' : 'text-blue-200'
          }`}>
            +{costIncrease.toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* 차트 */}
      <div className="h-80 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#f97316"
              fontSize={12}
              fontWeight="bold"
            />
            <YAxis 
              stroke="#f97316"
              fontSize={12}
              fontWeight="bold"
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 오늘 날짜 표시 */}
            {todayIndex >= 0 && (
              <ReferenceLine 
                x={chartData[todayIndex]?.date} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: "Today", position: "top", fill: "#ef4444", fontSize: 12, fontWeight: "bold" }}
              />
            )}
            
            {/* 실제 비용 라인 */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke={spookyColors.actual}
              strokeWidth={3}
              dot={{ fill: spookyColors.actual, strokeWidth: 2, r: 4 }}
              connectNulls={false}
              name="Actual Cost"
            />
            
            {/* 예상 비용 라인 */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke={spookyColors.projected}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: spookyColors.projected, strokeWidth: 2, r: 3 }}
              name="Projected Cost"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 하단 경고 메시지 */}
      {costIncrease > 15 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg border border-red-500/50 relative z-10"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ⚠️
            </motion.div>
            <p className="text-red-300 text-sm font-medium">
              <strong>Evil Spirit Warning!</strong> This month's costs are expected to increase by {costIncrease.toFixed(1)}%. 
              Consider cost optimization! 👻
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};