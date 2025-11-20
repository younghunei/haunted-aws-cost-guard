import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stage, Layer } from 'react-konva';
import { Ghost, Activity } from 'lucide-react';
import { ServiceRoom } from './ServiceRoom';
import { CostDetailPanel } from './CostDetailPanel';
import { BudgetPanel } from './BudgetPanel';
import { ExportButton } from './ExportButton';
import { MansionSkeleton } from './LoadingStates';
import { useHauntedStore } from '../store/hauntedStore';
import { shareService } from '../services/shareService';
import { performanceMonitor, PerformanceMetrics, QualitySettings } from '../services/performanceMonitor';
import { accessibilityService } from '../services/accessibilityService';

export const HauntedMansion: React.FC = () => {
  const { 
    services, 
    selectedService, 
    setSelectedService, 
    setShowBudgetPanel,
    budgetNotifications,
    loadFromShareData,
    shareData,
    isLoading,
    resetToHome
  } = useHauntedStore();
  const [mansionDimensions, setMansionDimensions] = useState({ width: 1200, height: 800 });
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(
    performanceMonitor.getMetrics()
  );
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>(
    performanceMonitor.getQualitySettings()
  );
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [showPerformanceIndicator, setShowPerformanceIndicator] = useState(false);
  const mansionRef = useRef<HTMLDivElement>(null);
  
  const unacknowledgedAlerts = budgetNotifications.filter(n => !n.acknowledged).length;

  // Performance monitoring setup
  useEffect(() => {
    performanceMonitor.startMonitoring();
    
    const unsubscribe = performanceMonitor.subscribe((metrics, quality) => {
      setPerformanceMetrics(metrics);
      setQualitySettings(quality);
      
      // Show performance indicator if FPS drops significantly
      if (metrics.fps < 30 && !showPerformanceIndicator) {
        setShowPerformanceIndicator(true);
        setTimeout(() => setShowPerformanceIndicator(false), 5000);
      }
    });

    return () => {
      performanceMonitor.stopMonitoring();
      unsubscribe();
    };
  }, [showPerformanceIndicator]);

  // Accessibility setup
  useEffect(() => {
    if (services.length > 0) {
      const overview = accessibilityService.generateMansionOverview(services);
      accessibilityService.announce(overview);
    }
  }, [services]);

  // Keyboard navigation setup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault();
          handleArrowNavigation(event.key);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (services[selectedRoomIndex]) {
            setSelectedService(services[selectedRoomIndex]);
          }
          break;
        case 'Escape':
          if (selectedService) {
            setSelectedService(null);
          }
          break;
        case 'b':
        case 'B':
          event.preventDefault();
          setShowBudgetPanel(true);
          break;
        case 'h':
        case 'H':
          event.preventDefault();
          resetToHome();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoomIndex, services, selectedService, setSelectedService, setShowBudgetPanel]);

  // Check for shared data on component mount
  useEffect(() => {
    const shareId = shareService.extractShareIdFromUrl();
    if (shareId && shareService.isValidShareId(shareId) && !shareData) {
      // Load shared data
      shareService.loadSharedState(shareId)
        .then((snapshot) => {
          loadFromShareData(snapshot);
          setShowShareNotification(true);
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setShowShareNotification(false);
          }, 5000);
        })
        .catch((error) => {
          console.error('Failed to load shared state:', error);
        });
    }
  }, [loadFromShareData, shareData]);

  // Arrow key navigation handler
  const handleArrowNavigation = (key: string) => {
    const roomsPerRow = 3;
    const totalRooms = services.length;
    let newIndex = selectedRoomIndex;

    switch (key) {
      case 'ArrowLeft':
        newIndex = selectedRoomIndex > 0 ? selectedRoomIndex - 1 : totalRooms - 1;
        break;
      case 'ArrowRight':
        newIndex = selectedRoomIndex < totalRooms - 1 ? selectedRoomIndex + 1 : 0;
        break;
      case 'ArrowUp':
        newIndex = selectedRoomIndex - roomsPerRow;
        if (newIndex < 0) newIndex = selectedRoomIndex + Math.floor((totalRooms - 1) / roomsPerRow) * roomsPerRow;
        if (newIndex >= totalRooms) newIndex = totalRooms - 1;
        break;
      case 'ArrowDown':
        newIndex = selectedRoomIndex + roomsPerRow;
        if (newIndex >= totalRooms) newIndex = selectedRoomIndex % roomsPerRow;
        break;
    }

    setSelectedRoomIndex(newIndex);
    
    // Announce the newly focused room
    if (services[newIndex]) {
      const description = accessibilityService.generateServiceRoomDescription(services[newIndex]);
      accessibilityService.announce(`Focused: ${description.label}. ${description.description}`);
    }
  };

  // 으스스한 배경 효과 (Spooky Background Effects)
  const backgroundVariants = {
    normal: { 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      boxShadow: 'inset 0 0 100px rgba(139, 69, 19, 0.3)'
    },
    alert: { 
      background: 'linear-gradient(135deg, #2d1b1b 0%, #3d1a1a 50%, #4a1a1a 100%)',
      boxShadow: 'inset 0 0 100px rgba(220, 20, 60, 0.5)'
    }
  };

  const hasAlerts = services.some(service => service.budgetUtilization > 1.0);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <MansionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mansionRef}
      className="min-h-screen relative"
      role="main"
      aria-label="Haunted AWS Cost Guard Dashboard"
    >
      {/* 할로윈 배경 애니메이션 (Halloween Background Animation) */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: hasAlerts 
            ? 'linear-gradient(135deg, #1a0000 0%, #330000 25%, #4d0000 50%, #660000 75%, #1a0000 100%)'
            : 'linear-gradient(135deg, #000000 0%, #1a0033 25%, #330066 50%, #4d0099 75%, #000000 100%)'
        }}
        animate={{
          opacity: hasAlerts ? [0.8, 1, 0.8] : [0.9, 1, 0.9]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* 할로윈 안개 효과 (Halloween Fog Effect) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-40 h-40 rounded-full blur-2xl ${
              hasAlerts 
                ? 'bg-gradient-radial from-red-500/15 to-transparent' 
                : 'bg-gradient-radial from-orange-400/10 via-purple-500/10 to-transparent'
            }`}
            animate={{
              x: [0, 150, 0],
              y: [0, -80, 0],
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              left: `${5 + i * 12}%`,
              top: `${15 + i * 8}%`
            }}
          />
        ))}
        
        {/* 추가 할로윈 파티클 효과 (Additional Halloween Particle Effects) */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      {/* 메인 저택 헤더 (Main Mansion Header) */}
      <motion.header 
        className="relative z-10 p-4 bg-gradient-to-r from-black/60 via-purple-900/40 to-orange-900/40 backdrop-blur-sm border-b border-orange-500/30"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex items-center justify-between mb-2">
          {/* 왼쪽: 제목 (Left: Title) */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                rotate: hasAlerts ? [0, -10, 10, 0] : [0, 5, -5, 0],
                scale: hasAlerts ? [1, 1.1, 1] : [1, 1.05, 1]
              }}
              transition={{ 
                duration: hasAlerts ? 0.5 : 3, 
                repeat: Infinity 
              }}
            >
              <div className="text-4xl">🎃</div>
            </motion.div>
            
            <div>
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent"
                animate={{
                  textShadow: hasAlerts ? [
                    "0 0 10px #ff6b35",
                    "0 0 20px #ff6b35", 
                    "0 0 10px #ff6b35"
                  ] : [
                    "0 0 5px #ff6b35",
                    "0 0 15px #ff6b35", 
                    "0 0 5px #ff6b35"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👻 Haunted AWS Cost Guard 🦇
              </motion.h1>
              <motion.p 
                className="text-orange-200 text-base font-medium"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {hasAlerts ? '🔥 Powerful evil spirits are haunting the mansion! 💀' : '🕯️ Dangerous energy is lurking in the mansion... 🕷️'}
              </motion.p>
            </div>
          </div>

          {/* Right: Home, Budget Management and Export buttons */}
          <div className="flex items-center gap-3">
            {hasAlerts && (
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-2xl"
              >
                ⚠️
              </motion.div>
            )}
            
            {/* Home Button */}
            <motion.button
              onClick={resetToHome}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-medium transition-all shadow-lg border border-gray-600/50"
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(139, 92, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              aria-label="Return to Home"
              title="Return to Home"
            >
              <span className="text-lg">🏠</span>
              <span className="text-sm">Home</span>
            </motion.button>
            
            {/* Export Button */}
            <ExportButton />
            
            <motion.button
              onClick={() => setShowBudgetPanel(true)}
              className="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-medium transition-all shadow-lg border border-purple-500/50"
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Budget Management${unacknowledgedAlerts > 0 ? ` (${unacknowledgedAlerts} alerts)` : ''}`}
            >
              <span className="text-lg">💰</span>
              <span className="text-sm">Budget Management</span>
              
              {/* Alert Badge */}
              {unacknowledgedAlerts > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    boxShadow: [
                      "0 0 5px rgba(239, 68, 68, 0.5)",
                      "0 0 15px rgba(239, 68, 68, 0.8)",
                      "0 0 5px rgba(239, 68, 68, 0.5)"
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  aria-label={`${unacknowledgedAlerts} unacknowledged alerts`}
                >
                  {unacknowledgedAlerts}
                </motion.div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* 할로윈 장식 요소들 (Halloween Decoration Elements) */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {/* 떠다니는 할로윈 요소들 (Floating Halloween Elements) */}
        {[
          { emoji: '👻', x: '10%', y: '20%', delay: 0, duration: 6 },
          { emoji: '🦇', x: '85%', y: '15%', delay: 1, duration: 4 },
          { emoji: '🕷️', x: '15%', y: '80%', delay: 2, duration: 5 },
          { emoji: '💀', x: '90%', y: '70%', delay: 0.5, duration: 7 },
          { emoji: '🎃', x: '5%', y: '50%', delay: 1.5, duration: 5.5 },
          { emoji: '🕸️', x: '95%', y: '40%', delay: 2.5, duration: 6.5 },
        ].map((element, index) => (
          <motion.div
            key={index}
            className="absolute text-3xl opacity-20"
            style={{ left: element.x, top: element.y }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: element.duration,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {element.emoji}
          </motion.div>
        ))}
        
        {/* 거미줄 장식 */}
        <div className="absolute top-0 left-0 w-40 h-40 opacity-15">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M5,5 Q50,25 95,5 Q75,50 95,95 Q50,75 5,95 Q25,50 5,5" 
                  fill="none" stroke="#ff6b35" strokeWidth="0.5"/>
            <path d="M20,20 Q50,35 80,20 Q65,50 80,80 Q50,65 20,80 Q35,50 20,20" 
                  fill="none" stroke="#ff6b35" strokeWidth="0.3"/>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 opacity-15 transform rotate-90">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M5,5 Q50,25 95,5 Q75,50 95,95 Q50,75 5,95 Q25,50 5,5" 
                  fill="none" stroke="#8b5cf6" strokeWidth="0.5"/>
            <path d="M20,20 Q50,35 80,20 Q65,50 80,80 Q50,65 20,80 Q35,50 20,20" 
                  fill="none" stroke="#8b5cf6" strokeWidth="0.3"/>
          </svg>
        </div>
      </div>

      {/* Mansion Main Area */}
      <div 
        id="mansion-container"
        className="relative z-10 flex-1 flex flex-col min-h-0"
      >
        {/* Mansion Rooms */}
        <motion.div 
          className="flex-1 p-2 overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div 
            className="bg-gradient-to-br from-black/50 via-purple-900/30 to-orange-900/20 backdrop-blur-sm rounded-2xl border-2 border-orange-500/40 p-3 shadow-2xl relative h-full overflow-auto"
            role="grid"
            aria-label="Service rooms in haunted mansion"
          >
            {/* 저택 내부 장식 */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-2 left-2 text-orange-400/30 text-2xl">🕯️</div>
              <div className="absolute top-2 right-2 text-orange-400/30 text-2xl">🕯️</div>
              <div className="absolute bottom-2 left-2 text-purple-400/30 text-xl">⚰️</div>
              <div className="absolute bottom-2 right-2 text-purple-400/30 text-xl">🔮</div>
            </div>
            
            {/* 동적 그리드 계산 */}
            {(() => {
              const containerWidth = window.innerWidth - 100; // Consider margins
              const roomWidth = 290;
              const roomHeight = 190;
              const gap = 15;
              const cols = Math.floor(containerWidth / (roomWidth + gap));
              const actualCols = Math.max(3, Math.min(cols, 6)); // 최소 3개, 최대 6개 열
              const rows = Math.ceil(services.length / actualCols);
              const stageWidth = actualCols * (roomWidth + gap) - gap + 40; // 패딩 포함
              const stageHeight = rows * (roomHeight + gap) - gap + 40; // 패딩 포함
              
              return (
                <Stage 
                  width={stageWidth} 
                  height={stageHeight}
                  style={{ outline: 'none' }}
                >
                  <Layer>
                    {services.map((service, index) => (
                      <ServiceRoom
                        key={service.service}
                        service={service}
                        position={{
                          x: (index % actualCols) * (roomWidth + gap) + 20,
                          y: Math.floor(index / actualCols) * (roomHeight + gap) + 20
                        }}
                        onSelect={() => {
                          setSelectedService(service);
                          setSelectedRoomIndex(index);
                        }}
                        isSelected={selectedService?.service === service.service || selectedRoomIndex === index}
                      />
                    ))}
                  </Layer>
                </Stage>
              );
            })()}
          </div>
        </motion.div>

        {/* 상세 패널 */}
        <AnimatePresence>
          {selectedService && (
            <CostDetailPanel
              service={selectedService}
              onClose={() => setSelectedService(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Budget Management Panel */}
      <BudgetPanel />

      {/* Share Notification */}
      <AnimatePresence>
        {showShareNotification && shareData && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-cyan-900/90 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3">
              <Ghost className="w-6 h-6 text-cyan-400" />
              <div>
                <h4 className="text-white font-medium">Shared Mansion Loaded</h4>
                <p className="text-cyan-300 text-sm">
                  Viewing shared data from {new Date(shareData.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowShareNotification(false)}
                className="text-cyan-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Indicator */}
      <AnimatePresence>
        {showPerformanceIndicator && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-20 right-4 z-50 bg-yellow-900/90 backdrop-blur-sm border border-yellow-500/50 rounded-lg p-3 shadow-2xl"
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="text-white font-medium text-sm">Performance Alert</h4>
                <p className="text-yellow-300 text-xs">
                  FPS: {performanceMetrics.fps} | Quality: {qualitySettings.level}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility announcements area */}
      <div
        id="accessibility-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      />

      {/* Keyboard navigation help */}
      <div className="sr-only">
        <p>
          Use arrow keys to navigate between rooms, Enter to select, Escape to close panels, 
          B for budget management, E for export options, F1 for help.
        </p>
      </div>

      {/* 하단 상태 바 */}
      <motion.footer 
        className="relative z-10 p-3 bg-gradient-to-r from-black/70 via-purple-900/50 to-orange-900/50 backdrop-blur-sm border-t-2 border-orange-500/40"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-lg"
            >
              💀
            </motion.div>
            <span className="text-orange-200 text-sm font-medium">
              🏚️ Total {services.length} rooms | 🕐 Last updated: {new Date().toLocaleTimeString('en-US')}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Budget Status Indicators - All Status Display */}
            {(() => {
              const safeServices = services.filter(s => s.budgetUtilization <= 0.5).length;
              const moderateServices = services.filter(s => s.budgetUtilization > 0.5 && s.budgetUtilization <= 0.8).length;
              const cautionServices = services.filter(s => s.budgetUtilization > 0.8 && s.budgetUtilization <= 1.0).length;
              const dangerServices = services.filter(s => s.budgetUtilization > 1.0).length;
              
              return (
                <>
                  {/* Safe Status */}
                  <div className="flex items-center gap-1" role="status" aria-label={`${safeServices} safe services`}>
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${safeServices > 0 ? 'bg-green-400' : 'bg-gray-600'}`}
                      animate={safeServices > 0 ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className={`text-xs font-medium ${safeServices > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                      ✅ Safe ({safeServices})
                    </span>
                  </div>
                  
                  {/* Moderate Status */}
                  <div className="flex items-center gap-1" role="status" aria-label={`${moderateServices} moderate services`}>
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${moderateServices > 0 ? 'bg-blue-400' : 'bg-gray-600'}`}
                      animate={moderateServices > 0 ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <span className={`text-xs font-medium ${moderateServices > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                      📊 Moderate ({moderateServices})
                    </span>
                  </div>
                  
                  {/* Warning Status */}
                  <div className="flex items-center gap-1" role="status" aria-label={`${cautionServices} warning services`}>
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${cautionServices > 0 ? 'bg-yellow-400' : 'bg-gray-600'}`}
                      animate={cautionServices > 0 ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    <span className={`text-xs font-medium ${cautionServices > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                      ⚠️ Warning ({cautionServices})
                    </span>
                  </div>
                  
                  {/* Danger Status */}
                  <div className="flex items-center gap-1" role="status" aria-label={`${dangerServices} danger services`}>
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${dangerServices > 0 ? 'bg-red-400' : 'bg-gray-600'}`}
                      animate={dangerServices > 0 ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
                      transition={{ duration: dangerServices > 0 ? 1 : 2, repeat: Infinity, delay: 1 }}
                    />
                    <span className={`text-xs font-medium ${dangerServices > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      🚨 Danger ({dangerServices})
                    </span>
                  </div>
                </>
              );
            })()}
            
            {/* Performance indicator */}
            <div className="flex items-center gap-1 text-xs text-purple-300 bg-black/30 px-2 py-1 rounded-md border border-purple-500/30">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                ⚡
              </motion.div>
              <span>FPS: {performanceMetrics.fps}</span>
              <span>|</span>
              <span>Quality: {qualitySettings.level}</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};