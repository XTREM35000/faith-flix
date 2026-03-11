import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!,
  { apiVersion: "2023-10-16" }
)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {

  // gérer preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {

    const { amount, currency, email } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Insérer le don en pending
    const { data: donation, error: insertError } = await supabase
      .from("donations")
      .insert([
        {
          amount,
          currency,
          email,
          status: "pending"
        }
      ])
      .select("*")
      .single();

    if (insertError || !donation) {
      return new Response(
        JSON.stringify({ error: insertError?.message || "Erreur création don" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 2. Créer la session Stripe avec metadata donation_id
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: donation.currency.toLowerCase(),
            product_data: { name: "Don - Paroisse Compassion" },
            unit_amount: Math.round(Number(donation.amount) * 100)
          },
          quantity: 1
        }
      ],
      success_url: `${Deno.env.get("SITE_URL")}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("SITE_URL")}/donate`,
      metadata: { donation_id: donation.id }
    });

    // 3. Stocker stripe_session_id dans la table donations
    await supabase
      .from("donations")
      .update({ stripe_session_id: session.id })
      .eq("id", donation.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    )

  }

})