export interface PaymentOrderOptions {
  amount: number; // e.g. 799
  currency: string; // 'INR'
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  status: 'created' | 'attempted' | 'paid';
  providerName: string;
}

export interface PaymentVerificationDetails {
  orderId: string;
  paymentId: string;
  signature?: string;
  status: 'success' | 'failed' | 'pending';
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  paymentDate: string;
  message?: string;
}

export interface PaymentProvider {
  name: string;
  createOrder(options: PaymentOrderOptions): Promise<PaymentOrderResult>;
  verifyPayment(details: PaymentVerificationDetails): Promise<PaymentVerificationResult>;
  refundPayment?(transactionId: string, amount?: number): Promise<{ success: boolean; refundId?: string }>;
}
