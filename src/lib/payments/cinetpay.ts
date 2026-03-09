import { PaymentInitResult, PaymentVerifyResult } from './types';

const CINETPAY_BASE = 'https://api-checkout.cinetpay.com';

function getEnv(key: string) {
  return (import.meta.env as any)[key];
}

export const initCinetPayPayment = async (
  amount: number,
  currency: 'XOF' | 'EUR' | 'USD',
  customerName: string,
  customerEmail: string,
  customerPhone?: string,
  donationId?: string
): Promise<PaymentInitResult> => {
  const apikey = getEnv('VITE_CINETPAY_API_KEY');
  const site_id = getEnv('VITE_CINETPAY_SITE_ID');
  const notify_url = getEnv('VITE_PAYMENT_SUCCESS_URL');

  if (!apikey || !site_id) {
    throw new Error('CinetPay configuration manquante');
  }

  const transaction_id = donationId || `don_${Date.now()}`;

  const payload = {
    apikey,
    site_id,
    transaction_id,
    amount: Math.round(amount),
    currency,
    description: `Don - ${customerName}`,
    client_name: customerName,
    client_email: customerEmail,
    client_phone: customerPhone,
    notify_url,
  } as any;

  try {
    const res = await fetch(`${CINETPAY_BASE}/v2/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // Response shape can vary, try common fields
    const paymentUrl = data?.data?.payment_url || data?.data?.invoice_url || data?.data?.checkout_url || data?.checkout_url;

    return {
      paymentUrl,
      transactionId: transaction_id,
      raw: data,
    };
  } catch (err) {
    throw new Error(`CinetPay init failed: ${(err as Error).message}`);
  }
};

export const verifyCinetPayPayment = async (transactionId: string): Promise<PaymentVerifyResult> => {
  const apikey = getEnv('VITE_CINETPAY_API_KEY');
  const site_id = getEnv('VITE_CINETPAY_SITE_ID');

  if (!apikey || !site_id) {
    throw new Error('CinetPay configuration manquante');
  }

  try {
    const url = `${CINETPAY_BASE}/v2/payment/check?transaction_id=${encodeURIComponent(
      transactionId
    )}&apikey=${encodeURIComponent(apikey)}&site_id=${encodeURIComponent(site_id)}`;

    const res = await fetch(url);
    const data = await res.json();

    // CinetPay returns different statuses; common accepted value: "ACCEPTED"
    const statusRaw = data?.data?.status || data?.status || data?.data?.cpm_result || null;
    const status = statusRaw === 'ACCEPTED' || statusRaw === 'ACCEPTED' ? 'success' : statusRaw === 'CREATED' ? 'pending' : 'failed';

    // Try to extract donation identifier if passed in metadata/custom field
    const donationId = data?.data?.cpm_custom || data?.data?.metadata?.donationId || undefined;

    return {
      status,
      donationId,
      raw: data,
    };
  } catch (err) {
    throw new Error(`CinetPay verify failed: ${(err as Error).message}`);
  }
};
