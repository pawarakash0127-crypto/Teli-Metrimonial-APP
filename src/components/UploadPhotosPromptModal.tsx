import React from 'react';
import { Camera, Upload, X, CheckCircle2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface UploadPhotosPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadNow: () => void;
  photosCount: number;
}

export default function UploadPhotosPromptModal({
  isOpen,
  onClose,
  onUploadNow,
  photosCount
}: UploadPhotosPromptModalProps) {
  if (!isOpen) return null;

  const maxPhotos = 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-saffron/20 overflow-hidden relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-saffron via-amber-400 to-maroon" />

        {/* Close (X) Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-all focus:outline-none"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 text-center">
          {/* Header Icon */}
          <div className="mx-auto w-16 h-16 bg-saffron/10 rounded-2xl flex items-center justify-center border border-saffron/20 text-saffron shadow-inner">
            <Camera className="w-8 h-8 animate-bounce text-saffron" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-stone-900">
              Profile Saved Successfully!
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Please upload photos for your matrimonial profile (up to {maxPhotos} photos allowed: 1 main photo + 2 additional photos).
            </p>
          </div>

          {/* Photo slots visual badge */}
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center justify-around text-xs font-bold text-amber-900">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-saffron" />
              <span>Current Photos: <strong className="text-saffron">{photosCount} / {maxPhotos}</strong></span>
            </div>
            <span className="bg-saffron text-white px-2.5 py-1 rounded-full text-[10px] uppercase font-black">
              Max 3 Photos
            </span>
          </div>

          <p className="text-xs text-stone-500 italic">
            Profiles with photos get 5x more responses and higher match visibility.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onUploadNow();
              }}
              className="flex-1 bg-saffron hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-saffron/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photos Now</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl transition-all text-sm"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
