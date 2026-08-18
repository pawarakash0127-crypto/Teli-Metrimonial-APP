import { PaymentProvider, PaymentOrderOptions, PaymentOrderResult, PaymentVerificationDetails, PaymentVerificationResult } from './PaymentProvider';

/**
 * Mock Payment Provider for Development, Demonstration & QA Testing.
 * Strictly decoupled from production and used only when Razorpay keys are pending.
 */
export class MockPaymentProvider implements PaymentProvider {
  name = 'mock_test_provider';

  async createOrder(options: PaymentOrderOptions): Promise<PaymentOrderResult> {
    const mockOrderId = `ORD_MOCK_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return {
      orderId: mockOrderId,
      amount: options.amount,
      currency: options.currency || 'INR',
      status: 'created',
      providerName: this.name
    };
  }

  async verifyPayment(details: PaymentVerificationDetails): Promise<PaymentVerificationResult> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (details.status === 'failed') {
      return {
        success: false,
        transactionId: `TXN_FAIL_${Date.now()}`,
        orderId: details.orderId,
        amount: 799,
        currency: 'INR',
        provider: this.name,
        paymentDate: new Date().toISOString(),
        message: 'Payment was declined by cardholder bank or test simulator.'
      };
    }

    const transactionId = details.paymentId || `TXN_MOCK_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return {
      success: true,
      transactionId,
      orderId: details.orderId,
      amount: 799,
      currency: 'INR',
      provider: this.name,
      paymentDate: new Date().toISOString(),
      message: 'Payment verified successfully via test environment gateway.'
    };
  }

  async refundPayment(transactionId: string, amount?: number) {
    return {
      success: true,
      refundId: `REF_MOCK_${Date.now()}`
    };
  }
}
