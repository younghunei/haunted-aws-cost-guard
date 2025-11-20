/**
 * Accessibility service for screen reader support and keyboard navigation
 */

export interface AccessibilityDescription {
  label: string;
  description: string;
  role: string;
  state?: string;
  value?: string;
}

export interface KeyboardNavigationConfig {
  element: HTMLElement;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onEscape?: () => void;
  onTab?: (shift: boolean) => void;
}

class AccessibilityService {
  private announcements: HTMLElement | null = null;
  private keyboardHandlers = new Map<HTMLElement, KeyboardNavigationConfig>();
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = -1;

  constructor() {
    this.initializeAnnouncements();
    this.setupGlobalKeyboardHandlers();
  }

  /**
   * Initialize screen reader announcements area
   */
  private initializeAnnouncements(): void {
    // Create or find existing announcements element
    this.announcements = document.getElementById('accessibility-announcements');
    
    if (!this.announcements) {
      this.announcements = document.createElement('div');
      this.announcements.id = 'accessibility-announcements';
      this.announcements.setAttribute('aria-live', 'polite');
      this.announcements.setAttribute('aria-atomic', 'true');
      this.announcements.className = 'sr-only';
      this.announcements.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(this.announcements);
    }
  }

  /**
   * Announce text to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcements) return;

    this.announcements.setAttribute('aria-live', priority);
    this.announcements.textContent = message;

    // Clear after announcement to allow repeated announcements
    setTimeout(() => {
      if (this.announcements) {
        this.announcements.textContent = '';
      }
    }, 1000);
  }

  /**
   * Generate accessibility description for service room
   */
  generateServiceRoomDescription(service: {
    displayName: string;
    totalCost: number;
    budgetUtilization: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }): AccessibilityDescription {
    const utilizationPercent = Math.round(service.budgetUtilization * 100);
    const costFormatted = service.totalCost.toLocaleString();
    
    let intensityDescription = '';
    let alertLevel = '';
    
    if (service.budgetUtilization <= 0.5) {
      intensityDescription = 'peaceful ghost, low activity';
      alertLevel = 'safe';
    } else if (service.budgetUtilization <= 1.0) {
      intensityDescription = 'agitated spirit, moderate activity';
      alertLevel = 'warning';
    } else {
      intensityDescription = 'boss monster, high activity';
      alertLevel = 'danger';
    }

    const trendDescription = {
      increasing: 'costs are rising',
      decreasing: 'costs are falling',
      stable: 'costs are stable'
    }[service.trend];

    return {
      label: `${service.displayName} service room`,
      description: `${service.displayName} service with ${intensityDescription}. Current cost: $${costFormatted}. Budget utilization: ${utilizationPercent}%. Trend: ${trendDescription}. Alert level: ${alertLevel}.`,
      role: 'button',
      state: alertLevel,
      value: `${utilizationPercent}%`
    };
  }

  /**
   * Generate mansion overview description
   */
  generateMansionOverview(services: Array<{
    displayName: string;
    budgetUtilization: number;
  }>): string {
    const totalServices = services.length;
    const safeServices = services.filter(s => s.budgetUtilization <= 0.5).length;
    const warningServices = services.filter(s => s.budgetUtilization > 0.5 && s.budgetUtilization <= 1.0).length;
    const dangerServices = services.filter(s => s.budgetUtilization > 1.0).length;

    let overview = `Haunted mansion with ${totalServices} service rooms. `;
    
    if (dangerServices > 0) {
      overview += `${dangerServices} rooms have boss monsters indicating budget overruns. `;
    }
    if (warningServices > 0) {
      overview += `${warningServices} rooms have agitated spirits indicating high budget usage. `;
    }
    if (safeServices > 0) {
      overview += `${safeServices} rooms have peaceful ghosts indicating normal usage. `;
    }

    overview += 'Use arrow keys to navigate between rooms, Enter to select a room for details, and Escape to close panels.';

    return overview;
  }

