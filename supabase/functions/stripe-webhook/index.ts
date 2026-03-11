import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const stripe = new Stripe(
 Deno.env.get("STRIPE_SECRET_KEY")!,
 { apiVersion:"2023-10-16" }
)

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

Deno.serve(async (req)=>{

const body = await req.text()

const signature = req.headers.get("stripe-signature")!

let event

try {

event = stripe.webhooks.constructEvent(
 body,
 signature,
 endpointSecret
)

} catch(err){

return new Response(`Webhook error: ${err.message}`,{status:400})

}

if(event.type === "checkout.session.completed") {
	const session = event.data.object;
	const donationId = session.metadata.donation_id;
	const paymentIntent = session.payment_intent;
	const supabase = createClient(
		Deno.env.get("SUPABASE_URL")!,
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
	);

	// Vérifier l'état actuel du don
	const { data: donation, error } = await supabase
		.from("donations")
		.select("status")
		.eq("id", donationId)
		.single();

	// Si déjà payé, ignorer
	if (donation && donation.status === "paid") {
		return new Response("ok");
	}

	// Mettre à jour le don
	await supabase
		.from("donations")
		.update({
			status: "paid",
			stripe_payment_intent: paymentIntent,
			paid_at: new Date().toISOString()
		})
		.eq("id", donationId);

	// Envoi du reçu (optionnel)
	if (session.customer_email) {
		await sendReceipt(
			session.customer_email,
			session.amount_total / 100
		);
	}
}

return new Response("ok")

})