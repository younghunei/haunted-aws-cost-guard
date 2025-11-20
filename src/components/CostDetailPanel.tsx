import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, AlertCircle, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CostDetailPanelProps {
  service: {
    service: string;
    displayName: string;
    totalCost: number;
    currency: string;
    budgetUtilization: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    regions: Array<{ region: string; cost: number; percentage: number }>;
    tags: Array<{ key: string; value: string; cost: number; percentage: number }>;
    dailyCosts: Array<{ date: string; cost: number }>;
  };
  onClose: () => void;
}

export const CostDetailPanel: React.FC<CostDetailPanelProps> = ({ service, onClose }) => {
  // Use actual daily cost data (default if none)
  const dailyCosts = service.dailyCosts && service.dailyCosts.length > 0 
    ? service.dailyCosts.map(item => ({
        date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
        cost: Math.round(item.cost * 100) / 100
      }))
    : [
        { date: 'Today', cost: service.totalCost }
      ];

  // Use actual region data - only show services with regions
  const regions = service.regions && service.regions.length > 0 
    ? service.regions
        .filter(region => region.cost > 0) // Only regions with actual costs
        .sort((a, b) => b.cost - a.cost) // Sort by cost
    : [];

  const getTrendIcon = () => {
    switch (service.trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (service.budgetUtilization <= 0.5) return 'text-green-400';
    if (service.budgetUtilization <= 1.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusMessage = () => {
    if (service.budgetUtilization <= 0.5) return 'Peaceful state';
    if (service.budgetUtilization <= 1.0) return 'Attention needed';
    return 'Urgent action required!';
  };

  return createPortal(
    <div 
      className="fixed inset-0" 
      style={{ 
        zIndex: 999998,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none'
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto'
        }}
      />

      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 h-full w-96 bg-gray-900/95 backdrop-blur-xl border-l-2 border-purple-500/50 shadow-2xl flex flex-col"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100vh',
          width: '384px',
          maxWidth: '90vw',
          pointerEvents: 'auto'
        }}
      >
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-gray-900/90 backdrop-blur-sm p-4 border-b border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white truncate">{service.displayName}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Status Card - Compact */}
        <motion.div
          className="bg-black/40 rounded-lg p-3 border border-purple-500/20"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Total Cost</span>
            </div>
            {getTrendIcon()}
          </div>
          
          <div className="text-xl font-bold text-white mb-1">
            ${service.totalCost.toLocaleString()}
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`text-xs font-medium ${getStatusColor()}`}>
              Budget Usage: {(service.budgetUtilization * 100).toFixed(1)}%
            </div>
            {service.budgetUtilization > 1.0 && (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
          </div>
          
          <div className={`text-xs mt-1 ${getStatusColor()}`}>
            {getStatusMessage()}
          </div>
        </motion.div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Daily Cost Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/40 rounded-lg p-3 border border-purple-500/20"
          >
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Daily Cost Trends
            </h3>
            
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyCosts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    fontSize={10}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={10}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #6b7280',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`$${value}`, 'Cost']}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 4, stroke: '#8b5cf6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Regional Analysis - Based on Actual Data */}
          {regions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/40 rounded-lg p-3 border border-purple-500/20"
            >
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                🌍 Regional Cost Analysis
                <span className="text-xs text-gray-400">({regions.length} regions)</span>
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {regions.map((region, index) => (
                  <motion.div
                    key={region.region}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium flex items-center gap-2">
                        <span className="text-xs">🏢</span>
                        {region.region}
                      </div>
                      <div className="text-xs text-gray-400">{region.percentage.toFixed(1)}% of total</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white font-bold">${region.cost.toLocaleString()}</div>
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(region.percentage, 100)}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* 리전 분석 요약 */}
              <div className="mt-3 pt-2 border-t border-gray-700/50">
                <div className="text-xs text-gray-400">
                  💡 Primary region: <span className="text-white font-medium">{regions[0]?.region}</span> 
                  ({regions[0]?.percentage.toFixed(1)}%)
                  {regions.length > 1 && (
                    <span> | Multi-region operation</span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/40 rounded-lg p-3 border border-purple-500/20"
            >
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                🌐 Regional Cost Analysis
              </h3>
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🌍</div>
                <div className="text-gray-400 text-sm mb-1">
                  Global service or no regional data
                </div>
                <div className="text-xs text-gray-500">
                  This service operates globally or doesn't belong to specific regions
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  예: CloudFront, Route 53, IAM, Organizations 등
                </div>
              </div>
            </motion.div>
          )}

          {/* Cost Optimization Suggestions - Based on Actual Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-3 border border-purple-500/30"
          >
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              💡 Optimization Suggestions
            </h3>
            
            <div className="space-y-1 text-xs">
              {service.budgetUtilization > 1.0 ? (
                <>
                  <div className="text-red-300 font-medium">🚨 Budget exceeded!</div>
                  <div className="text-gray-300">• Review and clean up unnecessary resources</div>
                  <div className="text-gray-300">• Consider using Reserved Instances</div>
                  <div className="text-gray-300">• Review auto-scaling policies</div>
                  {regions.length > 0 && (
                    <div className="text-gray-300">• Priority review for highest cost region: {regions[0].region}</div>
                  )}
                </>
              ) : service.budgetUtilization > 0.8 ? (
                <>
                  <div className="text-yellow-300 font-medium">⚠️ Approaching budget limit</div>
                  <div className="text-gray-300">• Strengthen usage monitoring</div>
                  <div className="text-gray-300">• Recommended to set up cost alerts</div>
                  {service.trend === 'increasing' && (
                    <div className="text-gray-300">• Need to analyze the cause of increasing trend</div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-green-300 font-medium">✅ Stable cost status</div>
                  <div className="text-gray-300">• Maintain current usage patterns</div>
                  <div className="text-gray-300">• Regular cost review recommended</div>
                  {regions.length > 1 && (
                    <div className="text-gray-300">• Multi-region usage - review necessity</div>
                  )}
                </>
              )}
              
              {/* Service-specific Recommendations */}
              {service.displayName.includes('EC2') && (
                <div className="text-blue-300 mt-2">💡 EC2: Consider Spot Instances or Savings Plans</div>
              )}
              {service.displayName.includes('S3') && (
                <div className="text-blue-300 mt-2">💡 S3: Review storage class optimization</div>
              )}
              {service.displayName.includes('RDS') && (
                <div className="text-blue-300 mt-2">💡 RDS: Consider Reserved Instances or Aurora Serverless</div>
              )}
              {service.displayName.includes('Lambda') && (
                <div className="text-blue-300 mt-2">💡 Lambda: Optimize memory settings and execution time</div>
              )}
            </div>
          </motion.div>

          {/* 액션 버튼들 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-2 pb-4"
          >
            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
              Set Budget
            </button>
            <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
              Alert Settings
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
    </div>,
    document.body
  );
};