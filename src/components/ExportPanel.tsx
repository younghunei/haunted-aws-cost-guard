import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Share2, 
  FileImage, 
  FileText, 
  Database, 
  Printer,
  Copy,
  QrCode,
  X,
  Settings,
  Clock,
  Eye,
  Lock,
  ExternalLink
} from 'lucide-react';
import { exportService, ExportOptions, MansionSnapshot } from '../services/exportService';
import { shareService, ShareOptions, ShareableLink } from '../services/shareService';
import { useHauntedStore } from '../store/hauntedStore';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose }) => {
  const { 
    services, 
    viewSettings, 
    budgets, 
    demoMode
  } = useHauntedStore();

  const [activeTab, setActiveTab] = useState<'export' | 'share'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState<ShareableLink | null>(null);
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    expirationHours: 24,
    includeData: true
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeVisual: true,
    includeData: true
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const generateSnapshot = (): MansionSnapshot => {
    return exportService.generateMansionSnapshot(
      services,
      viewSettings,
      budgets,
      demoMode ? 'demo' : 'aws'
    );
  };

  const handleExport = async () => {
    if (isExporting) return;
    
    console.log('🎃 Starting export...', exportOptions);
    
    // Enhanced element validation
    const mansionElement = document.getElementById('mansion-container');
    console.log('Mansion element validation:', {
      found: !!mansionElement,
      visible: mansionElement ? mansionElement.offsetWidth > 0 && mansionElement.offsetHeight > 0 : false,
      dimensions: mansionElement ? { width: mansionElement.offsetWidth, height: mansionElement.offsetHeight } : null,
      children: mansionElement ? mansionElement.children.length : 0,
      services: services.length
    });
    
    if (!mansionElement) {
      showNotification('error', '🏚️ Haunted mansion not found! Please enter Demo Mode or AWS Mode first.');
      return;
    }

    if (mansionElement.offsetWidth === 0 || mansionElement.offsetHeight === 0) {
      showNotification('error', '👻 Mansion is not visible! Please make sure the mansion is fully loaded.');
      return;
    }

    if (services.length === 0) {
      showNotification('error', '🏚️ No services to export! Please load some data first.');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const snapshot = generateSnapshot();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `haunted-mansion-${timestamp}`;

      switch (exportOptions.format) {
        case 'pdf':
          showNotification('success', '📄 Generating PDF report... Please wait.');
          console.log('🔄 Starting PDF generation...');
          
          // Wait a moment for notification to show
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            // Try the enhanced DOM capture method first
            await exportService.exportToPDFEnhanced(
              'mansion-container',
              filename,
              { 
                includeData: exportOptions.includeData,
                snapshot: exportOptions.includeData ? snapshot : undefined
              }
            );
          } catch (enhancedError) {
            console.warn('Enhanced PDF export failed, trying simple method:', enhancedError);
            showNotification('success', '📄 Trying data-based PDF method...');
            
            try {
              // Fallback to simple data-based method
              await exportService.exportToPDFSimple(
                'mansion-container',
                filename,
                { 
                  includeData: exportOptions.includeData,
                  snapshot: exportOptions.includeData ? snapshot : undefined
                }
              );
            } catch (simpleError) {
              console.warn('Simple PDF export failed, trying alternative visual method:', simpleError);
              showNotification('success', '📄 Trying alternative visual method...');
              
              // Last resort: try the alternative method
              await exportService.exportToPDFAlternative(
                'mansion-container',
                filename,
                { 
                  includeData: exportOptions.includeData,
                  snapshot: exportOptions.includeData ? snapshot : undefined
                }
              );
            }
          }
          console.log('✅ PDF generation complete!');
          break;
        
        case 'png':
          showNotification('success', '📸 Capturing mansion image...');
          await new Promise(resolve => setTimeout(resolve, 300));
          await exportService.exportToPNG('mansion-container', filename);
          break;
        
        case 'json':
          exportService.exportToJSON(snapshot, filename);
          break;
        
        case 'csv':
          exportService.exportToCSV(services, filename);
          break;
      }

      showNotification('success', `✅ ${exportOptions.format.toUpperCase()} export completed successfully! 👻`);
    } catch (error) {
      console.error('❌ Export failed:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        format: exportOptions.format,
        elementId: 'mansion-container',
        elementExists: !!document.getElementById('mansion-container'),
        servicesCount: services.length
      });
      
      const errorMessage = (error as Error).message || 'Unknown error occurred';
      
      if (errorMessage.includes('not found') || errorMessage.includes('validation failed')) {
        showNotification('error', '🏚️ Mansion element not found! Please refresh the page and try again.');
      } else if (errorMessage.includes('not visible') || errorMessage.includes('zero dimensions')) {
        showNotification('error', '👻 Mansion not visible! Please make sure you are in Demo or AWS mode.');
      } else if (errorMessage.includes('canvas') || errorMessage.includes('capture')) {
        showNotification('error', '📸 Failed to capture mansion. Try scrolling to top and ensuring mansion is fully visible.');
      } else if (errorMessage.includes('PDF')) {
        showNotification('error', '📄 PDF generation failed. Please try PNG format or refresh the page.');
      } else {
        showNotification('error', `Export failed: ${errorMessage.substring(0, 100)}...`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      const snapshot = generateSnapshot();
      const link = await shareService.generateShareableLink(snapshot, shareOptions);
      setShareLink(link);
      showNotification('success', 'Shareable link created successfully!');
    } catch (error) {
      console.error('Share failed:', error);
      showNotification('error', 'Failed to create shareable link. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    try {
      await shareService.copyToClipboard(shareLink.url);
      showNotification('success', 'Link copied to clipboard!');
    } catch (error) {
      showNotification('error', 'Failed to copy link to clipboard');
    }
  };

  const handleNativeShare = async () => {
    if (!shareLink) return;
    
    try {
      await shareService.shareViaNativeAPI({
        title: 'Haunted AWS Cost Guard - Cost Visualization',
        text: 'Check out this AWS cost visualization!',
        url: shareLink.url
      });
    } catch (error) {
      // Fallback to copy to clipboard
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    exportService.printMansion();
  };

  const socialUrls = shareLink 
    ? shareService.generateSocialShareUrls(
        shareLink.url, 
        'Haunted AWS Cost Guard - Cost Visualization'
      )
    : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0" 
          style={{ 
            zIndex: 999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-70"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-96 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 border-l-2 border-orange-500/50 shadow-2xl overflow-y-auto backdrop-blur-sm"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100vh',
              width: '384px',
              maxWidth: '90vw'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-orange-500/50 bg-gradient-to-r from-black/60 to-purple-900/40">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl"
                >
                  📤
                </motion.span>
                <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                  Export & Share
                </h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 text-orange-400 hover:text-white transition-colors rounded-lg hover:bg-orange-500/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Notification */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`mx-4 mt-4 p-3 rounded-lg ${
                    notification.type === 'success' 
                      ? 'bg-green-900 text-green-100 border border-green-700'
                      : 'bg-red-900 text-red-100 border border-red-700'
                  }`}
                >
                  {notification.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex border-b-2 border-orange-500/30 bg-black/30">
              <motion.button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'export'
                    ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                    : 'text-gray-400 hover:text-orange-300 hover:bg-orange-500/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg mr-2">📥</span>
                Export
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'share'
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                    : 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/5'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg mr-2">🔗</span>
                Share
              </motion.button>
            </div>

            <div className="p-4">
              {activeTab === 'export' && (
                <div className="space-y-6">
                  {/* Export Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { format: 'pdf', icon: FileText, label: 'PDF Report' },
                        { format: 'png', icon: FileImage, label: 'PNG Image' },
                        { format: 'json', icon: Database, label: 'JSON Data' },
                        { format: 'csv', icon: Database, label: 'CSV Data' }
                      ].map(({ format, icon: Icon, label }) => (
                        <button
                          key={format}
                          onClick={() => setExportOptions(prev => ({ ...prev, format: format as any }))}
                          className={`p-3 rounded-lg border transition-all ${
                            exportOptions.format === format
                              ? 'border-purple-500 bg-purple-900 text-purple-100'
                              : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <Icon size={20} className="mx-auto mb-1" />
                          <div className="text-xs">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Options
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeVisual}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeVisual: e.target.checked 
                          }))}
                          className="mr-2 rounded"
                          disabled={exportOptions.format === 'json' || exportOptions.format === 'csv'}
                        />
                        <span className="text-sm text-gray-300">Include visual representation</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeData}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeData: e.target.checked 
                          }))}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm text-gray-300">Include cost data</span>
                      </label>
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin mr-2">👻</div>
                          {exportOptions.format === 'pdf' ? 'Generating PDF...' : 'Exporting...'}
                        </>
                      ) : (
                        <>
                          <Download size={16} className="mr-2" />
                          Export {exportOptions.format.toUpperCase()}
                        </>
                      )}
                    </button>

                    <button
                      onClick={handlePrint}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Printer size={16} className="mr-2" />
                      Print Mansion
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'share' && (
                <div className="space-y-6">
                  {!shareLink ? (
                    <>
                      {/* Share Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Share Settings
                        </label>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              <Clock size={12} className="inline mr-1" />
                              Expiration (hours)
                            </label>
                            <select
                              value={shareOptions.expirationHours}
                              onChange={(e) => setShareOptions(prev => ({ 
                                ...prev, 
                                expirationHours: parseInt(e.target.value) 
                              }))}
                              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                            >
                              <option value={1}>1 hour</option>
                              <option value={6}>6 hours</option>
                              <option value={24}>24 hours</option>
                              <option value={168}>1 week</option>
                              <option value={720}>1 month</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              <Eye size={12} className="inline mr-1" />
                              Max Views (optional)
                            </label>
                            <input
                              type="number"
                              placeholder="Unlimited"
                              value={shareOptions.maxViews || ''}
                              onChange={(e) => setShareOptions(prev => ({ 
                                ...prev, 
                                maxViews: e.target.value ? parseInt(e.target.value) : undefined
                              }))}
                              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              <Lock size={12} className="inline mr-1" />
                              Password (optional)
                            </label>
                            <input
                              type="password"
                              placeholder="No password"
                              value={shareOptions.password || ''}
                              onChange={(e) => setShareOptions(prev => ({ 
                                ...prev, 
                                password: e.target.value || undefined
                              }))}
                              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={shareOptions.includeData}
                              onChange={(e) => setShareOptions(prev => ({ 
                                ...prev, 
                                includeData: e.target.checked 
                              }))}
                              className="mr-2 rounded"
                            />
                            <span className="text-sm text-gray-300">Include cost data</span>
                          </label>
                        </div>
                      </div>

                      {/* Generate Share Link */}
                      <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        {isSharing ? (
                          <>
                            <div className="animate-spin mr-2">👻</div>
                            Creating Link...
                          </>
                        ) : (
                          <>
                            <Share2 size={16} className="mr-2" />
                            Generate Shareable Link
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Share Link Generated */}
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Shareable Link</span>
                          <span className="text-xs text-gray-500">
                            Expires: {shareLink.expiresAt.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="bg-gray-900 rounded p-2 mb-3">
                          <code className="text-xs text-purple-300 break-all">
                            {shareLink.url}
                          </code>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleCopyLink}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center"
                          >
                            <Copy size={14} className="mr-1" />
                            Copy
                          </button>
                          
                          {shareService.isNativeShareSupported() && (
                            <button
                              onClick={handleNativeShare}
                              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center"
                            >
                              <Share2 size={14} className="mr-1" />
                              Share
                            </button>
                          )}
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="text-center">
                        <img
                          src={shareService.generateQRCode(shareLink.url)}
                          alt="QR Code"
                          className="mx-auto mb-2 rounded"
                        />
                        <p className="text-xs text-gray-400">Scan to view on mobile</p>
                      </div>

                      {/* Social Share */}
                      {socialUrls && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Share on Social Media
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={socialUrls.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center"
                            >
                              <ExternalLink size={14} className="mr-1" />
                              Twitter
                            </a>
                            <a
                              href={socialUrls.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-800 hover:bg-blue-900 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center"
                            >
                              <ExternalLink size={14} className="mr-1" />
                              LinkedIn
                            </a>
                            <a
                              href={socialUrls.email}
                              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center"
                            >
                              <ExternalLink size={14} className="mr-1" />
                              Email
                            </a>
                            <a
                              href={socialUrls.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center"
                            >
                              <ExternalLink size={14} className="mr-1" />
                              Facebook
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Create New Link */}
                      <button
                        onClick={() => setShareLink(null)}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Create New Link
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};