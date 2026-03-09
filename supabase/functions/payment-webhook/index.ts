import { serve } from 'std/server';

// Webhook skeleton for payment notifications (CinetPay, etc.)
// TODO: verify signature, use a Supabase service role client to update donation status

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    // Example payload handling - adapt to provider docs
    console.log('Payment webhook received', payload);

    // TODO: Verify provider signature
    // TODO: Update donation status in Supabase using service role key

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook error', err);
    return new Response('Invalid payload', { status: 400 });
  }
});
