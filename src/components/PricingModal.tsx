import React, { useState } from 'react';
import { X, Check, CreditCard, Sparkles, Shield, Clock, Award, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { BILLING_PLANS } from '../data/presets';
import { BillingPlan } from '../types/makeover';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  onAddCredits: (amount: number, planName: string) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  credits,
  onAddCredits,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>(BILLING_PLANS[1]);
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Owner admin price configuration state
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [customSinglePrice, setCustomSinglePrice] = useState(9.99);
  const [customDayPassPrice, setCustomDayPassPrice] = useState(29.0);
  const [customMonthlyPrice, setCustomMonthlyPrice] = useState(79.0);

  if (!isOpen) return null;

  const handleSimulatePurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      let addedCredits = 1;
      if (selectedPlan.id === 'single') addedCredits = 1;
      if (selectedPlan.id === 'day_pass') addedCredits = 25;
      if (selectedPlan.id === 'pro_monthly') addedCredits = 100;

      onAddCredits(addedCredits, selectedPlan.name);
      setSuccessMessage(`Success! ${addedCredits} Makeover Passes added to your session.`);
      setTimeout(() => {
        setSuccessMessage(null);
        setIsCheckoutStep(false);
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">See It Finished Passes & Pricing</h2>
              <p className="text-xs text-slate-400">Pay-per-use, session passes, or unlimited contractor access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Bar */}
        <div className="px-6 py-3 bg-teal-50/80 border-b border-teal-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-900">Current Balance:</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold">{credits} Passes Available</span>
          </div>
          <button
            onClick={() => setShowAdminControls(!showAdminControls)}
            className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdminControls ? 'Hide Owner Settings' : 'Owner Pricing Controls'}</span>
          </button>
        </div>

        {/* Owner Settings Drawer */}
        {showAdminControls && (
          <div className="p-4 bg-slate-100 border-b border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Owner Rate Settings (Adjust for your clients):</span>
              <span className="text-[11px] text-slate-500">Live rate overrides</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Pay-Per-Use ($):</label>
                <input
                  type="number"
                  step="1"
                  value={customSinglePrice}
                  onChange={(e) => setCustomSinglePrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">24h Day Pass ($):</label>
                <input
                  type="number"
                  step="1"
                  value={customDayPassPrice}
                  onChange={(e) => setCustomDayPassPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Monthly Pro ($):</label>
                <input
                  type="number"
                  step="1"
                  value={customMonthlyPrice}
                  onChange={(e) => setCustomMonthlyPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">
          {successMessage ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{successMessage}</h3>
              <p className="text-xs text-slate-500">Your renders are now ready to generate.</p>
            </div>
          ) : isCheckoutStep ? (
            /* Checkout Sheet */
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>{selectedPlan.name}</span>
                  <span className="text-teal-700">
                    ${selectedPlan.id === 'single'
                      ? customSinglePrice
                      : selectedPlan.id === 'day_pass'
                      ? customDayPassPrice
                      : customMonthlyPrice}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedPlan.description}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    defaultValue="Jane Homeowner"
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue="•••• •••• •••• 4242"
                      className="w-full p-2 pl-9 rounded-lg border border-slate-200 font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Exp Date</label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">CVC</label>
                    <input
                      type="text"
                      defaultValue="888"
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutStep(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePurchase}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Activating Pass...</span>
                    </>
                  ) : (
                    <span>Confirm & Activate</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Plan Cards */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BILLING_PLANS.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  const price =
                    plan.id === 'single'
                      ? customSinglePrice
                      : plan.id === 'day_pass'
                      ? customDayPassPrice
                      : customMonthlyPrice;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/20 shadow-md ring-2 ring-teal-500/10'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                          Most Popular
                        </span>
                      )}

                      <div className="space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">${price}</span>
                            <span className="text-xs text-slate-500">/{plan.period}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          {plan.features.map((feat, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                              <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan);
                            setIsCheckoutStep(true);
                          }}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-teal-600 hover:bg-teal-500 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          Select Pass
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instant Free Trial / Complimentary Passes Button */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="font-bold text-slate-800">Testing the Platform?</p>
                  <p className="text-slate-500 text-[11px]">
                    Instantly add 3 complimentary testing passes to your session to preview all features.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onAddCredits(3, 'Complimentary Trial');
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-colors whitespace-nowrap"
                >
                  +3 Free Passes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
