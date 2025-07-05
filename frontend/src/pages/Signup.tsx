import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SignupProps {
  onSignup?: (data: { email: string; password: string; fullName: string; company: string }) => void;
  onLoginClick?: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onLoginClick }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    company: "",
    role: "",
    companySize: "",
    acceptTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
        
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        
        if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
        break;
      
      case 2:
        if (!formData.fullName) newErrors.fullName = "Full name is required";
        if (!formData.company) newErrors.company = "Company name is required";
        if (!formData.role) newErrors.role = "Please select your role";
        if (!formData.companySize) newErrors.companySize = "Please select company size";
        break;
      
      case 3:
        if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      onSignup?.({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        company: formData.company
      });
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const stepTitles = [
    "Create your account",
    "Tell us about yourself",
    "Review and confirm"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center"
              >
                <div className="w-5 h-5 bg-white rounded" />
              </motion.div>
              <span className="text-xl font-bold">Business Brain</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{stepTitles[currentStep - 1]}</h1>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-3 mt-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: step <= currentStep ? "rgb(255, 255, 255)" : "rgba(255, 255, 255, 0.3)",
                      scale: step === currentStep ? 1.1 : 1
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      color: step <= currentStep ? "rgb(37, 99, 235)" : "white"
                    }}
                  >
                    {step < currentStep ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : step}
                  </motion.div>
                  {step < 3 && (
                    <div className={`w-12 h-0.5 ${step < currentStep ? 'bg-white' : 'bg-white/30'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                      } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                      placeholder="you@company.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.password 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                      } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                      placeholder="At least 8 characters"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                    
                    {/* Password strength indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ 
                                width: formData.password.length < 8 ? "33%" : 
                                       formData.password.length < 12 ? "66%" : "100%"
                              }}
                              className={`h-full ${
                                formData.password.length < 8 ? "bg-red-500" :
                                formData.password.length < 12 ? "bg-amber-500" : "bg-green-500"
                              }`}
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formData.password.length < 8 ? "Weak" :
                             formData.password.length < 12 ? "Medium" : "Strong"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.confirmPassword 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                      } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                      placeholder="Re-enter your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.fullName 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                        placeholder="John Doe"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => updateField("company", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.company 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                        placeholder="Acme Corp"
                      />
                      {errors.company && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Your role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => updateField("role", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.role 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                      } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all`}
                    >
                      <option value="">Select your role</option>
                      <option value="executive">Executive (C-Suite)</option>
                      <option value="manager">Manager / Director</option>
                      <option value="analyst">Analyst / Individual Contributor</option>
                      <option value="consultant">Consultant</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Company size
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["1-10", "11-50", "51-200", "200+"].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateField("companySize", size)}
                          className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                            formData.companySize === size
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {errors.companySize && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.companySize}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Summary */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                      Account Summary
                    </h3>
                    <dl className="space-y-3">
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-slate-600 dark:text-slate-400">Email</dt>
                        <dd className="text-sm font-medium text-slate-900 dark:text-white">{formData.email}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-slate-600 dark:text-slate-400">Name</dt>
                        <dd className="text-sm font-medium text-slate-900 dark:text-white">{formData.fullName}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-slate-600 dark:text-slate-400">Company</dt>
                        <dd className="text-sm font-medium text-slate-900 dark:text-white">{formData.company}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-slate-600 dark:text-slate-400">Role</dt>
                        <dd className="text-sm font-medium text-slate-900 dark:text-white capitalize">{formData.role}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-slate-600 dark:text-slate-400">Company Size</dt>
                        <dd className="text-sm font-medium text-slate-900 dark:text-white">{formData.companySize} employees</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Terms */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => updateField("acceptTerms", e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        I agree to the{" "}
                        <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                      What's included in your free trial:
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "14-day free trial, no credit card required",
                        "Full access to all features",
                        "Unlimited data sources and integrations",
                        "24/7 customer support"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-400">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Already have an account?
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                  ${isLoading
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Creating account...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Create Account
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400"
        >
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            SOC 2 Compliant
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            GDPR Compliant
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            256-bit Encryption
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;