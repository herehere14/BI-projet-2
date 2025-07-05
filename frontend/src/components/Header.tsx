import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface HeaderProps {
  onThemeToggle?: () => void;
  theme?: "light" | "dark";
}

const Header: React.FC<HeaderProps> = ({ onThemeToggle, theme = "dark" }) => {
  const [time, setTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState({
    latency: 12,
    throughput: "1.2M/s",
    cpu: 34,
    connections: 847
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setSystemStatus({
        latency: 10 + Math.random() * 10,
        throughput: `${(1 + Math.random() * 0.5).toFixed(1)}M/s`,
        cpu: 30 + Math.random() * 20,
        connections: 800 + Math.floor(Math.random() * 100)
      });
    }, 5000);
    return () => clearInterval(statusTimer);
  }, []);

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 animate-gradient-x" />
      </div>

      <div className="relative z-10 h-full flex items-center justify-between px-6">
        {/* Left section - Logo and title */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg"
          >
            <div className="w-4 h-4 bg-white rounded-sm" />
          </motion.div>
          
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text uppercase tracking-wider">
              AI BIZ TERMINAL
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Decision Intelligence Platform
            </p>
          </div>
        </div>

        {/* Center section - System metrics */}
        <div className="hidden lg:flex items-center gap-6">
          <motion.div 
            className="flex items-center gap-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              LATENCY: {systemStatus.latency.toFixed(0)}ms
            </span>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              THROUGHPUT: {systemStatus.throughput}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${systemStatus.cpu > 50 ? 'bg-amber-500' : 'bg-green-500'}`} />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              CPU: {systemStatus.cpu.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Right section - Status and controls */}
        <div className="flex items-center gap-4">
          {/* Time display */}
          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {time.toLocaleDateString()}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
              {time.toLocaleTimeString()}
            </p>
          </div>

          {/* System status */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase">
                Connected
              </span>
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {systemStatus.connections} NODES
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">SC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
    </header>
  );
};

export default Header;