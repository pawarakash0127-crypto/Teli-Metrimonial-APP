import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isSubscriptionActive } from '../lib/subscriptionService';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Sparkles, Lock, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

interface RequireMembershipProps {
  children: React.ReactNode;
}

/**
 * RequireMembership Guard Component
 * Ensures only active annual subscribers (or site admins) can access
 * matrimony search, member profiles, matches, and notifications.
 */
export default function RequireMembership({ children }: RequireMembershipProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-saffron border-t-transparent"></div>
      </div>
    );
  }

  // If user is not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admins bypass subscription requirements
  if (profile?.role === 'admin' || profile?.isAdmin === true) {
    return <>{children}</>;
  }

  // Check subscription status
  const active = isSubscriptionActive(profile);

  if (!active) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 animate-fade-in">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border-2 border-saffron/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-saffron via-amber-500 to-saffron"></div>

          <div className="w-16 h-16 bg-amber-50 text-saffron rounded-full flex items-center justify-center mx-auto mb-4 border border-saffron/20 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <span className="bg-amber-100 text-saffron text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Annual Membership Required
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">
            Unlock Full Access
          </h2>

          <p className="text-stone-600 text-sm leading-relaxed mb-6">
            Complete your <strong>₹799/year</strong> matrimony membership to search profiles, view family contact numbers, and connect with verified matches.
          </p>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-saffron/20 text-left space-y-2 mb-6 text-xs text-stone-700 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-saffron shrink-0" />
              <span>Unlimited Candidate & Parents Contact Numbers</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-saffron shrink-0" />
              <span>Express Interest & Direct Marriage Proposals</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-saffron shrink-0" />
              <span>36-Guna Milan & Kundali Matching Reports</span>
            </div>
          </div>

          <Link
            to="/subscription"
            className="w-full bg-saffron hover:bg-orange-600 text-white py-3.5 rounded-2xl font-bold text-base transition-all shadow-lg shadow-saffron/30 flex items-center justify-center gap-2 transform active:scale-95"
          >
            Get Membership — ₹799/Year <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-[11px] text-stone-400 mt-3">
            Instant 365-day access upon payment completion.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
