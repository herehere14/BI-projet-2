import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────
   Components
   ───────────────────────────────────────────────────────── */
import Layouts from "../components/Layouts";
import Sidebar from "../components/dashboard/Sidebar";
import MetricsBar from "../components/dashboard/MetricsBar";
import AlertStream from "../components/dashboard/AlertStream";
import ForecastChart from "../components/dashboard/ForecastChart";
import EfficiencyGauge from "../components/dashboard/EfficiencyGauge";
import MarketIntel from "../components/dashboard/MarketIntel";
import NewsTicker from "../components/dashboard/NewsTicker";
import SearchBar from "../components/SearchBar";
import { useDashboardData } from "../hooks/useDashboardData";
import { useAIAnalysis } from "../hooks/useAIAnalysis";
import { fetchCompany } from "../hooks/api";
import type { Company } from "../types";




/* ────────────────────────────────────────────────────────────
   Dashboard Page
   ───────────────────────────────────────────────────────── */
const Dashboard: React.FC = () => {
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [activeView, setActiveView] = useState<"overview" | "analysis" | "automation">("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyId, setCompanyId] = useState<string>();
  
  const { data: dashboardData, isLoading } = useDashboardData(companyId);
  const { data: aiData } = useAIAnalysis(companyId, "latest business insights");
  
  useEffect(() => {
    fetchCompany()
      .then((c: Company) => setCompanyId(c.id))
      .catch((err: unknown) => console.error("Failed to load company", err));
  }, []);


  // Simulated real-time updates
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  const handleAlertAction = (action: string, alertId: string) => {
    const alert = dashboardData?.alerts.find((a) => a.id === alertId);

    if (!alert) return;

    switch (action) {
      case "marketing":
        console.log("Launching marketing automation for:", alert);
        break;
      case "logistics":
        console.log("Initiating logistics response for:", alert);
        break;
      case "analysis":
        setSelectedAlert(alert);
        setActiveView("analysis");
        break;
      default:
        console.log("Action:", action, "Alert:", alert);
    }
  };

  return (
    <Layouts>
      {/* Left sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />

      {/* Main content area */}
      <section className="flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Enhanced header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex-1 max-w-2xl">
              <SearchBar onSearch={(query) => console.log("Search:", query)} />
            </div>

            {/* View switcher */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(["overview", "analysis", "automation"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`
                    px-4 py-2 text-xs font-medium rounded-md transition-all duration-200
                    ${activeView === view
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }
                  `}
                >
                  {view.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle fullscreen (⌘F)"
              >
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isFullscreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Metrics bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <MetricsBar metrics={dashboardData?.metrics || []} isLoading={isLoading} />

        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeView === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 space-y-6"
              >
                {/* Main grid */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Alerts column */}
                  <motion.div 
                    className="col-span-12 lg:col-span-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <AlertStream alerts={dashboardData?.alerts || []} onAction={handleAlertAction} />

                    </div>
                  </motion.div>

                  {/* Charts area */}
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-[290px]"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Revenue Forecast & Impact Analysis
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">30 DAY VIEW</span>
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                      </div>
                      <ForecastChart data={aiData?.forecast} />

                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-[290px]"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Operational Efficiency Index
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">REAL-TIME</span>
                      </div>
                      <EfficiencyGauge value={78} target={85} industry={72} />
                    </motion.div>
                  </div>
                </div>

                {/* AI Insights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
                >
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                    AI-Powered Insights & Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { icon: "🚀", title: "Growth Opportunity", desc: "Perth sustainable market shows 340% search growth", action: "Launch Campaign", color: "from-blue-500 to-cyan-500" },
                      { icon: "⚡", title: "Cost Optimization", desc: "Bundle strategy could improve margins by 2.3%", action: "Implement Now", color: "from-purple-500 to-pink-500" },
                      { icon: "🎯", title: "Customer Insight", desc: "VIP segment activity up 23% this week", action: "Personalize Offers", color: "from-orange-500 to-red-500" }
                    ].map((insight, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="relative overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 cursor-pointer group"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${insight.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                        <div className="relative z-10">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{insight.icon}</span>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                {insight.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                {insight.desc}
                              </p>
                              <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                {insight.action} →
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeView === "analysis" && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                    Deep Analysis Mode
                  </h2>
                  {selectedAlert ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          Analyzing: {selectedAlert.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedAlert.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {["Root Cause Analysis", "Impact Assessment", "Recommendations"].map((item, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">{item}</h4>
                            <div className="h-32 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-500 dark:text-slate-400">
                        Select an alert to begin deep analysis
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === "automation" && (
              <motion.div
                key="automation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                    Automation Control Center
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: "Marketing Automation", desc: "3 campaigns ready", status: "ready", icon: "🎯" },
                      { title: "Supply Chain", desc: "2 optimizations pending", status: "pending", icon: "📦" },
                      { title: "Financial Controls", desc: "All systems operational", status: "active", icon: "💰" }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -4 }}
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-3xl">{item.icon}</span>
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${item.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              item.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}
                          `}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                          {item.desc}
                        </p>
                        <button className="w-full py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200">
                          Configure
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* News ticker */}
        <NewsTicker />
      </section>

      {/* Right sidebar - Market Intelligence */}
      <aside className="hidden xl:block w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
        <MarketIntel />
      </aside>
    </Layouts>
  );
};

export default Dashboard;