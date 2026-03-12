import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"  

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { donationId } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: donation, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single()

    if (error || !donation) {
      return new Response(
        JSON.stringify({ error: "Donation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // URLs de callback (à ajuster avec tes vraies URLs en production)
    const baseUrl = "https://www.nd-compassion.ci"
    const notifyUrl = "https://cghwsbkxcjsutqwzdbwe.supabase.co/functions/v1/cinetpay-webhook"
    const returnUrl = `${baseUrl}/donation-success`

    const payload = {
      apikey: Deno.env.get("CINETPAY_API_KEY")!,
      site_id: Deno.env.get("CINETPAY_SITE_ID")!,
      transaction_id: donation.id,
      amount: donation.amount,
      currency: donation.currency || "XOF",
      description: "Don - Paroisse Compassion",
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: "ALL",
      customer_name: donation.payer_name || "Donateur",
      customer_email: donation.payer_email,
      customer_phone: donation.payer_phone,
    }

    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const result = await response.json()
    console.log("Réponse CinetPay:", result)

    if (result.code === "201" && result.data?.payment_url) {
      // Mettre à jour le don avec l'ID de transaction CinetPay
      await supabase
        .from("donations")
        .update({ 
          transaction_id: result.data.transaction_id,
          payment_status: "pending" 
        })
        .eq("id", donationId)

      return new Response(
        JSON.stringify({ payment_url: result.data.payment_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: result.description || "Erreur CinetPay" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})