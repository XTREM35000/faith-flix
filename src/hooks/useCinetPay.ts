import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export const useCinetPay = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiatePayment = async (donationId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-cinetpay-payment",
        { body: { donationId } }
      )

      if (error) throw error
      if (!data?.payment_url) throw new Error("Pas d'URL de paiement reçue")

      return { paymentUrl: data.payment_url }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { initiatePayment, loading, error }
}