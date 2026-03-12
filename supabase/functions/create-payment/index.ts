// supabase/functions/create-payment/index.ts
import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16"
})

Deno.serve(async (req) => {
  try {
    const { donationId } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Récupérer les infos du don
    const { data: donation, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single()

    if (error || !donation) {
      return new Response("Donation not found", { status: 404 })
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: donation.currency.toLowerCase(),
            product_data: {
              name: "Don - Paroisse Compassion",
            },
            unit_amount: Math.round(donation.amount * 100), // En centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${Deno.env.get("PUBLIC_SITE_URL")}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("PUBLIC_SITE_URL")}/donate`,
      metadata: {
        donation_id: donationId,
      },
      customer_email: donation.payer_email,
    })

    // Mettre à jour le don avec le stripe_session_id
    await supabase
      .from("donations")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", donationId)

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Error creating payment:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})