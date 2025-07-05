import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BusinessType: React.FC = () => {


  const nav = useNavigate();

  const [selectedType, setSelectedType] = useState("");
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  
  const industries = [
    { 
      value: "e-commerce", 
      label: "E-commerce & Retail", 
      icon: "🛍️",
      description: "Online stores, marketplaces, and retail operations",
      color: "from-purple-500 to-pink-500"
    },
    { 
      value: "manufacturing", 
      label: "Manufacturing", 
      icon: "🏭",
      description: "Production, assembly, and industrial operations",
      color: "from-gray-500 to-gray-700"
    },
    { 
      value: "finance", 
      label: "Financial Services", 
      icon: "💳",
      description: "Banking, insurance, and financial technology",
      color: "from-green-500 to-emerald-600"
    },
    { 
      value: "healthcare", 
      label: "Healthcare", 
      icon: "🏥",
      description: "Medical services, pharmaceuticals, and health tech",
      color: "from-red-500 to-pink-600"
    },
    { 
      value: "technology", 
      label: "Technology & Software", 
      icon: "💻",
      description: "SaaS, software development, and IT services",
      color: "from-blue-500 to-indigo-600"
    },
    { 
      value: "logistics", 
      label: "Logistics & Supply Chain", 
      icon: "📦",
      description: "Transportation, warehousing, and distribution",
      color: "from-orange-500 to-amber-600"
    },
    { 
      value: "real-estate", 
      label: "Real Estate", 
      icon: "🏢",
      description: "Property management, development, and brokerage",
      color: "from-teal-500 to-cyan-600"
    },
    { 
      value: "hospitality", 
      label: "Hospitality & Tourism", 
      icon: "🏨",
      description: "Hotels, restaurants, and travel services",
      color: "from-yellow-500 to-orange-600"
    },
    { 
      value: "education", 
      label: "Education", 
      icon: "🎓",
      description: "Schools, universities, and learning platforms",
      color: "from-violet-500 to-purple-600"
    },
    { 
      value: "other", 
      label: "Other", 
      icon: "📊",
      description: "Other industries and business types",
      color: "from-slate-500 to-slate-700"
    }
  ];

  const handleContinue = () => {
    if (selectedType) {
      nav("data-sources", { state: { biz_type: selectedType } });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          What's your industry?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          We'll customize Business Brain to provide insights specific to your sector
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {industries.map((industry, index) => (
          <motion.button
            key={industry.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType(industry.value)}
            onMouseEnter={() => setHoveredType(industry.value)}
            onMouseLeave={() => setHoveredType(null)}
            className={`
              relative overflow-hidden p-6 rounded-xl border-2 transition-all duration-300
              ${selectedType === industry.value 
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            {/* Background gradient on hover/select */}
            <div 
              className={`
                absolute inset-0 bg-gradient-to-br ${industry.color} opacity-0 transition-opacity duration-300
                ${selectedType === industry.value || hoveredType === industry.value ? 'opacity-5' : ''}
              `}
            />

            <div className="relative z-10 flex items-start gap-4 text-left">
              {/* Icon with glow effect */}
              <div className="relative">
                <div className={`
                  absolute inset-0 blur-xl transition-opacity duration-300
                  ${selectedType === industry.value ? 'opacity-50' : 'opacity-0'}
                `}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${industry.color} rounded-lg`} />
                </div>
                <div className={`
                  relative w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                  bg-slate-100 dark:bg-slate-800 transition-all duration-300
                  ${selectedType === industry.value ? 'shadow-lg' : ''}
                `}>
                  {industry.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className={`
                  font-semibold mb-1 transition-colors duration-300
                  ${selectedType === industry.value 
                    ? 'text-blue-900 dark:text-blue-300' 
                    : 'text-slate-900 dark:text-white'
                  }
                `}>
                  {industry.label}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {industry.description}
                </p>
              </div>

              {/* Selection indicator */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${selectedType === industry.value 
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400' 
                  : 'border-slate-300 dark:border-slate-600'
                }
              `}>
                {selectedType === industry.value && (
                  <motion.svg 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3.5 h-3.5 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </motion.svg>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <button
          disabled={!selectedType}
          onClick={handleContinue}
          className={`
            relative overflow-hidden px-8 py-4 rounded-lg font-semibold text-white transition-all duration-300
            ${selectedType 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
              : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
            }
          `}
        >
          {/* Animated background */}
          {selectedType && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
            />
          )}
          
          <span className="relative z-10 flex items-center gap-2">
            Continue
            {selectedType && (
              <motion.svg 
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            )}
          </span>
        </button>
      </motion.div>
    </div>
  );
};

export default BusinessType;
