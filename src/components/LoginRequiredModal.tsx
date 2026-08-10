import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, UserPlus, X, ShieldCheck } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfileName?: string;
  targetProfileId?: string;
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
  targetProfileName,
  targetProfileId
}: LoginRequiredModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    if (targetProfileId) {
      navigate('/login', { state: { from: `/profile/${targetProfileId}` } });
    } else {
      navigate('/login');
    }
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-saffron/20 overflow-hidden relative transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-saffron via-orange-500 to-maroon p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
            <Lock className="w-8 h-8 text-white animate-pulse" />
          </div>
          
          <h3 className="text-2xl font-serif font-bold text-white drop-shadow">
            Login Required
          </h3>
          <p className="text-xs text-white/90 font-medium mt-1">
            Nashik Teli Samaj Matrimony
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-4">
          <p className="text-stone-700 font-medium text-base">
            You are attempting to view the full profile of{' '}
            <span className="font-bold text-stone-900 font-serif text-lg">
              {targetProfileName || 'this member'}
            </span>.
          </p>

          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-900 text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-saffron shrink-0" />
              <span>Privacy & Security Notice</span>
            </div>
            <p className="leading-relaxed">
              To protect member privacy, photos, contact numbers, gotra/kul, and complete biodata are locked for guest visitors. Please login or create a free profile to unlock.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-saffron hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-saffron/20 transition-all flex items-center justify-center gap-2 text-base active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              Login to View Profile
            </button>

            <button
              onClick={handleRegister}
              className="w-full bg-white text-stone-800 border-2 border-stone-200 hover:border-saffron hover:text-saffron font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Create Free Account / Register
            </button>
          </div>
        </div>

        <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xs font-bold transition-colors"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    </div>
  );
}
