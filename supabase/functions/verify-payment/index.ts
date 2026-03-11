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

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {

    const { sessionId } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Chercher le don via stripe_session_id
    const { data: donation, error } = await supabase
      .from("donations")
      .select("status, amount, currency")
      .eq("stripe_session_id", sessionId)
      .single();

    if (!donation) {
      return new Response(
        JSON.stringify({ success: false, message: "Don introuvable ou session invalide." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: donation.status === "paid",
        status: donation.status,
        amount: donation.amount,
        currency: donation.currency
      }),
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