  /**
   * Setup global keyboard navigation handlers
   */
  private setupGlobalKeyboardHandlers(): void {
    document.addEventListener('keydown', (event) => {
      // Handle global shortcuts
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          this.announceHelp();
          break;
        case 'Escape':
          this.handleGlobalEscape();
          break;
        case 'Tab':
          this.handleTabNavigation(event);
          break;
      }
    });
  }

  /**
   * Announce help information
   */
  private announceHelp(): void {
    const helpText = `
      Haunted AWS Cost Guard keyboard shortcuts:
      F1: This help message.
      Tab: Navigate between interactive elements.
      Arrow keys: Navigate between service rooms.
      Enter or Space: Select a room or activate a button.
      Escape: Close panels or return to main view.
      B: Open budget management panel.
      E: Open export options.
    `;
    this.announce(helpText, 'assertive');
  }

  /**
   * Handle global escape key
   */
  private handleGlobalEscape(): void {
    // Close any open panels
    const event = new CustomEvent('global-escape');
    document.dispatchEvent(event);
  }

  /**
   * Handle tab navigation
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    this.updateFocusableElements();
    
    if (this.focusableElements.length === 0) return;

    if (event.shiftKey) {
      // Shift+Tab - previous element
      this.currentFocusIndex = this.currentFocusIndex <= 0 
        ? this.focusableElements.length - 1 
        : this.currentFocusIndex - 1;
    } else {
      // Tab - next element
      this.currentFocusIndex = this.currentFocusIndex >= this.focusableElements.length - 1 
        ? 0 
        : this.currentFocusIndex + 1;
    }

    const targetElement = this.focusableElements[this.currentFocusIndex];
    if (targetElement) {
      event.preventDefault();
      targetElement.focus();
    }
  }

  /**
   * Update list of focusable elements
   */
  private updateFocusableElements(): void {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])'
    ];

    this.focusableElements = Array.from(
      document.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[];
  }

  /**
   * Register keyboard navigation for an element
   */
  registerKeyboardNavigation(config: KeyboardNavigationConfig): () => void {
    const { element } = config;
    
    // Make element focusable if not already
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }

    // Add keyboard event listener
    const keydownHandler = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          if (config.onEnter) {
            event.preventDefault();
            config.onEnter();
          }
          break;
        case ' ':
          if (config.onSpace) {
            event.preventDefault();
            config.onSpace();
          }
          break;
        case 'ArrowUp':
          if (config.onArrowKeys) {
            event.preventDefault();
            config.onArrowKeys('up');
          }
          break;
        case 'ArrowDown':
          if (config.onArrowKeys) {
            event.preventDefault();
            config.onArrowKeys('down');
          }
          break;
        case 'ArrowLeft':
          if (config.onArrowKeys) {
            event.preventDefault();
            config.onArrowKeys('left');
          }
          break;
        case 'ArrowRight':
          if (config.onArrowKeys) {
            event.preventDefault();
            config.onArrowKeys('right');
          }
          break;
        case 'Escape':
          if (config.onEscape) {
            event.preventDefault();
            config.onEscape();
          }
          break;
        case 'Tab':
          if (config.onTab) {
            config.onTab(event.shiftKey);
          }
          break;
      }
    };

    element.addEventListener('keydown', keydownHandler);
    this.keyboardHandlers.set(element, config);

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', keydownHandler);
      this.keyboardHandlers.delete(element);
    };
  }

  /**
   * Check color contrast compliance
   */
  checkColorContrast(foreground: string, background: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } {
    const getLuminance = (color: string): number => {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Calculate relative luminance
      const sRGB = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    };
  }

  /**
   * Get accessible color for supernatural entities
   */
  getAccessibleEntityColor(utilization: number): {
    color: string;
    contrastRatio: number;
    accessible: boolean;
  } {
    const backgroundColor = '#0f0f23'; // Dark mansion background
    
    let entityColor: string;
    
    if (utilization <= 0.5) {
      entityColor = '#c084fc'; // Lighter purple for better contrast
    } else if (utilization <= 1.0) {
      entityColor = '#fb923c'; // Lighter orange for better contrast
    } else {
      entityColor = '#f87171'; // Lighter red for better contrast
    }

    const contrast = this.checkColorContrast(entityColor, backgroundColor);
    
    return {
      color: entityColor,
      contrastRatio: contrast.ratio,
      accessible: contrast.wcagAA
    };
  }

  /**
   * Create accessible focus indicator
   */
  createFocusIndicator(element: HTMLElement): void {
    element.style.outline = 'none';
    element.addEventListener('focus', () => {
      element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
      element.style.borderColor = '#3b82f6';
    });
    
    element.addEventListener('blur', () => {
      element.style.boxShadow = '';
      element.style.borderColor = '';
    });
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();