import { useState } from 'react';
import { initCinetPayPayment } from '@/lib/payments/cinetpay';
import { initMobileMoneyPayment } from '@/lib/payments/mobileMoney';
import type { PaymentInitResult } from '@/lib/payments/types';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (
    method: 'cinetpay' | 'moov' | 'mtn' | 'orange' | 'card' | 'wave' | 'mobile_money',
    data: any
  ): Promise<PaymentInitResult> => {
    setLoading(true);
    setError(null);

    try {
      switch (method) {
        case 'cinetpay':
        case 'card':
          return await initCinetPayPayment(
            data.amount,
            data.currency || 'XOF',
            data.customerName,
            data.customerEmail,
            data.customerPhone,
            data.donationId
          );

        case 'moov':
        case 'mtn':
        case 'orange':
        case 'mobile_money':
          return await initMobileMoneyPayment(method as any, data.phoneNumber, data.amount, data.donationId);

        default:
          throw new Error('Méthode de paiement non supportée');
      }
    } catch (err: any) {
      setError(err?.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { processPayment, loading, error } as const;
};
