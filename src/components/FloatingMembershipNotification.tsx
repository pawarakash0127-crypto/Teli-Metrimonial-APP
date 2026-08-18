import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSubscriptionActive, ANNUAL_SUBSCRIPTION_PRICE } from '../lib/subscriptionService';
import { Sparkles, X, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface FloatingMembershipNotificationProps {
  forceShow?: boolean;
}

export default function FloatingMembershipNotification({ forceShow = false }: FloatingMembershipNotificationProps) {
  const { user, profile, isProfileComplete, userProfile } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissedSession = sessionStorage.getItem('nashik_membership_prompt_dismissed');
    if (dismissedSession === 'true' && !forceShow) {
      setIsVisible(false);
      return;
    }

    // Do not show on subscription page itself or admin page
    if (location.pathname === '/subscription' || location.pathname.startsWith('/admin')) {
      setIsVisible(false);
      return;
    }

    // Don't show to unauthenticated users or admins
    if (!user || profile?.role === 'admin') {
      setIsVisible(false);
      return;
    }

    // Check if already subscribed
    const activeSub = isSubscriptionActive(profile) || isSubscriptionActive(userProfile);
    if (activeSub) {
      setIsVisible(false);
      return;
    }

    // Show if profile is complete (or forceShow is true)
    if (isProfileComplete || forceShow) {
      // Delay slightly for smooth entering experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [user, profile, userProfile, isProfileComplete, location.pathname, forceShow]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('nashik_membership_prompt_dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div
      id="floating-membership-notification"
      className="fixed bottom-6 right-4 sm:right-6 z-[90] max-w-sm w-[calc(100%-2rem)] sm:w-96 animate-in slide-in-from-bottom-6 fade-in duration-500"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-saffron/30 overflow-hidden relative backdrop-blur-md">
        {/* Top saffron gold gradient banner */}
        <div className="h-1.5 bg-gradient-to-r from-saffron via-amber-400 to-maroon"></div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition-all"
          aria-label="Dismiss notification"
          title="Dismiss for now"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-saffron shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse text-saffron" />
            </div>
            <div className="pr-6">
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Profile Complete
                </span>
              </div>
              <h4 className="font-serif font-bold text-stone-900 text-base leading-tight mt-1">
                Unlock Verified Matches
              </h4>
            </div>
          </div>

          {/* Description */}
          <p className="text-stone-600 text-xs leading-relaxed mb-4">
            Get your <strong>Annual Membership (₹{ANNUAL_SUBSCRIPTION_PRICE}/yr)</strong> to unlock direct bride & groom contact numbers, parents numbers, and WhatsApp proposals.
          </p>

          {/* Key Benefits Pills */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700 bg-stone-50 p-2 rounded-xl border border-stone-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">View Contact Nos</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700 bg-stone-50 p-2 rounded-xl border border-stone-100">
              <Zap className="w-3.5 h-3.5 text-saffron shrink-0" />
              <span className="truncate">Direct WhatsApp</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/subscription"
              onClick={handleDismiss}
              className="flex-1 bg-gradient-to-r from-saffron to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-saffron/20 active:scale-98"
            >
              <span>Get Membership (₹{ANNUAL_SUBSCRIPTION_PRICE})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl transition-all"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
