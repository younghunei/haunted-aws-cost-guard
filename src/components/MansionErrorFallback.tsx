import React from 'react';
import { useHauntedStore } from '../store/hauntedStore';

interface MansionErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
}

export const MansionErrorFallback: React.FC<MansionErrorFallbackProps> = ({
  error,
  resetError,
  message = "The mansion spirits are restless..."
}) => {
  const { demoMode, setMode } = useHauntedStore();

  const handleReturnToDemo = () => {
    setMode('demo');
    if (resetError) {
      resetError();
    }
  };

  const handleRetry = () => {
    if (resetError) {
      resetError();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-purple-500 rounded-lg p-8 max-w-lg w-full text-center shadow-2xl">
        {/* Animated ghost */}
        <div className="mb-6">
          <div className="text-6xl mb-4 animate-bounce">👻</div>
          <h2 className="text-2xl font-bold text-purple-300 mb-2">
            Mansion Under Maintenance
          </h2>
          <p className="text-gray-300 mb-4">
            {message}
          </p>
        </div>

        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="text-red-400 cursor-pointer mb-2 text-center">
              👨‍💻 Developer Info
            </summary>
            <div className="bg-gray-900 p-3 rounded text-xs text-red-300 overflow-auto max-h-32">
              <div className="font-bold mb-1">{error.name}:</div>
              <div>{error.message}</div>
              {error.stack && (
                <div className="mt-2 text-gray-400 text-xs">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </div>
              )}
            </div>
          </details>
        )}

        {/* Recovery options */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            Try Again
          </button>

          {!demoMode && (
            <button
              onClick={handleReturnToDemo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              <span>🏠</span>
              Return to Demo Mode
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            Reload Page
          </button>
        </div>

        {/* Helpful tips */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
          <h3 className="font-bold mb-2 text-purple-300">💡 Troubleshooting Tips:</h3>
          <ul className="text-left space-y-1">
            <li>• Check your internet connection</li>
            <li>• Verify AWS credentials if using AWS mode</li>
            <li>• Try refreshing the page</li>
            <li>• Switch to demo mode for offline use</li>
          </ul>
        </div>
      </div>
    </div>
  );
};