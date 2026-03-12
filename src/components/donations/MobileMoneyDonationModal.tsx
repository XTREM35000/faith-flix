import { useState } from "react"
import UnifiedFormModal from "@/components/ui/unified-form-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"

interface MobileMoneyDonationModalProps {
  open: boolean
  onClose: () => void
}

export default function MobileMoneyDonationModal({ open, onClose }: MobileMoneyDonationModalProps) {
  const [amount, setAmount] = useState("")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Créer le don dans Supabase
      const { data: donation, error } = await supabase
        .from("donations")
        .insert({
          amount: Number(amount),
          currency: "XOF",
          payment_method: "cinetpay",
          payment_status: "pending",
          payer_name: name || "Donateur",
          payer_email: email,
          payer_phone: phone,
          is_anonymous: !name,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // 2. Appeler la fonction Edge CinetPay
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-cinetpay-payment",
        { body: { donationId: donation.id } }
      )

      if (invokeError) throw invokeError

      // 3. Rediriger vers CinetPay
      if (data?.payment_url) {
        window.location.href = data.payment_url
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de la création du paiement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <UnifiedFormModal open={open} onClose={onClose} title="Paiement Mobile Money">
      <div className="flex gap-3 justify-center mb-6">
        <img src="/svg/MTN.svg" className="h-10" alt="MTN" />
        <img src="/svg/ORANGE.svg" className="h-10" alt="Orange" />
        <img src="/svg/MOOV.svg" className="h-10" alt="Moov" />
        <img src="/svg/WAVE.svg" className="h-10" alt="Wave" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="amount">Montant (FCFA)</Label>
          <Input
            id="amount"
            type="number"
            min="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07 08 09 10 11"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Le numéro associé à votre compte Mobile Money
          </p>
        </div>

        <div>
          <Label htmlFor="email">Email (optionnel)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <Label htmlFor="name">Nom (optionnel)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pour personnaliser votre don"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-orange-600 hover:bg-orange-700"
          disabled={loading}
        >
          {loading ? "Chargement..." : "Payer avec Mobile Money"}
        </Button>
      </form>
    </UnifiedFormModal>
  )
}