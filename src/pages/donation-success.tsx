import { useState } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { useLocation } from "react-router-dom"

import PaymentLogosSection from "@/components/donations/PaymentLogosSection"
import PaymentMethodSelector from "@/components/donations/PaymentMethodSelector"
import { Button } from "@/components/ui/button"
import HeroBanner from "@/components/HeroBanner"
import usePageHero from "@/hooks/usePageHero"

// Imports des modals de paiement
import StripeDonationModal from "@/components/donations/StripeDonationModal"
import MobileMoneyDonationModal from "@/components/donations/MobileMoneyDonationModal"
import CashDonationModal from "@/components/donations/CashDonationModal"

export default function Donate() {
  const [method, setMethod] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const location = useLocation()
  const { data: hero, save: saveHero } = usePageHero(location.pathname)

  const paymentMethods = [
    {
      id: "stripe-1",
      code: "stripe",
      label: "Carte bancaire",
      description: "Visa / Mastercard / American Express",
      image: "/svg/MasterCard.png",
      is_active: true,
      requires_validation: false,
    },
    {
      id: "cinetpay-1",
      code: "cinetpay",
      label: "Mobile Money",
      description: "MTN / Orange / Moov / Wave",
      image: "/svg/ORANGE.svg",
      is_active: true,
      requires_validation: false,
    },
    {
      id: "cash-1",
      code: "cash",
      label: "Guichet Paroisse",
      description: "Paiement en espèces à l'accueil",
      image: "/svg/espece.png",
      is_active: true,
      requires_validation: false,
    },
  ]

  const handleMethodSelect = (selectedMethod: string) => {
    setMethod(selectedMethod)
    // OUVRE DIRECTEMENT LE MODAL quand on clique sur une carte
    setOpen(true)
  }

  const handleCloseModal = () => {
    setOpen(false)
    setMethod(null)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Faire un don"
        subtitle="Soutenez notre mission avec votre générosité"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="container mx-auto px-4 py-12">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-green-700">
            Choisissez votre méthode de paiement
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Sélectionnez votre mode de paiement préféré pour continuer. 
            Toutes les transactions sont sécurisées.
          </p>

          <PaymentMethodSelector
            selectedMethod={method}
            onSelect={handleMethodSelect} // ✅ Ouvre directement le modal
            methods={paymentMethods}
          />
        </motion.section>

        {/* Supprimé le bouton "Continuer" car on ouvre directement le modal */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-gray-200"
        >
          <PaymentLogosSection />
          <p className="text-center text-sm text-gray-500 mt-4">
            Paiement 100% sécurisé • Chiffrement SSL
          </p>
        </motion.div>

        {/* Modals de paiement */}
        {method === "stripe" && (
          <StripeDonationModal
            open={open}
            onClose={handleCloseModal}
          />
        )}

        {method === "cinetpay" && (
          <MobileMoneyDonationModal
            open={open}
            onClose={handleCloseModal}
          />
        )}

        {method === "cash" && (
          <CashDonationModal
            open={open}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  )
}