import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Header from "../components/header";
import { startOnboarding } from "../services/stripe_api";

export default function OnboardingRefreshPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleRetry() {
    setLoading(true);
    setError("");
    try {
      const { onboarding_url } = await startOnboarding();
      window.location.href = onboarding_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération du lien.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <RefreshCw size={28} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Lien expiré</h1>
        <p className="text-sm text-gray-500 mb-8">
          Le lien d'onboarding Stripe a expiré. Cliquez ci-dessous pour en générer un nouveau et terminer la configuration de votre IBAN.
        </p>
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate("/dashboard/candidatures")}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-gray-300 bg-white transition-all"
          >
            <ArrowLeft size={15} /> Retour
          </button>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: "#7e3285" }}
          >
            <RefreshCw size={15} /> {loading ? "Chargement..." : "Nouveau lien"}
          </button>
        </div>
      </div>
    </div>
  );
}
