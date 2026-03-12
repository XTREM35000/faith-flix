import { useState } from "react"
import UnifiedFormModal from "@/components/ui/unified-form-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useCreateDonation } from "@/hooks/useCreateDonation"

// ✅ Props typées
interface CashDonationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CashDonationModal({ open, onClose }: CashDonationModalProps) {
  const { createDonation } = useCreateDonation()
  const [amount, setAmount] = useState("")
  const [name, setName] = useState("")

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const donation = await createDonation({
      amount: Number(amount),
      currency: "XOF",
      payment_method: "cash",
      payer_name: name || "Donateur anonyme",
      payer_email: "cash@paroisse.ci",
      payer_phone: ""
    })

    if (donation) {
      alert("Votre intention de don a été enregistrée. Veuillez vous présenter au guichet de la paroisse.")
      onClose()
    }
  }

  return (
    <UnifiedFormModal 
      open={open} 
      onClose={onClose} 
      title="Don en espèces"
      headerClassName="bg-amber-800"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Montant (FCFA)</Label>
          <Input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            placeholder="5000"
            required
          />
        </div>

        <div>
          <Label>Votre nom (optionnel)</Label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Pour personnaliser votre don"
          />
        </div>

        <Button className="w-full bg-amber-600 hover:bg-amber-700">
          Confirmer l'intention de don
        </Button>

        <p className="text-sm text-gray-500 text-center mt-2">
          Vous recevrez un reçu après paiement au guichet
        </p>
      </form>
    </UnifiedFormModal>
  )
}