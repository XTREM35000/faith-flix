export type PaymentMethod = 'cinetpay' | 'moov' | 'mtn' | 'orange' | 'wave' | 'card' | 'cash' | 'mobile_money';

export interface PaymentInitResult {
  paymentUrl?: string;
  transactionId?: string;
  raw?: any;
}

export interface PaymentVerifyResult {
  status: 'success' | 'failed' | 'pending' | string;
  donationId?: string;
  raw?: any;
}
