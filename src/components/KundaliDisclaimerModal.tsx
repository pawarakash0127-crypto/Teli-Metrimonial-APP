import React from 'react';
import { X, Sparkles, ShieldAlert, Info } from 'lucide-react';
import { ASTROLOGY_DISCLAIMER, SYSTEM_GENERATED_LABEL } from '../lib/gunaMilanUtils';

interface KundaliDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KundaliDisclaimerModal({ isOpen, onClose }: KundaliDisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative border border-saffron/20 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-stone-100 hover:bg-stone-200 text-stone-600 p-2 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-saffron">
          <div className="p-3 bg-orange-50 rounded-2xl border border-saffron/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900">
              Ashtakoota Kundali / Guna Milan
            </h3>
            <span className="text-xs font-semibold text-saffron bg-saffron/10 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              {SYSTEM_GENERATED_LABEL}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm text-stone-700 leading-relaxed mb-6">
          <p>
            Our system calculates Kundali compatibility using the traditional <strong className="text-stone-900">Vedic Ashtakoota Guna Milan System</strong> based on 36 total points across 8 key kootas:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200 font-medium">
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>1. Varna Koota</span>
              <strong className="text-stone-900">1 Pt</strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>2. Vashya Koota</span>
              <strong className="text-stone-900">2 Pts</strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>3. Tara Koota</span>
              <strong className="text-stone-900">3 Pts</strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>4. Yoni Koota</span>
              <strong className="text-stone-900">4 Pts</strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>5. Graha Maitri</span>
              <strong className="text-stone-900">5 Pts</strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>6. Gana Koota</span>
              <strong className="text-stone-900">6 Pts</strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>7. Bhakoot Koota</span>
              <strong className="text-stone-900">7 Pts</strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-1">
              <span>8. Nadi Koota</span>
              <strong className="text-stone-900">8 Pts</strong>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-950 mb-1">Important Disclaimer</strong>
              {ASTROLOGY_DISCLAIMER}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-saffron text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-md"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
