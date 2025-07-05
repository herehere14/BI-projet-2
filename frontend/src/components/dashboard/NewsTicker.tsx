import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TickerItem {
  label: string;
  value: string;
  change?: string;
  status?: "positive" | "negative" | "warning" | "neutral";
  priority?: "high" | "medium" | "low";
}

const NewsTicker: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const tickerItems: TickerItem[] = [
    { label: "ASX 200", value: "7,421.50", change: "▼0.3%", status: "negative", priority: "high" },
    { label: "AUD/USD", value: "0.6542", change: "▲0.1%", status: "positive" },
    { label: "WEATHER", value: "SYD 18°C Clear | MEL 14°C Rain | BNE 24°C Sunny", status: "neutral" },
    { label: "SUPPLY ALERTS", value: "3 Active", status: "warning", priority: "high" },
    { label: "COMPETITOR MOVES", value: "2 Today", status: "negative", priority: "medium" },
    { label: "OPPORTUNITIES", value: "5 Identified", status: "positive", priority: "high" },
    { label: "INVENTORY", value: "1,247 SKUs", status: "neutral" },
    { label: "LOW STOCK", value: "17 Items", status: "warning", priority: "medium" },
    { label: "CUSTOMER ALERTS", value: "VIP Activity ▲23%", status: "positive", priority: "high" },
    { label: "NPS TREND", value: "POSITIVE", status: "positive" },
    { label: "CASH RUNWAY", value: "14.2 Months", status: "neutral" },
    { label: "AI CONFIDENCE", value: "94.2%", change: "▲2.1%", status: "positive" },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "positive": return "text-green-500 dark:text-green-400";
      case "negative": return "text-red-500 dark:text-red-400";
      case "warning": return "text-amber-500 dark:text-amber-400";
      default: return "text-slate-600 dark:text-slate-400";
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    if (!priority) return null;
    switch (priority) {
      case "high": return "●";
      case "medium": return "◐";
      case "low": return "○";
      default: return null;
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 overflow-hidden z-50 shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-full">
        {/* Gradient edges for depth */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
        
        <motion.div 
          className="flex h-full items-center"
          animate={{ x: isPaused ? 0 : "-50%" }}
          transition={{ 
            duration: 30, 
            ease: "linear", 
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          {/* First set */}
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <motion.div
              key={`ticker-${index}`}
              className="inline-flex items-center gap-2 mx-6 whitespace-nowrap group cursor-pointer"
              onMouseEnter={() => setHoveredItem(`${item.label}-${index}`)}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={{ scale: 1.05 }}
            >
              {item.priority && (
                <span className={`text-xs ${getStatusColor(item.status)} animate-pulse`}>
                  {getPriorityIndicator(item.priority)}
                </span>
              )}
              
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {item.label}:
              </span>
              
              <span className={`text-xs font-semibold ${getStatusColor(item.status)}`}>
                {item.value}
              </span>
              
              {item.change && (
                <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.change}
                </span>
              )}
              
              {/* Hover tooltip */}
              {hoveredItem === `${item.label}-${index}` && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full mb-2 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-md shadow-lg pointer-events-none"
                >
                  <div className="font-medium">{item.label}</div>
                  <div className="text-slate-300">{item.value}</div>
                  {item.change && <div className="text-slate-400">{item.change}</div>}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Live indicator */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">Live</span>
      </div>
    </div>
  );
};

export default NewsTicker;