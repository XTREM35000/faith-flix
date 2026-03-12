import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type DonationStatus = "loading" | "success" | "error";

export default function DonationSuccess() {
  const [status, setStatus] = useState<DonationStatus>("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Empêche toute navigation automatique pendant l'affichage du succès/erreur
  useEffect(() => {
    const blockNavigation = (e: Event) => {
      e.preventDefault();
      (e as unknown as { returnValue?: boolean }).returnValue = false;
      return false;
    };
    window.addEventListener('beforeunload', blockNavigation);
    window.addEventListener('popstate', blockNavigation);
    return () => {
      window.removeEventListener('beforeunload', blockNavigation);
      window.removeEventListener('popstate', blockNavigation);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Session de paiement manquante.");
      return;
    }

    let cancelled = false;

    const fetchDonation = async () => {
      try {
        // Solution : Désactiver TypeScript pour cette ligne spécifique
        // @ts-expect-error - Problème de typage récursif avec Supabase
        const { data, error } = await supabase
          .from("donations")
          .select("payment_status, amount")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (cancelled) return;
        
        if (error || !data) {
          setStatus("error");
          setErrorMsg("Aucune information de don trouvée.");
          return;
        }

        // Typer manuellement les données
        const donationData = data as { payment_status: string; amount: number | null };
        
        if (donationData.payment_status === "paid") {
          setAmount(donationData.amount ?? null);
          setStatus("success");
        } else if (donationData.payment_status === "pending") {
          setStatus("loading");
          pollingRef.current = setTimeout(fetchDonation, 3000);
        } else if (donationData.payment_status === "failed") {
          setStatus("error");
          setErrorMsg("Paiement non effectué.");
        } else {
          setStatus("error");
          setErrorMsg("Statut de paiement inconnu.");
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg("Erreur lors de la vérification du paiement.");
      }
    };

    fetchDonation();
    return () => {
      cancelled = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6 rounded-xl shadow bg-white flex flex-col items-center">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-lg font-semibold">Vérification du paiement...</p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-green-700 mb-2">Merci pour votre don 🙏</h1>
            <p className="mb-4">Votre paiement de <strong>{amount} FCFA</strong> a été confirmé.</p>
            <Button asChild className="mt-2 w-full bg-green-600 hover:bg-green-700">
              <a href="/donate">Retour à la page des dons</a>
            </Button>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Erreur de paiement</h1>
            <p className="mb-4">{errorMsg || "Erreur lors de la vérification du paiement."}</p>
            <Button asChild className="mt-2 w-full bg-green-600 hover:bg-green-700">
              <a href="/donate">Retour à la page des dons</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}