import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {Euro, Clock, FileText, CheckCircle } from "lucide-react";
import Header from "../components/header";
import { applyToMission } from "../services/application_api";
import { getMission } from "../services/missions_api";

interface MissionInfo {
  id: number;
  title: string;
  city: string;
  budget_min: string;
  budget_max: string;
  sector_label: string;
  deadline: string;
}



const TOTAL_STEPS = 3;

export default function ApplyMissionPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mission, setMission]       = useState<MissionInfo | null>(null);
  const [step, setStep]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState("");

  const [coverLetter, setCoverLetter]     = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [applyTva, setApplyTva]           = useState(false);
  const [tvaRate, setTvaRate]             = useState("");

  useEffect(() => {
    if (!id) return;
    getMission(Number(id))
      .then(data => {
        const storedUser = localStorage.getItem("user");
        const companyId  = storedUser ? JSON.parse(storedUser)?.company_id : null;
        if (Number(data.company_id) === Number(companyId)) {
          navigate(`/missions/${id}`, { replace: true });
          return;
        }
        setMission(data);
      })
      .catch(console.error);
  }, [id, navigate]);

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  function validate(): boolean {
    if (step === 1 && !coverLetter.trim()) {
      setError("La lettre de motivation est requise."); return false;
    }
    if (step === 2) {
      if (!proposedPrice) { setError("Le prix proposé est requis."); return false; }
      if (Number(proposedPrice) <= 0) { setError("Le prix doit être supérieur à 0."); return false; }
      if (applyTva && (!tvaRate || Number(tvaRate) <= 0 || Number(tvaRate) > 100)) {
        setError("Le taux de TVA doit être entre 1 et 100."); return false;
      }
    }
    if (step === 3) {
      if (!estimatedDays) { setError("Le délai estimé est requis."); return false; }
      if (Number(estimatedDays) <= 0) { setError("Le délai doit être supérieur à 0."); return false; }
    }
    return true;
  }

  function next() {
    if (!validate()) return;
    setError("");
    setStep(s => s + 1);
  }

  function prev() {
    setError("");
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    if (!validate() || !id) return;
    setLoading(true);
    setError("");
    try {
      await applyToMission(Number(id), {
        cover_letter:   coverLetter,
        proposed_price: Number(proposedPrice),
        estimated_days: Number(estimatedDays),
        apply_tva:      applyTva,
        tva_rate:       applyTva ? Number(tvaRate) : undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la candidature.");
    } finally {
      setLoading(false);
    }
  }

  // ── Succès ─────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Header />
        <div className="flex flex-col items-center justify-center px-4 py-24">
          <div className="w-full max-w-md bg-white rounded-2xl p-10 text-center"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(126,50,133,0.08)" }}>
                <CheckCircle size={30} style={{ color: "#7e3285" }} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Candidature envoyée !</h1>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Votre candidature a bien été transmise au posteur de la mission. Vous serez notifié de sa réponse.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "#7e3285" }}
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header + barre progression */}
      <div className="relative">
        <Header />
        <div className="h-1 bg-gray-200">
          <div className="h-1 transition-all duration-500"
            style={{ width: `${progress}%`, background: "#7e3285" }} />
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-16">
        <div className="w-full max-w-xl">

          {/* Info mission */}
          {mission && (
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 mb-8 flex items-center gap-3"
              style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Vous candidatez pour</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{mission.title}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold" style={{ color: "#7e3285" }}>
                  {Number(mission.budget_min).toLocaleString("fr-FR")}€ — {Number(mission.budget_max).toLocaleString("fr-FR")}€
                </p>
                <p className="text-xs text-gray-400">{mission.city}</p>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 1 — Lettre de motivation ── */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Votre lettre de<br />motivation
              </h2>
              <p className="text-sm text-gray-400 mb-8">
                Expliquez pourquoi vous êtes le meilleur candidat pour cette mission.
              </p>
              <textarea
                autoFocus
                placeholder="Bonjour, nous sommes spécialisés dans... Nous pouvons réaliser cette mission en..."
                value={coverLetter}
                onChange={e => { setCoverLetter(e.target.value); setError(""); }}
                rows={7}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white resize-none"
              />
              <p className="text-xs text-gray-300 mt-2">{coverLetter.length} caractères</p>
            </div>
          )}

          {/* ── ÉTAPE 2 — Prix proposé ── */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Votre prix proposé
              </h2>
              {mission && (
                <p className="text-sm text-gray-400 mb-8">
                  Budget du client : <strong>{Number(mission.budget_min).toLocaleString("fr-FR")}€ — {Number(mission.budget_max).toLocaleString("fr-FR")}€</strong>
                </p>
              )}
              <div className="relative">
                <input
                  autoFocus
                  type="number"
                  placeholder="250"
                  min="1"
                  value={proposedPrice}
                  onChange={e => { setProposedPrice(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && next()}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              </div>

              {/* TVA */}
              <div className="mt-5 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTva}
                    onChange={e => { setApplyTva(e.target.checked); setTvaRate(""); setError(""); }}
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  <span className="text-sm text-gray-700">J'applique la TVA sur ce devis</span>
                </label>
                {applyTva && (
                  <div className="relative">
                    <input
                      autoFocus
                      type="number"
                      placeholder="20"
                      min="1"
                      max="100"
                      value={tvaRate}
                      onChange={e => { setTvaRate(e.target.value); setError(""); }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 — Délai estimé ── */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Délai d'exécution
              </h2>
              <p className="text-sm text-gray-400 mb-8">
                En combien de jours pouvez-vous réaliser cette mission ?
              </p>

              {/* Raccourcis */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {[1, 3, 5, 7, 14, 30].map(d => (
                  <button key={d} onClick={() => { setEstimatedDays(String(d)); setError(""); }}
                    className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={estimatedDays === String(d)
                      ? { borderColor: "#7e3285", background: "rgba(126,50,133,0.06)", color: "#7e3285" }
                      : { borderColor: "#e5e7eb", background: "white", color: "#374151" }
                    }>
                    {d} jour{d > 1 ? "s" : ""}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  placeholder="Ex: 5"
                  min="1"
                  value={estimatedDays}
                  onChange={e => { setEstimatedDays(e.target.value); setError(""); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-16 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">jours</span>
              </div>

              {/* Récap */}
              <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Récapitulatif</p>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-400"><Euro size={13} /> Prix proposé</span>
                  <span className="font-semibold text-gray-700">{Number(proposedPrice).toLocaleString("fr-FR")} €</span>
                </div>
                {applyTva && tvaRate && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-400"><Euro size={13} /> TVA ({tvaRate}%)</span>
                    <span className="font-semibold text-gray-700">
                      {(Number(proposedPrice) * Number(tvaRate) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-400"><Clock size={13} /> Délai</span>
                  <span className="font-semibold text-gray-700">{estimatedDays} jour{Number(estimatedDays) > 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-400"><FileText size={13} /> Lettre</span>
                  <span className="font-semibold text-gray-700">{coverLetter.length} caractères</span>
                </div>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
        </div>
      </div>

      {/* Boutons navigation */}
      <div className="border-t border-gray-100 bg-white px-8 py-4 flex justify-between items-center">
        <button
          onClick={step === 1 ? () => navigate(-1) : prev}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all bg-white"
        >
          {step === 1 ? "Annuler" : "Précédent"}
        </button>

        {step < TOTAL_STEPS ? (
          <button onClick={next}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#7e3285" }}>
            Suivant
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: "#7e3285" }}>
            {loading ? "Envoi..." : "Envoyer ma candidature"}
          </button>
        )}
      </div>
    </div>
  );
}