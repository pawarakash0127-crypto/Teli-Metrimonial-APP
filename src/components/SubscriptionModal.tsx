import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Zap, Sparkles, CreditCard, Lock, Heart, Phone, Star } from 'lucide-react';
import { ANNUAL_SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY } from '../lib/subscriptionService';
import { defaultPaymentService } from '../lib/payment/paymentService';
import { useAuth } from '../contexts/AuthContext';
import FloatingToast, { ToastMessage } from './FloatingToast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onSuccess?: () => void;
}

export default function SubscriptionModal({ isOpen, onClose, featureName, onSuccess }: SubscriptionModalProps) {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'success' | 'fail'>('success'); // Simulator selector for dev/testing
  const [toast, setToast] = useState<ToastMessage | null>(null);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!user) {
      setToast({ type: 'error', text: 'Please log in to purchase a matrimony subscription.' });
      return;
    }

    try {
      setLoading(true);
      // 1. Create Order
      const order = await defaultPaymentService.initiateSubscriptionOrder(
        user.uid,
        userProfile?.contactNumber || user.phoneNumber || '',
        `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim()
      );

      // 2. Process and Verify Payment
      const verificationDetails = {
        orderId: order.orderId,
        paymentId: `PAY_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        status: paymentMode === 'success' ? ('success' as const) : ('failed' as const)
      };

      const res = await defaultPaymentService.processAndVerifySubscriptionPayment(
        user.uid,
        verificationDetails,
        userProfile?.profileId || userProfile?.vaduVarNumber
      );

      if (res.success) {
        setToast({ type: 'success', text: '🎉 Subscription Activated! You now have full 12-month access to all matrimony features.' });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setToast({ type: 'error', text: res.message || 'Payment failed or was cancelled.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'An error occurred during payment processing.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <FloatingToast message={toast} onClose={() => setToast(null)} />

      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative border-2 border-saffron/20 my-auto">
        {/* Top Decorative Bar */}
        <div className="h-2 bg-gradient-to-r from-saffron via-gold to-saffron"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-3">
            <div className="bg-orange-50 text-saffron p-3.5 rounded-2xl border border-saffron/20 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>

          <h2 className="text-3xl font-serif font-bold text-center text-stone-900 mb-1">
            Unlock Full Access
          </h2>
          {featureName && (
            <p className="text-center text-saffron font-bold text-sm mb-4">
              Access to "{featureName}" requires an active membership.
            </p>
          )}

          {/* Pricing Card Header */}
          <div className="bg-gradient-to-br from-amber-500 via-saffron to-maroon text-white p-6 rounded-2xl my-5 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
              Annual Matrimony Plan
            </div>
            <p className="text-xs text-amber-200 font-semibold uppercase tracking-wider mb-1">Single Full-Access Membership</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold drop-shadow">₹{ANNUAL_SUBSCRIPTION_PRICE}</span>
              <span className="text-sm font-medium text-amber-100">/ 12 Months</span>
            </div>
            <p className="text-xs text-amber-100/90 mt-1 font-medium">₹66/month billed annually • No hidden charges</p>
          </div>

          {/* Key Benefits List */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Plan Benefits Included:</h4>
            {[
              { icon: <Phone className="w-4 h-4 text-saffron shrink-0" />, text: 'Unlock Unlimited Contact & Parent Phone Numbers' },
              { icon: <Heart className="w-4 h-4 text-saffron shrink-0" />, text: 'Send & Receive Direct Connection Requests' },
              { icon: <Star className="w-4 h-4 text-saffron shrink-0" />, text: 'Full Guna Milan Kundali Compatibility Analysis' },
              { icon: <ShieldCheck className="w-4 h-4 text-saffron shrink-0" />, text: 'Verified Gold Member Badge on Profile' },
              { icon: <Zap className="w-4 h-4 text-saffron shrink-0" />, text: 'Priority Listing in Matrimony Search Results' }
            ].map((b, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-stone-700 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                {b.icon}
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Payment Test Mode Selector (Decoupled abstraction) */}
          <div className="mb-6 bg-stone-100 p-2 rounded-xl text-xs flex items-center justify-between border border-stone-200">
            <span className="text-stone-600 font-semibold flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-saffron" /> Payment Simulator Mode:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPaymentMode('success')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${paymentMode === 'success' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-stone-200 text-stone-600'}`}
              >
                Successful
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('fail')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${paymentMode === 'fail' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-200 text-stone-600'}`}
              >
                Failed
              </button>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-saffron text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-saffron/30 flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Payment...
              </span>
            ) : (
              <>
                <Lock className="w-5 h-5" /> Subscribe Now — ₹799/Year
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-stone-400 mt-3 flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Secure Transaction & Instant Activation
          </p>
        </div>
      </div>
    </div>
  );
}
