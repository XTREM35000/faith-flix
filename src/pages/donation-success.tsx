
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DonationSuccess() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (!sessionId) {
        setStatus("error");
        setErrorMsg("Session de paiement manquante.");
        return;
      }
      try {
        const res = await fetch(
          "https://cghwsbkxcjsutqwzdbwe.supabase.co/functions/v1/verify-payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          }
        );
        const data = await res.json();
        if (data.success) {
          setAmount(data.amount);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.message || "Erreur lors de la vérification du paiement.");
        }
      } catch (e) {
        setStatus("error");
        setErrorMsg("Erreur réseau ou serveur.");
      }
    };
    verify();
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
