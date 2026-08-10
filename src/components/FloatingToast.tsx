import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

export interface ToastMessage {
  type: 'error' | 'success' | 'info';
  text: string;
}

interface FloatingToastProps {
  message: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export default function FloatingToast({ message, onClose, duration = 4000 }: FloatingToastProps) {
  useEffect(() => {
    if (!message || !message.text) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message || !message.text) return null;

  const isError = message.type === 'error';
  const isSuccess = message.type === 'success';

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] sm:w-auto animate-bounce-short shadow-2xl rounded-2xl overflow-hidden border transition-all duration-300">
      <div
        className={`px-5 py-3.5 flex items-center gap-3 text-sm font-semibold shadow-lg ${
          isError
            ? 'bg-red-600 text-white border-red-700'
            : isSuccess
            ? 'bg-emerald-700 text-white border-emerald-800'
            : 'bg-stone-900 text-white border-stone-800'
        }`}
      >
        {isError && <AlertCircle className="w-5 h-5 shrink-0 text-red-200" />}
        {isSuccess && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-200" />}
        {!isError && !isSuccess && <Info className="w-5 h-5 shrink-0 text-stone-300" />}

        <span className="flex-1 pr-2 leading-tight">{message.text}</span>

        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
          title="Close alert"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
