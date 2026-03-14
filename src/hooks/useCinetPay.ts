import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Passe par la fonction Edge create-cinetpay-payment pour éviter le CORS
 * (l’API CinetPay n’accepte pas les appels directs depuis le navigateur).
 */
export const useCinetPay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processPayment = useCallback(
    async (data: {
      amount: number;
      client_first_name: string;
      client_last_name: string;
      client_email: string;
      client_phone_number?: string;
      payment_method?: string;
      donationId: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const paymentPayload = {
          currency: 'XOF',
          payment_method: data.payment_method,
          merchant_transaction_id: `DON-${Date.now()}-${data.donationId}`,
          amount: data.amount,
          lang: 'fr',
          designation: 'Don Paroisse NDC',
          client_email: data.client_email,
          client_phone_number: data.client_phone_number,
          client_first_name: data.client_first_name,
          client_last_name: data.client_last_name,
          success_url: import.meta.env.VITE_CINETPAY_SUCCESS_URL,
          failed_url: import.meta.env.VITE_CINETPAY_FAILED_URL,
          notify_url: import.meta.env.VITE_CINETPAY_NOTIFY_URL,
          direct_pay: false,
        };

        const { data: result, error: fnError } = await supabase.functions.invoke(
          'create-cinetpay-payment',
          { body: { paymentData: paymentPayload } }
        );

        if (fnError) throw fnError;
        if (result?.error) throw new Error(result.error as string);

        const paymentUrl =
          result?.payment_url ??
          (result?.data as { payment_url?: string } | undefined)?.payment_url;
        if (result?.details?.must_be_redirected && paymentUrl) {
          window.location.href = paymentUrl;
          return result;
        }
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return result;
        }

        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur de paiement';
        setError(message);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return { processPayment, loading, error };
};
