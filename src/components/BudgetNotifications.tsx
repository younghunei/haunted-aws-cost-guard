import React, { useEffect } from 'react';
import { useHauntedStore } from '../store/hauntedStore';

export const BudgetNotifications: React.FC = () => {
  const {
    budgetNotifications,
    acknowledgeNotification,
    demoMode
  } = useHauntedStore();

  const unacknowledgedNotifications = budgetNotifications.filter(n => !n.acknowledged);
  const acknowledgedNotifications = budgetNotifications.filter(n => n.acknowledged);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return '📊';
      default: return '📋';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'info': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleAcknowledge = async (notificationId: string) => {
    await acknowledgeNotification(notificationId);
  };

  if (budgetNotifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👻</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Notifications</h3>
        <p className="text-gray-400">
          All your budgets are peaceful. No supernatural activity detected!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unacknowledged Notifications */}
      {unacknowledgedNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
            <span className="mr-2">🔔</span>
            Active Alerts ({unacknowledgedNotifications.length})
          </h3>
          <div className="space-y-3">
            {unacknowledgedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${getSeverityColor(notification.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">
                        {getSeverityIcon(notification.severity)}
                      </span>
                      <span className="font-semibold text-white">
                        {notification.service.toUpperCase()}
                      </span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        notification.severity === 'critical' ? 'bg-red-600' :
                        notification.severity === 'warning' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }`}>
                        {notification.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-200 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-400">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcknowledge(notification.id)}
                    className="ml-4 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acknowledged Notifications */}
      {acknowledgedNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-400 mb-4 flex items-center">
            <span className="mr-2">✅</span>
            Acknowledged ({acknowledgedNotifications.length})
          </h3>
          <div className="space-y-3">
            {acknowledgedNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 rounded-lg border border-gray-600 bg-gray-800/50 opacity-75"
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2 grayscale">
                        {getSeverityIcon(notification.severity)}
                      </span>
                      <span className="font-semibold text-gray-300">
                        {notification.service.toUpperCase()}
                      </span>
                      <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">
                        {notification.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                  <div className="ml-4 text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {demoMode && (
        <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500 rounded-lg">
          <div className="flex items-center">
            <span className="text-purple-400 mr-2">ℹ️</span>
            <p className="text-purple-300 text-sm">
              <strong>Demo Mode:</strong> These are sample notifications. In production mode, 
              notifications would be generated based on real AWS cost data and your configured budgets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};