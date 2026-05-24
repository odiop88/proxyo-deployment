import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import Header from "../components/header";
import { getOnboardingStatus } from "../services/stripe_api";

export default function OnboardingSuccessPage() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboardingStatus()
      .then(s => setVerified(s.onboarded))
      .catch(() => setVerified(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle size={30} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {verified ? "IBAN configuré avec succès !" : "Onboarding en cours..."}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {verified
            ? "Votre compte Stripe est activé. Vous recevrez automatiquement vos paiements par virement SEPA (1-2 jours ouvrés) dès que vos missions seront confirmées."
            : "Stripe vérifie votre compte. Cela peut prendre quelques minutes. Revenez consulter vos candidatures sous peu."
          }
        </p>
        <button
          onClick={() => navigate("/dashboard/candidatures")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#7e3285" }}
        >
          Voir mes candidatures <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
