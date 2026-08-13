import React from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MandatoryField } from '../lib/profileCompleteness';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCompleting: () => void;
  missingFields: MandatoryField[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export default function CompleteProfileModal({
  isOpen,
  onClose,
  onStartCompleting,
  missingFields,
  completedCount,
  totalCount,
  percentage,
}: CompleteProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-saffron/20 overflow-hidden relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-saffron via-amber-400 to-maroon" />

        {/* Close (X) Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-all focus:outline-none"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-saffron/10 rounded-2xl flex items-center justify-center border border-saffron/20 text-saffron shadow-inner">
              <Sparkles className="w-8 h-8 animate-pulse text-saffron" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Complete Your Profile for Better Matches
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed max-w-md mx-auto">
              Please fill in all required details to complete your profile and receive better, more relevant matches. Complete information helps other community members find you and improves your matching experience.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-stone-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-saffron" /> Profile Progress
              </span>
              <span className="text-saffron font-black">{percentage}% Complete</span>
            </div>
            <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-saffron to-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 font-medium text-right">
              {completedCount} of {totalCount} mandatory details completed
            </p>
          </div>

          {/* Incomplete Fields List */}
          {missingFields.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Pending Mandatory Information ({missingFields.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-amber-50/50 rounded-xl border border-amber-200/50">
                {missingFields.map((field) => (
                  <span
                    key={field.key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-amber-900 border border-amber-300 rounded-lg text-xs font-medium shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-saffron"></span>
                    {field.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notice Banner */}
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Completing mandatory fields is required to unlock full website access (Home, Profile Search, and Matches).
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onStartCompleting}
              className="flex-1 bg-saffron hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-saffron/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Profile Now</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl transition-all text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
