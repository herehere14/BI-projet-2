import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layouts from "../components/Layouts";
import ForecastChart from "../components/dashboard/ForecastChart";
import Sidebar from "../components/dashboard/Sidebar";

interface Scenario {
  id: string;
  name: string;
  description: string;
  impact: number;
  confidence: number;
  color: string;
}

const Forecasts: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedScenario, setSelectedScenario] = useState("baseline");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const metrics = [
    { id: "revenue", label: "Revenue", icon: "💰", unit: "$", current: "3.2M" },
    { id: "margin", label: "Gross Margin", icon: "📊", unit: "%", current: "34.2%" },
    { id: "inventory", label: "Inventory Turn", icon: "📦", unit: "x", current: "4.8x" },
    { id: "cash", label: "Cash Flow", icon: "💵", unit: "$", current: "847K" },
    { id: "customers", label: "Customer Growth", icon: "👥", unit: "", current: "8,421" },
    { id: "nps", label: "NPS Score", icon: "⭐", unit: "", current: "72" }
  ];

  const scenarios: Scenario[] = [
    { id: "baseline", name: "Baseline", description: "Current trajectory", impact: 0, confidence: 85, color: "from-slate-500 to-slate-600" },
    { id: "optimistic", name: "Optimistic", description: "Best case scenario", impact: 23, confidence: 65, color: "from-green-500 to-emerald-600" },
    { id: "pessimistic", name: "Pessimistic", description: "Worst case scenario", impact: -18, confidence: 70, color: "from-red-500 to-pink-600" },
    { id: "strategic", name: "Strategic", description: "With planned initiatives", impact: 15, confidence: 78, color: "from-blue-500 to-cyan-600" }
  ];

  const insights = [
    { type: "opportunity", icon: "🚀", title: "Growth Acceleration", desc: "Launch Perth campaign within 2 weeks to capture $380K opportunity", impact: "+12%" },
    { type: "risk", icon: "⚠️", title: "Supply Chain Risk", desc: "Malacca Strait delays could impact Q3 revenue by $156K", impact: "-4.8%" },
    { type: "optimization", icon: "💡", title: "Margin Improvement", desc: "Bundle strategy could protect margins while maintaining volume", impact: "+2.3%" }
  ];

  const selectedMetricData = metrics.find(m => m.id === selectedMetric);

  return (
    <Layouts>
      <Sidebar />
      
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Forecasts & Scenarios
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Model future outcomes and plan for various scenarios
              </p>
            </div>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Advanced Settings
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((metric) => (
              <motion.button
                key={metric.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMetric(metric.id)}
                className={`
                  relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-200
                  ${selectedMetric === metric.id
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">{metric.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {metric.label}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {metric.current}
                    </p>
                  </div>
                </div>
                {selectedMetric === metric.id && (
                  <motion.div
                    layoutId="metricIndicator"
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 pointer-events-none"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Chart Section */}
            <div className="col-span-12 lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-[500px]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedMetricData?.label} Forecast
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Scenario: <span className="font-medium text-slate-900 dark:text-white">
                        {scenarios.find(s => s.id === selectedScenario)?.name}
                      </span>
                    </p>
                  </div>
                  
                  {/* Time range selector */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {["7d", "30d", "90d", "1y"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`
                          px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                          ${timeRange === range
                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }
                        `}
                      >
                        {range.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[400px]">
                  <ForecastChart />
                </div>
              </motion.div>
            </div>

            {/* Scenarios Panel */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                  Scenarios
                </h3>
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <motion.button
                      key={scenario.id}
                      whileHover={{ x: 4 }}
                      onClick={() => setSelectedScenario(scenario.id)}
                      className={`
                        w-full text-left p-4 rounded-lg border transition-all duration-200
                        ${selectedScenario === scenario.id
                          ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                            {scenario.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {scenario.description}
                          </p>
                        </div>
                        <span className={`
                          text-xs font-bold
                          ${scenario.impact > 0 ? "text-green-600 dark:text-green-400" : 
                            scenario.impact < 0 ? "text-red-600 dark:text-red-400" : 
                            "text-slate-600 dark:text-slate-400"}
                        `}>
                          {scenario.impact > 0 ? "+" : ""}{scenario.impact}%
                        </span>
                      </div>
                      
                      {/* Confidence bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Confidence</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {scenario.confidence}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${scenario.confidence}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className={`h-full bg-gradient-to-r ${scenario.color}`}
                          />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Scenario Parameters (shown in advanced mode) */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                      Scenario Parameters
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: "Growth Rate", value: 12, unit: "%" },
                        { label: "Market Share", value: 28, unit: "%" },
                        { label: "Cost Reduction", value: 8, unit: "%" },
                        { label: "Conversion Rate", value: 3.2, unit: "%" }
                      ].map((param, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {param.label}
                            </label>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {param.value}{param.unit}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            defaultValue={param.value}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                AI-Generated Insights
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-500 dark:text-slate-400">LIVE ANALYSIS</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 cursor-pointer group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {insight.desc}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`
                        text-sm font-bold
                        ${insight.impact.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                      `}>
                        {insight.impact}
                      </span>
                      <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        View Details →
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Save Scenario
              </button>
              <button className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Apply Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layouts>
  );
};

export default Forecasts;