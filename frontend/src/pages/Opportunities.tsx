import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layouts from "../components/Layouts";
import Sidebar from "../components/dashboard/Sidebar";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: "market" | "product" | "operational" | "strategic";
  potential: number;
  confidence: number;
  timeframe: string;
  status: "new" | "analyzing" | "ready" | "implemented";
  actions: string[];
  risk: "low" | "medium" | "high";
  requirements: string[];
}

const Opportunities: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "market" | "product" | "operational" | "strategic">("all");
  const [sortBy, setSortBy] = useState<"potential" | "confidence" | "timeframe">("potential");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const opportunities: Opportunity[] = [
    {
      id: "1",
      title: "Perth Sustainable Gear Market",
      description: "340% increase in sustainable hiking gear searches. Untapped market with high growth potential and low competition.",
      type: "market",
      potential: 380000,
      confidence: 94,
      timeframe: "2-4 weeks",
      status: "ready",
      actions: ["Launch Campaign", "Analyze Demographics", "Partner with Influencers"],
      risk: "low",
      requirements: ["Marketing budget: $15K", "Inventory: 500 units", "Campaign team: 3 people"]
    },
    {
      id: "2",
      title: "Bundle Strategy for Margin Protection",
      description: "Create product bundles to maintain margins while competing on perceived value. AI analysis shows 2.3% margin improvement.",
      type: "strategic",
      potential: 156000,
      confidence: 87,
      timeframe: "1-2 weeks",
      status: "ready",
      actions: ["Design Bundles", "Test Pricing", "Update Inventory"],
      risk: "low",
      requirements: ["No additional budget", "SKU reorganization", "POS system update"]
    },
    {
      id: "3",
      title: "Supply Chain Optimization",
      description: "Switch to regional suppliers to reduce lead times by 40% and transportation costs by $247K annually.",
      type: "operational",
      potential: 247000,
      confidence: 82,
      timeframe: "4-6 weeks",
      status: "analyzing",
      actions: ["Evaluate Suppliers", "Negotiate Terms", "Test Quality"],
      risk: "medium",
      requirements: ["Supplier audits", "Quality testing", "Contract negotiations"]
    },
    {
      id: "4",
      title: "AI-Powered Inventory Management",
      description: "Implement predictive analytics to optimize stock levels, reducing carrying costs by 18% while improving availability.",
      type: "operational",
      potential: 189000,
      confidence: 91,
      timeframe: "2-3 weeks",
      status: "new",
      actions: ["Select Platform", "Integrate Systems", "Train Team"],
      risk: "low",
      requirements: ["Software license: $2K/mo", "Integration: 40 hours", "Training: 2 days"]
    },
    {
      id: "5",
      title: "Premium Eco-Line Launch",
      description: "Develop high-margin sustainable product line targeting environmentally conscious consumers. 45% gross margin expected.",
      type: "product",
      potential: 520000,
      confidence: 78,
      timeframe: "8-12 weeks",
      status: "analyzing",
      actions: ["Product Development", "Market Research", "Launch Strategy"],
      risk: "medium",
      requirements: ["R&D budget: $50K", "Design team", "Sustainable suppliers"]
    },
    {
      id: "6",
      title: "Customer Retention Program",
      description: "AI-identified opportunity to reduce churn by 23% through personalized engagement and loyalty rewards.",
      type: "strategic",
      potential: 295000,
      confidence: 89,
      timeframe: "3-4 weeks",
      status: "new",
      actions: ["Design Program", "Set Up Automation", "Launch Pilot"],
      risk: "low",
      requirements: ["CRM upgrade", "Reward budget: $20K", "Email automation"]
    }
  ];

  const getTypeIcon = (type: Opportunity["type"]) => {
    switch (type) {
      case "market": return "🌍";
      case "product": return "📦";
      case "operational": return "⚙️";
      case "strategic": return "🎯";
    }
  };

  const getTypeColor = (type: Opportunity["type"]) => {
    switch (type) {
      case "market": return "from-blue-500 to-cyan-600";
      case "product": return "from-purple-500 to-pink-600";
      case "operational": return "from-orange-500 to-amber-600";
      case "strategic": return "from-green-500 to-emerald-600";
    }
  };

  const getStatusColor = (status: Opportunity["status"]) => {
    switch (status) {
      case "new": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "analyzing": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "ready": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "implemented": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const getRiskColor = (risk: Opportunity["risk"]) => {
    switch (risk) {
      case "low": return "text-green-600 dark:text-green-400";
      case "medium": return "text-amber-600 dark:text-amber-400";
      case "high": return "text-red-600 dark:text-red-400";
    }
  };

  const filteredOpportunities = opportunities
    .filter(opp => filter === "all" || opp.type === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case "potential": return b.potential - a.potential;
        case "confidence": return b.confidence - a.confidence;
        case "timeframe": return a.timeframe.localeCompare(b.timeframe);
        default: return 0;
      }
    });

  const totalPotential = filteredOpportunities.reduce((sum, opp) => sum + opp.potential, 0);
  const avgConfidence = Math.round(filteredOpportunities.reduce((sum, opp) => sum + opp.confidence, 0) / filteredOpportunities.length);
  const readyCount = filteredOpportunities.filter(opp => opp.status === "ready").length;

  return (
    <Layouts>
      <Sidebar />
      
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Opportunities
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                AI-identified opportunities for growth and optimization
              </p>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Filters and Stats */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              {(["all", "market", "product", "operational", "strategic"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${filter === type
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }
                  `}
                >
                  {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== "all" && (
                    <span className="ml-2 text-xs opacity-70">
                      {opportunities.filter(o => o.type === type).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="potential">Sort by Potential Value</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="timeframe">Sort by Timeframe</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Potential", value: `$${(totalPotential / 1000).toFixed(0)}K`, icon: "💰", color: "from-green-500 to-emerald-600" },
              { label: "Ready to Implement", value: readyCount.toString(), icon: "🚀", color: "from-blue-500 to-cyan-600" },
              { label: "Avg. Confidence", value: `${avgConfidence}%`, icon: "📊", color: "from-purple-500 to-pink-600" },
              { label: "High Impact", value: filteredOpportunities.filter(o => o.confidence > 85).length.toString(), icon: "⚡", color: "from-orange-500 to-amber-600" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Opportunities Grid/List */}
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredOpportunities.map((opportunity, index) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedOpportunity(opportunity)}
                    className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 cursor-pointer group"
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getTypeColor(opportunity.type)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getTypeIcon(opportunity.type)}</span>
                          <div>
                            <span className={`inline-flex px-2 py-1 text-[10px] font-medium rounded-full ${getStatusColor(opportunity.status)}`}>
                              {opportunity.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Potential</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            ${(opportunity.potential / 1000).toFixed(0)}K
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {opportunity.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {opportunity.description}
                      </p>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Confidence</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${opportunity.confidence}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-600"
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {opportunity.confidence}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Timeframe</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {opportunity.timeframe}
                          </p>
                        </div>
                      </div>

                      {/* Risk indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Risk:</span>
                          <span className={`text-xs font-medium ${getRiskColor(opportunity.risk)}`}>
                            {opportunity.risk.toUpperCase()}
                          </span>
                        </div>
                        <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredOpportunities.map((opportunity, index) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedOpportunity(opportunity)}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-3xl">{getTypeIcon(opportunity.type)}</span>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {opportunity.title}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-[10px] font-medium rounded-full ${getStatusColor(opportunity.status)}`}>
                            {opportunity.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {opportunity.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          ${(opportunity.potential / 1000).toFixed(0)}K
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {opportunity.confidence}% confidence
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOpportunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOpportunity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTypeIcon(selectedOpportunity.type)}</span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedOpportunity.title}
                      </h2>
                      <span className={`inline-flex mt-1 px-2 py-1 text-[10px] font-medium rounded-full ${getStatusColor(selectedOpportunity.status)}`}>
                        {selectedOpportunity.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOpportunity(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedOpportunity.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Key Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Potential Value</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          ${(selectedOpportunity.potential / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Confidence</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedOpportunity.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Timeframe</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedOpportunity.timeframe}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Risk Level</span>
                        <span className={`text-sm font-bold ${getRiskColor(selectedOpportunity.risk)}`}>
                          {selectedOpportunity.risk.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Requirements</h3>
                    <ul className="space-y-1">
                      {selectedOpportunity.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOpportunity.actions.map((action, i) => (
                      <button
                        key={i}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layouts>
  );
};

export default Opportunities;