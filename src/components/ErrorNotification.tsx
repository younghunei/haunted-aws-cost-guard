import React, { useState, useEffect } from 'react';

export interface ErrorNotificationProps {
  error: Error | string | null;
  type?: 'error' | 'warning' | 'info';
  title?: string;
  autoHide?: boolean;
  hideDelay?: number;
  onClose?: () => void;
  onRetry?: () => void;
  onFallback?: () => void;
  showDetails?: boolean;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  type = 'error',
  title,
  autoHide = false,
  hideDelay = 5000,
  onClose,
  onRetry,
  onFallback,
  showDetails = false
}) => {
  const [isVisible, setIsVisible] = useState(!!error);
  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    setIsVisible(!!error);
    
    if (error && autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [error, autoHide, hideDelay, onClose]);

  if (!error || !isVisible) {
    return null;
  }

  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-900 border-yellow-500 text-yellow-100',
          icon: '⚠️',
          title: title || 'Warning'
        };
      case 'info':
        return {
          container: 'bg-blue-900 border-blue-500 text-blue-100',
          icon: 'ℹ️',
          title: title || 'Information'
        };
      default:
        return {
          container: 'bg-red-900 border-red-500 text-red-100',
          icon: '❌',
          title: title || 'Error'
        };
    }
  };

  const styles = getTypeStyles();

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const getSuggestions = (): string[] => {
    const message = errorMessage.toLowerCase();
    const suggestions: string[] = [];

    if (message.includes('network') || message.includes('connection')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
    }

    if (message.includes('credentials') || message.includes('unauthorized')) {
      suggestions.push('Verify your AWS credentials');
      suggestions.push('Check your AWS permissions');
      suggestions.push('Try switching to demo mode');
    }

    if (message.includes('timeout')) {
      suggestions.push('The request took too long');
      suggestions.push('Try refreshing the page');
    }

    if (message.includes('throttl') || message.includes('rate limit')) {
      suggestions.push('AWS is limiting requests');
      suggestions.push('Wait a moment and try again');
    }

    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Check the browser console for more details');
    }

    return suggestions;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className={`${styles.container} border rounded-lg shadow-lg p-4 transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{styles.icon}</span>
            <h3 className="font-bold text-lg">{styles.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed">{errorMessage}</p>
        </div>

        {/* Suggestions */}
        <div className="mb-4">
          <h4 className="font-medium mb-2 text-sm">💡 Suggestions:</h4>
          <ul className="text-xs space-y-1">
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
            >
              🔄 Try Again
            </button>
          )}
          
          {onFallback && (
            <button
              onClick={onFallback}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
            >
              🏠 Demo Mode
            </button>
          )}
        </div>

        {/* Error Details (Development) */}
        {showDetails && errorStack && process.env.NODE_ENV === 'development' && (
          <div className="border-t border-gray-600 pt-3">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="text-xs text-gray-400 hover:text-white transition-colors mb-2"
            >
              {showFullDetails ? '▼' : '▶'} Developer Details
            </button>
            
            {showFullDetails && (
              <div className="bg-black bg-opacity-50 p-2 rounded text-xs font-mono overflow-auto max-h-32">
                <pre className="whitespace-pre-wrap text-red-300">
                  {errorStack}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for managing error notifications
export const useErrorNotification = () => {
  const [error, setError] = useState<Error | string | null>(null);
  const [notificationType, setNotificationType] = useState<'error' | 'warning' | 'info'>('error');

  const showError = (error: Error | string, type: 'error' | 'warning' | 'info' = 'error') => {
    setError(error);
    setNotificationType(type);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    notificationType,
    showError,
    clearError
  };
};