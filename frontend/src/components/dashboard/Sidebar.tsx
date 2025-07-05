import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  subItems?: { path: string; label: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCollapse }) => {
  const [currentPath, setCurrentPath] = useState("/dashboard");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  const menuItems: MenuItem[] = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠", badge: 3 },
    { path: "/forecasts", label: "Forecasts", icon: "📈" },
    { path: "/opportunities", label: "Opportunities", icon: "💡", badge: 5 },
    { path: "/automation", label: "Automation", icon: "⚡" },
    { path: "/reports", label: "Reports", icon: "📊" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path: string) => currentPath === path;
  const isParentActive = (item: MenuItem) => {
    if (isActive(item.path)) return true;
    return item.subItems?.some(sub => isActive(sub.path)) || false;
  };

  return (
    <motion.aside 
      className="relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 flex flex-col"
      animate={{ width: collapsed ? 64 : 256 }}
      initial={false}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                B
              </div>
              <span className="font-semibold text-slate-800 dark:text-white">BI Project</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isParentActive(item);
          const expanded = expandedItems.has(item.path);
          
          return (
            <div key={item.path}>
              <button
                onClick={() => {
                  setCurrentPath(item.path);
                  if (item.subItems) toggleExpanded(item.path);
                }}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 relative group
                  ${active 
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-r-full shadow-lg"
                  />
                )}
                
                {/* Icon with glow effect when active */}
                <span className={`text-xl relative ${active ? 'drop-shadow-lg' : ''}`}>
                  {item.icon}
                  {active && (
                    <div className="absolute inset-0 blur-md opacity-50">
                      {item.icon}
                    </div>
                  )}
                </span>
                
                {/* Label */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {/* Badge */}
                {!collapsed && item.badge && (
                  <span className={`
                    px-2 py-0.5 text-xs rounded-full font-medium
                    ${active 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
                
                {/* Expand icon for sub-items */}
                {!collapsed && item.subItems && (
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              
              {/* Hover tooltip for collapsed state */}
              {collapsed && hoveredItem === item.path && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute left-full ml-2 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-md shadow-lg z-50 whitespace-nowrap"
                  style={{ top: `${menuItems.indexOf(item) * 44 + 88}px` }}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                    <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-800 dark:border-r-slate-700" />
                  </div>
                </motion.div>
              )}
              
              {/* Sub-items */}
              <AnimatePresence>
                {!collapsed && expanded && item.subItems && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-1 ml-9 space-y-1 overflow-hidden"
                  >
                    {item.subItems.map(subItem => (
                      <button
                        key={subItem.path}
                        onClick={() => setCurrentPath(subItem.path)}
                        className={`
                          w-full text-left block px-3 py-2 text-sm rounded-md transition-colors
                          ${isActive(subItem.path)
                            ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }
                        `}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">User Name</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">user@example.com</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Sidebar;