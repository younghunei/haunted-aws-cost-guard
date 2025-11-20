import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2 } from 'lucide-react';
import { ExportPanel } from './ExportPanel';

export const ExportButton: React.FC = () => {
  const [showExportPanel, setShowExportPanel] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setShowExportPanel(true)}
        className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white px-3 py-2 rounded-lg shadow-lg transition-all border border-orange-500/50 group"
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 0 20px rgba(255, 107, 53, 0.5)"
        }}
        whileTap={{ scale: 0.95 }}
        title="Export & Share"
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-lg"
          >
            📤
          </motion.span>
          <span className="text-sm font-medium">Export & Share</span>
        </div>
        
        {/* Tooltip */}
        <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-900 to-purple-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-orange-500/50 shadow-lg">
          🎃 Export & Share your haunted mansion! 👻
        </div>
      </motion.button>

      <ExportPanel 
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
      />
    </>
  );
};