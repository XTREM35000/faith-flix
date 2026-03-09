import { PaymentInitResult } from './types';

export const initMobileMoneyPayment = async (
  provider: 'moov' | 'mtn' | 'orange',
  phoneNumber: string,
  amount: number,
  donationId: string
): Promise<PaymentInitResult> => {
  // Implémentation minimale : utiliser un agrégateur ou SDK côté serveur.
  // Ici on renvoie un résultat indicatif pour ne pas casser l'UI.
  return {
    paymentUrl: undefined,
    transactionId: donationId,
    raw: {
      message: 'Mobile Money initiation should be implemented server-side using an aggregator or provider SDK',
      provider,
      phoneNumber,
      amount,
    },
  };
};
