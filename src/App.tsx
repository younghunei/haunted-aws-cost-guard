import React from 'react';
import { HauntedMansion } from './components/HauntedMansion';
import { ModeSelection } from './components/ModeSelection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MansionErrorFallback } from './components/MansionErrorFallback';
import { ErrorNotification } from './components/ErrorNotification';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useHauntedStore } from './store/hauntedStore';
import './App.css';

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

function App() {
  const { 
    isInitialized, 
    error, 
    isLoading,
    setMode, 
    clearError, 
    retryLastOperation, 
    fallbackToDemo 
  } = useHauntedStore();

  const handleModeSelect = (mode: 'demo' | 'aws', credentials?: AWSCredentials) => {
    setMode(mode, credentials);
  };

  const handleErrorRetry = () => {
    clearError();
    retryLastOperation();
  };

  const handleErrorFallback = () => {
    clearError();
    fallbackToDemo();
  };

  return (
    <ErrorBoundary
      fallback={<MansionErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught error:', error, errorInfo);
        // In production, send to error reporting service
      }}
    >
      <div className="App">
        {/* Error Notification */}
        <ErrorNotification
          error={error}
          onClose={clearError}
          onRetry={handleErrorRetry}
          onFallback={handleErrorFallback}
          showDetails={process.env.NODE_ENV === 'development'}
        />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Main Content */}
        {!isInitialized ? (
          <ErrorBoundary
            fallback={
              <MansionErrorFallback 
                message="Failed to load mode selection. Please refresh the page."
              />
            }
          >
            <ModeSelection onModeSelect={handleModeSelect} />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary
            fallback={
              <MansionErrorFallback 
                message="The haunted mansion encountered an error. Don't worry, we can fix this!"
              />
            }
          >
            <HauntedMansion />
          </ErrorBoundary>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-900/80 to-black/80 backdrop-blur-lg rounded-xl p-8 text-center border border-orange-500/30 shadow-2xl">
              <div className="flex justify-center space-x-2 mb-6">
                <div className="animate-bounce text-4xl" style={{ animationDelay: '0ms' }}>👻</div>
                <div className="animate-bounce text-4xl" style={{ animationDelay: '150ms' }}>🎃</div>
                <div className="animate-bounce text-4xl" style={{ animationDelay: '300ms' }}>🦇</div>
              </div>
              <div className="text-white font-medium text-lg mb-2">Loading mansion data...</div>
              <div className="text-orange-300 text-sm">🕯️ The spirits are gathering information 🕯️</div>
              <div className="mt-4 w-48 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;