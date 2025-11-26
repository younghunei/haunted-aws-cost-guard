import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Globe, X, Loader, RefreshCw } from 'lucide-react';
import { useHauntedStore } from '../store/hauntedStore';
import { MonthlyCostChart } from './MonthlyCostChart';
import { CostForecastChart } from './CostForecastChart';
import { RegionalCostChart } from './RegionalCostChart';

interface AdvancedAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const {
    monthlyCosts,
    costForecast,
    regionalBreakdown,
    isLoading: globalIsLoading,
    loadAdvancedCostData,
    demoMode
  } = useHauntedStore();

  const [activeTab, setActiveTab] = useState<'monthly' | 'forecast' | 'regional'>('monthly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  
  // 로컬 로딩 상태와 글로벌 로딩 상태를 결합
  const isLoading = localIsLoading || globalIsLoading;

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (isOpen) {
      console.log('🎃 Advanced dashboard opened, loading data...');
      console.log('🎃 Current state before loading:', { 
        localIsLoading, 
        globalIsLoading, 
        demoMode,
        hasData: monthlyCosts.length > 0 || !!costForecast || regionalBreakdown.length > 0
      });
      
      // 이미 데이터가 있으면 로딩하지 않음
      if (monthlyCosts.length > 0 || costForecast || regionalBreakdown.length > 0) {
        console.log('🎃 Data already exists, skipping load');
        return;
      }
      
      setLocalIsLoading(true);
      
      // 안전장치: 10초 후 강제로 로딩 해제
      const timeoutId = setTimeout(() => {
        console.log('🎃 Loading timeout reached, forcing loading to false');
        setLocalIsLoading(false);
      }, 10000);
      
      loadAdvancedCostData()
        .then(() => {
          console.log('🎃 loadAdvancedCostData completed successfully');
        })
        .catch((error) => {
          console.error('🎃 loadAdvancedCostData failed:', error);
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setLocalIsLoading(false);
          console.log('🎃 Local loading finished');
        });
    }
  }, [isOpen, monthlyCosts.length, costForecast, regionalBreakdown.length]);

  // 상태 변화 모니터링
  useEffect(() => {
    console.log('🎃 AdvancedAnalyticsDashboard state changed:', {
      localIsLoading,
      globalIsLoading,
      isLoading,
      monthlyCostsLength: monthlyCosts.length,
      hasCostForecast: !!costForecast,
      regionalBreakdownLength: regionalBreakdown.length,
      demoMode
    });
  }, [localIsLoading, globalIsLoading, isLoading, monthlyCosts, costForecast, regionalBreakdown, demoMode]);

  // 데이터 새로고침
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLocalIsLoading(true);
    try {
      await loadAdvancedCostData();
    } finally {
      setIsRefreshing(false);
      setLocalIsLoading(false);
    }
  };

  // 탭 정보
  const tabs = [
    {
      id: 'monthly' as const,
      label: 'Cost Trends',
      icon: BarChart3,
      emoji: '📊',
      description: 'Cost statistics and trends analysis'
    },
    {
      id: 'forecast' as const,
      label: 'Cost Forecast',
      icon: TrendingUp,
      emoji: '🔮',
      description: 'Projected end-of-month cost analysis'
    },
    {
      id: 'regional' as const,
      label: 'Regional Analysis',
      icon: Globe,
      emoji: '🌍',
      description: 'Cost distribution by region'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-2xl border-2 border-orange-500/50 shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 🎃 할로윈 배경 효과 (Halloween Background Effects) */}
          <div className="absolute inset-0 pointer-events-none">
            {/* 으스스한 안개 효과 */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 rounded-full blur-2xl bg-gradient-radial from-orange-400/10 via-purple-500/10 to-transparent"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  scale: [1, 1.3, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${20 + i * 10}%`
                }}
              />
            ))}
            
            {/* 할로윈 장식 요소들 */}
            <div className="absolute top-4 right-4 text-orange-400/20 text-3xl animate-pulse">🎃</div>
            <div className="absolute bottom-4 left-4 text-purple-400/20 text-2xl animate-bounce">👻</div>
            <div className="absolute top-1/2 left-4 text-orange-400/15 text-xl animate-pulse">🦇</div>
            <div className="absolute top-1/4 right-8 text-purple-400/15 text-xl animate-bounce">🕷️</div>
          </div>

          {/* 헤더 */}
          <div className="relative z-10 p-6 border-b border-orange-500/30 bg-gradient-to-r from-black/60 via-purple-900/40 to-orange-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-3xl"
                >
                  📈
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
                    🎃 Advanced Cost Analytics Dashboard 👻
                  </h2>
                  <p className="text-orange-200/80 text-sm mt-1">
                    {demoMode ? '🎭 Demo Mode' : '🔗 AWS Connected'} | Mystical cost insights through the crystal ball
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* 새로고침 버튼 */}
                <motion.button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all shadow-lg border border-purple-500/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Refresh</span>
                </motion.button>

                {/* 닫기 버튼 */}
                <motion.button
                  onClick={onClose}
                  className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all shadow-lg border border-red-500/50"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex items-center gap-2 mt-6 bg-black/30 rounded-lg p-1 border border-orange-500/30">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500/30 to-purple-500/30 text-orange-300 border border-orange-500/50 shadow-lg'
                      : 'text-orange-200/60 hover:text-orange-300 hover:bg-orange-500/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="relative z-10 p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <motion.div
                  className="flex flex-col items-center gap-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Loader className="w-12 h-12 text-orange-400 animate-spin" />
                  <p className="text-orange-300 font-medium">
                    🔮 The mystical crystal ball is analyzing the data...
                  </p>
                </motion.div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* 탭 설명 */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {tabs.find(tab => tab.id === activeTab)?.emoji}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-orange-300">
                          {tabs.find(tab => tab.id === activeTab)?.label}
                        </h3>
                        <p className="text-orange-200/80 text-sm">
                          {tabs.find(tab => tab.id === activeTab)?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 차트 컨텐츠 */}
                  {activeTab === 'monthly' && (
                    <MonthlyCostChart data={monthlyCosts} isLoading={isLoading} />
                  )}
                  
                  {activeTab === 'forecast' && costForecast && (
                    <CostForecastChart forecast={costForecast} isLoading={isLoading} />
                  )}
                  
                  {activeTab === 'regional' && (
                    <RegionalCostChart data={regionalBreakdown} isLoading={isLoading} />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* 하단 상태 바 */}
          <div className="relative z-10 p-4 border-t border-orange-500/30 bg-gradient-to-r from-black/60 via-purple-900/40 to-orange-900/40">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-lg"
                  >
                    💀
                  </motion.div>
                  <span className="text-orange-200/80">
                    Last updated: {new Date().toLocaleTimeString('en-US')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300 font-medium">
                    Data synchronized
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-orange-200/60">
                <span>🎃 Haunted AWS Cost Guard</span>
                <span>|</span>
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};