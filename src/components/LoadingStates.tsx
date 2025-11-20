import React from 'react';
import { motion } from 'framer-motion';
import { Ghost, Loader2 } from 'lucide-react';

/**
 * Skeleton loader for service rooms
 */
export const ServiceRoomSkeleton: React.FC = () => {
  return (
    <motion.div
      className="w-70 h-45 bg-gray-800/50 rounded-xl border border-gray-600/30 p-4"
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {/* Title skeleton */}
      <div className="h-4 bg-gray-600/50 rounded mb-3 w-3/4" />
      
      {/* Cost skeleton */}
      <div className="h-3 bg-gray-600/30 rounded mb-2 w-1/2" />
      
      {/* Utilization skeleton */}
      <div className="h-3 bg-gray-600/30 rounded mb-4 w-2/3" />
      
      {/* Entity skeleton */}
      <div className="flex justify-center items-center h-20">
        <motion.div
          className="w-12 h-12 bg-purple-500/30 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>
      
      {/* Particle skeletons */}
      <div className="flex justify-around mt-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-400/20 rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Skeleton loader for mansion layout
 */
export const MansionSkeleton: React.FC = () => {
  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 shadow-2xl">
      <div className="grid grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <ServiceRoomSkeleton key={index} />
        ))}
      </div>
      
      {/* Loading indicator */}
      <motion.div
        className="flex items-center justify-center mt-8 text-purple-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Ghost className="w-6 h-6 mr-2" />
        <span>Summoning spirits...</span>
      </motion.div>
    </div>
  );
};

/**
 * Loading spinner with haunted theme
 */
export const HauntedSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}> = ({ size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        className={`${sizeClasses[size]} text-purple-400`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-full h-full" />
      </motion.div>
      
      {message && (
        <motion.p
          className="text-purple-300 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

/**
 * Detail panel skeleton
 */
export const DetailPanelSkeleton: React.FC = () => {
  return (
    <motion.div
      className="w-96 bg-gray-900/95 backdrop-blur-sm border-l border-purple-500/30 p-6"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-6 bg-gray-600/50 rounded mb-2 w-3/4" />
        <div className="h-4 bg-gray-600/30 rounded w-1/2" />
      </div>
      
      {/* Chart skeleton */}
      <div className="mb-6">
        <div className="h-4 bg-gray-600/30 rounded mb-3 w-1/3" />
        <div className="h-48 bg-gray-700/30 rounded-lg flex items-end justify-around p-4">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="bg-purple-500/30 rounded-t"
              style={{ 
                width: '20px',
                height: `${Math.random() * 120 + 20}px`
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Breakdown skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-600/30 rounded w-1/4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 bg-gray-600/30 rounded w-1/3" />
            <div className="h-3 bg-gray-600/30 rounded w-1/4" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Budget panel skeleton
 */
export const BudgetPanelSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="h-6 bg-gray-600/50 rounded w-1/2" />
      
      {/* Budget items */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-gray-600/50 rounded w-1/3" />
            <div className="h-4 bg-gray-600/30 rounded w-1/4" />
          </div>
          
          {/* Progress bar skeleton */}
          <div className="h-2 bg-gray-700/50 rounded-full mb-2">
            <motion.div
              className="h-full bg-purple-500/30 rounded-full"
              style={{ width: `${Math.random() * 80 + 20}%` }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          
          <div className="flex justify-between text-xs">
            <div className="h-3 bg-gray-600/30 rounded w-1/4" />
            <div className="h-3 bg-gray-600/30 rounded w-1/4" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Error state with retry option
 */
export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({ message, onRetry, showRetry = true }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-red-400 mb-4"
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Ghost className="w-16 h-16" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-red-400 mb-2">
        The spirits are restless...
      </h3>
      
      <p className="text-gray-300 mb-6 max-w-md">
        {message}
      </p>
      
      {showRetry && onRetry && (
        <motion.button
          onClick={onRetry}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  );
};

/**
 * Progressive loading component
 */
export const ProgressiveLoader: React.FC<{
  stages: string[];
  currentStage: number;
}> = ({ stages, currentStage }) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <HauntedSpinner size="lg" />
      
      <div className="text-center">
        <p className="text-purple-300 mb-2">
          {stages[currentStage] || 'Loading...'}
        </p>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        <p className="text-gray-400 text-sm mt-2">
          {currentStage + 1} of {stages.length}
        </p>
      </div>
    </div>
  );
};