import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSubscriptionDetails, ANNUAL_SUBSCRIPTION_PRICE, isSubscriptionActive } from '../lib/subscriptionService';
import { ShieldCheck, CheckCircle2, Sparkles, Phone, Heart, Star, Zap, Lock, Calendar, CreditCard, ArrowRight, Clock } from 'lucide-react';
import SubscriptionModal from '../components/SubscriptionModal';
import FloatingToast, { ToastMessage } from '../components/FloatingToast';

export default function Subscription() {
  const { user, userProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const subDetails = getSubscriptionDetails(userProfile);
  const active = subDetails.isActive;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fade-in">
      <FloatingToast message={toast} onClose={() => setToast(null)} />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setToast({ type: 'success', text: 'Membership activated successfully!' });
        }}
      />

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-saffron px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4" /> Official Matrimony Membership
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 mb-4">
          Choose Your Membership Plan
        </h1>
        <p className="text-stone-600 text-base sm:text-lg">
          Connect with verified matches, view family contact details, and send direct proposals with our single 12-month full-access plan.
        </p>
      </div>

      {/* Current Subscription Status Badge (If user is logged in) */}
      {user && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200 mb-10 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Your Current Membership Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${subDetails.badgeColor}`}>
                  <ShieldCheck className="w-4 h-4" />
                  {subDetails.label}
                </span>
              </div>
            </div>

            {active ? (
              <div className="text-left sm:text-right text-xs text-stone-600 space-y-1">
                <p className="flex items-center gap-1 sm:justify-end">
                  <Calendar className="w-3.5 h-3.5 text-saffron" /> Active Since: <strong>{subDetails.startDate}</strong>
                </p>
                <p className="flex items-center gap-1 sm:justify-end">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Valid Until: <strong>{subDetails.endDate}</strong> ({subDetails.daysRemaining} days left)
                </p>
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="bg-saffron hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Activate Membership Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Single Pricing Card Grid */}
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border-2 border-saffron/30 overflow-hidden relative transform hover:-translate-y-1 transition-all duration-300">
        <div className="bg-gradient-to-r from-saffron via-amber-500 to-maroon text-white p-8 text-center relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase text-white">
            12 Months Plan
          </div>
          <h3 className="text-2xl font-serif font-bold mb-1">Annual Matrimony Plan</h3>
          <p className="text-amber-100 text-sm font-medium">Full 1-Year Unrestricted Access</p>
          <div className="mt-6 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold tracking-tight">₹{ANNUAL_SUBSCRIPTION_PRICE}</span>
            <span className="text-amber-100 text-base font-semibold">/ Year</span>
          </div>
          <p className="text-xs text-amber-100/90 mt-2 font-medium">Billed annually • Inclusive of all taxes & features</p>
        </div>

        <div className="p-8 space-y-6">
          <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider">Included Premium Features:</h4>
          <div className="space-y-4">
            {[
              { title: 'Unlimited Contact Details', desc: 'Direct access to candidate & parents mobile numbers & home addresses.' },
              { title: 'Express Interest & Direct Messaging', desc: 'Send direct marriage proposals & connect instantly with verified families.' },
              { title: 'Full Guna Milan & Kundali Matching', desc: 'Complete 36-guna compatibility reports with Manglik analysis.' },
              { title: 'Verified Gold Member Badge', desc: 'Display a golden trust badge on your profile to increase responses by 3x.' },
              { title: 'Priority Profile Visibility', desc: 'Get featured at the top of member search results across all cities.' }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="bg-orange-100 text-saffron p-1 rounded-full mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">{feature.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full bg-saffron hover:bg-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-saffron/25 transition-all flex items-center justify-center gap-2"
          >
            {active ? 'Renew Membership — ₹799/Year' : 'Get Full Access — ₹799/Year'}
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-stone-400 text-center flex items-center justify-center gap-1 font-medium">
            <Lock className="w-3 h-3 text-emerald-600" /> Secure 256-Bit Payment Gateway Encryption
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="mt-16 max-w-3xl mx-auto bg-stone-100/80 rounded-2xl p-8 border border-stone-200">
        <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6 text-center">Frequently Asked Questions</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h5 className="font-bold text-stone-900">How long is the subscription valid?</h5>
            <p className="text-stone-600 mt-1">The ₹799 Annual Matrimony Plan is valid for 365 days (1 full year) from the exact date of payment verification.</p>
          </div>
          <div>
            <h5 className="font-bold text-stone-900">Can I view parent contact details with this plan?</h5>
            <p className="text-stone-600 mt-1">Yes! An active annual subscription unlocks unlimited contact numbers, parents' contacts, maternal uncle details, and addresses for approved profiles.</p>
          </div>
          <div>
            <h5 className="font-bold text-stone-900">Is payment activated immediately?</h5>
            <p className="text-stone-600 mt-1">Yes. As soon as payment is verified by our gateway provider, your account is immediately updated with active status and full access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
