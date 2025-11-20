/**
 * Performance monitoring service for Canvas rendering
 * Automatically adjusts quality based on frame rate performance
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  renderTime: number;
  lastUpdate: number;
}

export interface QualitySettings {
  level: 'low' | 'medium' | 'high' | 'ultra';
  particleCount: number;
  animationSpeed: number;
  shadowQuality: boolean;
  antiAliasing: boolean;
  maxEntities: number;
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private frameTimeHistory: number[] = [];
  private currentMetrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    renderTime: 0,
    lastUpdate: Date.now()
  };
  
  private qualitySettings: QualitySettings = {
    level: 'high',
    particleCount: 20,
    animationSpeed: 1,
    shadowQuality: true,
    antiAliasing: true,
    maxEntities: 50
  };

  private callbacks: Array<(metrics: PerformanceMetrics, quality: QualitySettings) => void> = [];
  private isMonitoring = false;
  private animationFrameId?: number;

  // Performance thresholds
  private readonly PERFORMANCE_THRESHOLDS = {
    excellent: 55, // 55+ FPS
    good: 45,      // 45-55 FPS
    fair: 30,      // 30-45 FPS
    poor: 20       // Below 30 FPS
  };

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.frameTimeHistory = [];
    
    this.monitorFrame();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Monitor frame performance
   */
  private monitorFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    
    this.frameTimeHistory.push(frameTime);
    
    // Keep only last 60 frames for rolling average
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    this.frameCount++;
    
    // Update metrics every 60 frames (approximately 1 second at 60fps)
    if (this.frameCount % 60 === 0) {
      this.updateMetrics();
      this.adjustQualityIfNeeded();
    }

    this.lastTime = currentTime;
    this.animationFrameId = requestAnimationFrame(this.monitorFrame);
  };

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    const fps = Math.round(1000 / avgFrameTime);

    this.currentMetrics = {
      fps,
      frameTime: avgFrameTime,
      renderTime: avgFrameTime,
      lastUpdate: Date.now(),
      memoryUsage: this.getMemoryUsage()
    };

    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback(this.currentMetrics, this.qualitySettings);
    });
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    return undefined;
  }

  /**
   * Automatically adjust quality based on performance
   */
  private adjustQualityIfNeeded(): void {
    const { fps } = this.currentMetrics;
    let newQuality: QualitySettings['level'] = this.qualitySettings.level;

    // Determine quality level based on FPS
    if (fps >= this.PERFORMANCE_THRESHOLDS.excellent) {
      newQuality = 'ultra';
    } else if (fps >= this.PERFORMANCE_THRESHOLDS.good) {
      newQuality = 'high';
    } else if (fps >= this.PERFORMANCE_THRESHOLDS.fair) {
      newQuality = 'medium';
    } else {
      newQuality = 'low';
    }

    // Only adjust if quality level changed
    if (newQuality !== this.qualitySettings.level) {
      this.setQualityLevel(newQuality);
      console.log(`Performance: Adjusted quality to ${newQuality} (FPS: ${fps})`);
    }
  }

  /**
   * Set quality level and update settings
   */
  setQualityLevel(level: QualitySettings['level']): void {
    const qualityConfigs = {
      low: {
        level: 'low' as const,
        particleCount: 5,
        animationSpeed: 0.5,
        shadowQuality: false,
        antiAliasing: false,
        maxEntities: 20
      },
      medium: {
        level: 'medium' as const,
        particleCount: 10,
        animationSpeed: 0.75,
        shadowQuality: false,
        antiAliasing: true,
        maxEntities: 30
      },
      high: {
        level: 'high' as const,
        particleCount: 20,
        animationSpeed: 1,
        shadowQuality: true,
        antiAliasing: true,
        maxEntities: 50
      },
      ultra: {
        level: 'ultra' as const,
        particleCount: 30,
        animationSpeed: 1.2,
        shadowQuality: true,
        antiAliasing: true,
        maxEntities: 100
      }
    };

    this.qualitySettings = qualityConfigs[level];
    
    // Notify callbacks about quality change
    this.callbacks.forEach(callback => {
      callback(this.currentMetrics, this.qualitySettings);
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get current quality settings
   */
  getQualitySettings(): QualitySettings {
    return { ...this.qualitySettings };
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(callback: (metrics: PerformanceMetrics, quality: QualitySettings) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Force a quality adjustment check
   */
  checkPerformance(): void {
    this.adjustQualityIfNeeded();
  }

  /**
   * Get performance status
   */
  getPerformanceStatus(): 'excellent' | 'good' | 'fair' | 'poor' {
    const { fps } = this.currentMetrics;
    
    if (fps >= this.PERFORMANCE_THRESHOLDS.excellent) return 'excellent';
    if (fps >= this.PERFORMANCE_THRESHOLDS.good) return 'good';
    if (fps >= this.PERFORMANCE_THRESHOLDS.fair) return 'fair';
    return 'poor';
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();