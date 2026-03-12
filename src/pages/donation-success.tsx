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

        // Les statuts possibles sont "pending", "completed", "failed", "cancelled"
        const isCompleted = data?.payment_status === "completed";
        const isPending = data?.payment_status === "pending";
        const isFailed = data?.payment_status === "failed" || data?.payment_status === "cancelled";

        if (isCompleted) {
          setAmount(data.amount ?? null);
          setStatus("success");
        } else if (isPending) {
          setStatus("loading");
          pollingRef.current = setTimeout(fetchDonation, 3000);
        } else if (isFailed) {
          setStatus("error");
          setErrorMsg("Paiement non effectué.");
        } else {
          setStatus("error");
          setErrorMsg(`Statut de paiement inconnu: ${data.payment_status}`);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-2xl bg-white/90 backdrop-blur-sm border border-white/20 flex flex-col items-center transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
        
        {/* État CHARGEMENT */}
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-6 animate-fadeIn">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl animate-pulse">⏳</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Vérification en cours
              </p>
              <p className="text-gray-600 animate-pulse">
                Un instant, nous confirmons votre don...
              </p>
            </div>
          </div>
        )}

        {/* État SUCCÈS */}
        {status === "success" && (
          <div className="flex flex-col items-center space-y-6 animate-fadeIn">
            <div className="relative">
              <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-5xl animate-pulse">🎉</span>
              </div>
              <div className="absolute -top-2 -right-2 text-4xl animate-pulse">
                🙏
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Merci pour votre don !
            </h1>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 w-full text-center">
              <p className="text-lg text-gray-700 mb-2">Votre paiement de</p>
              <p className="text-4xl font-bold text-green-700 mb-2">
                {amount?.toLocaleString()} FCFA
              </p>
              <p className="text-green-600 font-medium">a été confirmé avec succès</p>
            </div>
            
            <Button 
              asChild 
              className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <a href="/donate" className="flex items-center justify-center gap-2">
                <span>💝</span> Faire un autre don
              </a>
            </Button>
          </div>
        )}

        {/* État ERREUR */}
        {status === "error" && (
          <div className="flex flex-col items-center space-y-6 animate-fadeIn">
            <div className="relative">
              <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-5xl animate-pulse">😔</span>
              </div>
              <div className="absolute -top-2 -right-2 text-4xl">
                ❌
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Oups ! Erreur de paiement
            </h1>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200 w-full">
              <p className="text-lg text-gray-700 text-center">
                {errorMsg || "Une erreur est survenue lors de la vérification."}
              </p>
              <div className="mt-4 p-4 bg-white/50 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 Conseil : Vérifiez votre connexion et réessayez. 
                  Si le problème persiste, contactez notre support.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col w-full gap-3">
              <Button 
                asChild 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <a href="/donate" className="flex items-center justify-center gap-2">
                  <span>🔄</span> Réessayer
                </a>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full border-2 border-gray-300 hover:border-gray-400 font-medium py-4 rounded-xl transition-all duration-300 hover:scale-105"
              >
                Rafraîchir la page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Ajoute ces animations dans ton fichier CSS global
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
`;