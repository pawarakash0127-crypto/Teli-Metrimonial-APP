import { PaymentProvider, PaymentVerificationDetails, PaymentVerificationResult } from './PaymentProvider';
import { MockPaymentProvider } from './MockPaymentProvider';
import { RazorpayPaymentProvider } from './RazorpayPaymentProvider';
import { activateSubscriptionInFirestore, ANNUAL_SUBSCRIPTION_PRICE, SUBSCRIPTION_CURRENCY } from '../subscriptionService';

/**
 * Centralized Payment Service Factory & Orchestrator
 */
export class PaymentService {
  private provider: PaymentProvider;

  constructor(providerName: 'mock' | 'razorpay' = 'mock') {
    if (providerName === 'razorpay' && process.env.VITE_RAZORPAY_KEY_ID) {
      this.provider = new RazorpayPaymentProvider();
    } else {
      // Default to Mock test provider if Razorpay is not yet configured with production credentials
      this.provider = new MockPaymentProvider();
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  async initiateSubscriptionOrder(uid: string, userPhone?: string, userName?: string) {
    const order = await this.provider.createOrder({
      amount: ANNUAL_SUBSCRIPTION_PRICE,
      currency: SUBSCRIPTION_CURRENCY,
      receipt: `rcpt_sub_${uid.slice(0, 8)}_${Date.now()}`,
      notes: {
        uid,
        userPhone: userPhone || '',
        userName: userName || '',
        plan: 'annual_799'
      }
    });

    return order;
  }

  async processAndVerifySubscriptionPayment(
    uid: string,
    verificationDetails: PaymentVerificationDetails,
    varVadhuId?: string
  ): Promise<{ success: boolean; result: PaymentVerificationResult; message: string }> {
    const verification = await this.provider.verifyPayment(verificationDetails);

    if (!verification.success) {
      return {
        success: false,
        result: verification,
        message: verification.message || 'Payment verification failed. Subscription was not activated.'
      };
    }

    // Activate subscription in Firestore ONLY after verified success
    await activateSubscriptionInFirestore(uid, verification, 'web', varVadhuId);

    return {
      success: true,
      result: verification,
      message: 'Payment verified successfully! Annual Matrimony Subscription is now active.'
    };
  }
}

export const defaultPaymentService = new PaymentService('mock');
