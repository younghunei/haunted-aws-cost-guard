import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { MonthlyCost } from '../store/hauntedStore';

interface MonthlyCostChartProps {
  data: MonthlyCost[];
  isLoading?: boolean;
}

export const MonthlyCostChart: React.FC<MonthlyCostChartProps> = ({ data, isLoading = false }) => {
  // 디버깅을 위한 로그
  console.log('🎃 MonthlyCostChart received data:', data);
  console.log('🎃 MonthlyCostChart isLoading:', isLoading);
  
  // 🎃 12개월 영어 이름 배열 (12 months in English)
  const englishMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // 🎃 12개월 전체 데이터 생성 - 빈 월은 0으로 채우기 (Generate full 12-month data - fill missing months with 0)
  const generateFullYearData = () => {
    const fullYearData = [];
    const currentYear = new Date().getFullYear();
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthNumber = monthIndex + 1;
      const monthKey = `${currentYear}-${monthNumber.toString().padStart(2, '0')}`;
      
      // 해당 월의 데이터 찾기
      const existingData = data.find(item => item.month === monthKey);
      
      if (existingData) {
        // 기존 데이터가 있으면 사용
        fullYearData.push({
          month: englishMonthNames[monthIndex],
          totalCost: existingData.cost,
          EC2: existingData.services.EC2 || 0,
          S3: existingData.services.S3 || 0,
          RDS: existingData.services.RDS || 0,
          Lambda: existingData.services.Lambda || 0,
          CloudFront: existingData.services.CloudFront || 0,
          DynamoDB: existingData.services.DynamoDB || 0
        });
      } else {
        // 데이터가 없으면 0으로 채우기
        fullYearData.push({
          month: englishMonthNames[monthIndex],
          totalCost: 0,
          EC2: 0,
          S3: 0,
          RDS: 0,
          Lambda: 0,
          CloudFront: 0,
          DynamoDB: 0
        });
      }
    }
    
    return fullYearData;
  };

  const chartData = generateFullYearData();

  // 트렌드 계산
  const calculateTrend = () => {
    if (data.length < 2) return 'stable';
    const lastMonth = data[data.length - 1].cost;
    const previousMonth = data[data.length - 2].cost;
    const change = ((lastMonth - previousMonth) / previousMonth) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  };

  const trend = calculateTrend();
  const latestCost = data[data.length - 1]?.cost || 0;
  const previousCost = data[data.length - 2]?.cost || 0;
  const changePercent = previousCost > 0 ? ((latestCost - previousCost) / previousCost) * 100 : 0;

  // 데이터가 없을 때 처리
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl border-2 border-orange-500/40 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👻</div>
          <h3 className="text-xl font-bold text-orange-300 mb-2">
            No data available yet
          </h3>
          <p className="text-orange-200/80">
            Loading monthly cost data...
          </p>
        </div>
      </motion.div>
    );
  }

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
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-xl border-2 border-orange-500/40 p-6 shadow-2xl relative overflow-hidden"
    >
      {/* 🎃 할로윈 배경 효과 (Halloween Background Effects) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 right-2 text-orange-400/20 text-2xl animate-pulse">🎃</div>
        <div className="absolute bottom-2 left-2 text-purple-400/20 text-xl animate-bounce">👻</div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-2xl"
          >
            📊
          </motion.div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              Cost Trends 👻
            </h3>
            <p className="text-orange-200/80 text-sm">
              Spooky cost statistics throughout the year
            </p>
          </div>
        </div>

        {/* 트렌드 표시 */}
        <motion.div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            trend === 'increasing' 
              ? 'bg-red-900/30 border-red-500/50 text-red-300'
              : trend === 'decreasing'
              ? 'bg-green-900/30 border-green-500/50 text-green-300'
              : 'bg-blue-900/30 border-blue-500/50 text-blue-300'
          }`}
          whileHover={{ scale: 1.05 }}
        >
          {trend === 'increasing' ? (
            <TrendingUp className="w-4 h-4" />
          ) : trend === 'decreasing' ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </motion.div>
      </div>

      {/* 비용 통계 카드들 */}
      <div className="relative z-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Monthly Cost */}
          <motion.div
            className="bg-gradient-to-br from-purple-900/50 to-orange-900/30 rounded-xl border border-orange-500/30 p-6 backdrop-blur-sm"
            whileHover={{ scale: 1.02, borderColor: '#f97316' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📊</div>
              <h4 className="text-lg font-bold text-orange-300">Average Monthly Cost</h4>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-200 mb-2">
                ${data.length > 0 ? (data.reduce((sum, item) => sum + item.cost, 0) / data.length).toLocaleString() : '0'}
              </p>
              <p className="text-orange-200/60 text-sm">
                Based on {data.length} months of data
              </p>
            </div>
          </motion.div>

          {/* Highest Cost */}
          <motion.div
            className="bg-gradient-to-br from-red-900/50 to-orange-900/30 rounded-xl border border-red-500/30 p-6 backdrop-blur-sm"
            whileHover={{ scale: 1.02, borderColor: '#ef4444' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📈</div>
              <h4 className="text-lg font-bold text-red-300">Highest Cost</h4>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-200 mb-2">
                ${data.length > 0 ? Math.max(...data.map(item => item.cost)).toLocaleString() : '0'}
              </p>
              <p className="text-red-200/60 text-sm">
                Peak spending month
              </p>
            </div>
          </motion.div>

          {/* Lowest Cost */}
          <motion.div
            className="bg-gradient-to-br from-green-900/50 to-purple-900/30 rounded-xl border border-green-500/30 p-6 backdrop-blur-sm"
            whileHover={{ scale: 1.02, borderColor: '#10b981' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📉</div>
              <h4 className="text-lg font-bold text-green-300">Lowest Cost</h4>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-200 mb-2">
                ${data.length > 0 ? Math.min(...data.map(item => item.cost)).toLocaleString() : '0'}
              </p>
              <p className="text-green-200/60 text-sm">
                Most efficient month
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};