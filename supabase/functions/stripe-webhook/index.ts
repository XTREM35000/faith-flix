import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!,
  { apiVersion: "2023-10-16" }
)

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

Deno.serve(async (req) => {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")!

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      return new Response(`Webhook error: ${err.message}`, { status: 400 })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      const donationId = session.metadata?.donation_id
      
      if (!donationId) {
        console.error("No donation_id in metadata")
        return new Response("Missing donation_id", { status: 400 })
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      )

      // Vérifier l'état actuel du don en utilisant payment_status
      const { data: donation, error: selectError } = await supabase
        .from("donations")
        .select("payment_status")
        .eq("id", donationId)
        .single()

      if (selectError) {
        console.error("Error checking donation:", selectError)
        return new Response(`Select error: ${selectError.message}`, { status: 500 })
      }

      // Si déjà payé, ignorer
      if (donation && donation.payment_status === "paid") {
        return new Response("ok")
      }

      // Mettre à jour le don avec les bonnes colonnes
      const { error: updateError } = await supabase
        .from("donations")
        .update({
          payment_status: "paid",  // ← CORRECTION: utiliser payment_status
          transaction_id: session.payment_intent || session.id,  // ← CORRECTION: utiliser transaction_id
          updated_at: new Date().toISOString()
        })
        .eq("id", donationId)

      if (updateError) {
        console.error("Error updating donation:", updateError)
        return new Response(`Update error: ${updateError.message}`, { status: 500 })
      }

      console.log(`✅ Donation ${donationId} marked as paid`)

      // Envoi du reçu (optionnel)
      if (session.customer_details?.email) {
        try {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-receipt`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: session.customer_details.email,
              amount: session.amount_total / 100,
              currency: session.currency,
              donationId: donationId
            })
          })
        } catch (receiptError) {
          console.error("Error sending receipt:", receiptError)
          // Ne pas bloquer la réponse pour l'erreur de reçu
        }
      }
    }

    return new Response("ok", { status: 200 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response(`Server error: ${error.message}`, { status: 500 })
  }
})