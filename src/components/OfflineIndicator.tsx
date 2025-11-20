import React, { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';
import { networkService } from '../services/networkService';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check for offline data
    setHasOfflineData(cacheService.hasOfflineData());
    
    // Get last sync time (check both demo and aws accounts)
    const demoSync = cacheService.getLastSync('demo');
    const awsSync = cacheService.getLastSync('aws');
    const latest = demoSync && awsSync 
      ? (demoSync > awsSync ? demoSync : awsSync)
      : (demoSync || awsSync);
    setLastSync(latest);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Try to reconnect and sync data
      networkService.checkConnectivity().then(connected => {
        if (connected) {
          console.log('Connection restored');
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check
    const connectivityCheck = setInterval(async () => {
      const connected = await networkService.checkConnectivity();
      setIsOnline(connected);
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityCheck);
    };
  }, []);

  // Don't show indicator if online and no issues
  if (isOnline && hasOfflineData) {
    return null;
  }

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getStatusColor = (): string => {
    if (isOnline) return 'bg-green-600';
    if (hasOfflineData) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getStatusText = (): string => {
    if (isOnline) return 'Online';
    if (hasOfflineData) return 'Offline (Cached Data)';
    return 'Offline (No Data)';
  };

  const getStatusIcon = (): string => {
    if (isOnline) return '🌐';
    if (hasOfflineData) return '📱';
    return '❌';
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div 
        className={`${getStatusColor()} text-white px-4 py-2 rounded-lg shadow-lg cursor-pointer transition-all duration-300 ${
          showDetails ? 'rounded-b-none' : ''
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium">{getStatusText()}</span>
          <span className="text-xs opacity-75">
            {showDetails ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="bg-gray-800 text-white p-4 rounded-lg rounded-t-none shadow-lg border-t border-gray-600 min-w-64">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Cached Data:</span>
              <span className={hasOfflineData ? 'text-green-400' : 'text-red-400'}>
                {hasOfflineData ? 'Available' : 'None'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Last Sync:</span>
              <span className="text-blue-400">
                {formatLastSync(lastSync)}
              </span>
            </div>

            {!isOnline && hasOfflineData && (
              <div className="mt-3 p-2 bg-yellow-900 rounded text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <span>⚠️</span>
                  <span className="font-medium">Offline Mode</span>
                </div>
                <div className="text-yellow-200">
                  You're viewing cached data. Some information may be outdated.
                </div>
              </div>
            )}

            {!isOnline && !hasOfflineData && (
              <div className="mt-3 p-2 bg-red-900 rounded text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <span>❌</span>
                  <span className="font-medium">No Data Available</span>
                </div>
                <div className="text-red-200">
                  Please connect to the internet to load data.
                </div>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-gray-600">
              <button
                onClick={async () => {
                  const connected = await networkService.checkConnectivity();
                  setIsOnline(connected);
                  if (connected) {
                    window.location.reload();
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs transition-colors"
              >
                {isOnline ? 'Refresh Data' : 'Check Connection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};