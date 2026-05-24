import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { createMission } from "../services/missions_api";

const SECTOR_CHOICES = [
  { value: "it",           label: "IT / Informatique" },
  { value: "secretariat",  label: "Secrétariat / Assistanat" },
  { value: "photographie", label: "Photographie / Vidéo" },
  { value: "jardinage",    label: "Jardinage" },
  { value: "manutention",  label: "Manutention / Déménagement" },
  { value: "securite",     label: "Sécurité / Gardiennage" },
  { value: "restauration", label: "Restauration" },
  { value: "nettoyage",    label: "Nettoyage / Ménage" },
  { value: "autre",        label: "Autre" },
];

interface MissionForm {
  title: string;
  description: string;
  sector: string;
  city: string;
  postal_code: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
}

const TOTAL_STEPS = 6;

export default function NewMissionPage() {
  const navigate  = useNavigate();
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const [form, setForm] = useState<MissionForm>({
    title: "", description: "", sector: "",
    city: "", postal_code: "", budget_min: "", budget_max: "", deadline: "",
  });

  function set(field: keyof MissionForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  function validate(): boolean {
    if (step === 1 && !form.title.trim())       { setError("Le titre est requis."); return false; }
    if (step === 2 && !form.description.trim()) { setError("La description est requise."); return false; }
    if (step === 3 && !form.sector)             { setError("Le secteur est requis."); return false; }
    if (step === 4 && !form.city.trim())                    { setError("La ville est requise."); return false; }
    if (step === 4 && !form.postal_code.trim())             { setError("Le code postal est requis."); return false; }
    if (step === 4 && !/^\d{5}$/.test(form.postal_code))   { setError("Le code postal doit contenir 5 chiffres."); return false; }
    if (step === 5 && !form.deadline)           { setError("La date limite est requise."); return false; }
    if (step === 6) {
      if (!form.budget_min) { setError("Le budget minimum est requis."); return false; }
      if (!form.budget_max) { setError("Le budget maximum est requis."); return false; }
      if (Number(form.budget_min) >= Number(form.budget_max)) {
        setError("Le budget maximum doit être supérieur au budget minimum."); return false;
      }
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
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      await createMission({
        title:        form.title,
        description:  form.description,
        sector:       form.sector,
        city:         form.city,
        postal_code:  form.postal_code,
        budget_min:   Number(form.budget_min),
        budget_max:   Number(form.budget_max),
        deadline:     form.deadline,
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  }

  // Barre de progression
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header avec barre de progression */}
      <div className="relative">
        <Header />
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 transition-all duration-500"
            style={{ width: `${progress}%`, background: "#7e3285" }}
          />
        </div>
      </div>

      {/* Contenu centré */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-16">
        <div className="w-full max-w-xl">

          {/* ── ÉTAPE 1 — Titre ── */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">
                Quel est le titre<br />de votre mission ?
              </h2>
              <input
                autoFocus
                placeholder="Ex: Nettoyage locaux bureaux hebdomadaire"
                value={form.title}
                onChange={e => set("title", e.target.value)}
                onKeyDown={e => e.key === "Enter" && next()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
              />
            </div>
          )}

          {/* ── ÉTAPE 2 — Description ── */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">
                Décrivez votre mission
              </h2>
              <textarea
                autoFocus
                placeholder="Décrivez précisément la mission, les attentes, les contraintes, le matériel fourni..."
                value={form.description}
                onChange={e => set("description", e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white resize-none"
              />
            </div>
          )}

          {/* ── ÉTAPE 3 — Secteur ── */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">
                Quel est le secteur<br />d'activité ?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {SECTOR_CHOICES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => set("sector", s.value)}
                    className="px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-all"
                    style={form.sector === s.value
                      ? { borderColor: "#7e3285", background: "rgba(126,50,133,0.06)", color: "#7e3285" }
                      : { borderColor: "#e5e7eb", background: "white", color: "#374151" }
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 — Ville ── */}
          {step === 4 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">
                Dans quelle ville<br />se déroule la mission ?
              </h2>
              <input
                autoFocus
                placeholder="Paris, Lyon, Marseille..."
                value={form.city}
                onChange={e => set("city", e.target.value)}
                onKeyDown={e => e.key === "Enter" && next()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
              />
              <input
                placeholder="Code postal (ex: 75001)"
                value={form.postal_code}
                onChange={e => set("postal_code", e.target.value)}
                onKeyDown={e => e.key === "Enter" && next()}
                maxLength={5}
                className="w-full mt-3 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
              />
            </div>
          )}

          {/* ── ÉTAPE 5 — Deadline ── */}
          {step === 5 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">
                Quelle est la date<br />limite de la mission ?
              </h2>
              <input
                autoFocus
                type="date"
                min={minDate}
                value={form.deadline}
                onChange={e => set("deadline", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
              />
            </div>
          )}

          {/* ── ÉTAPE 6 — Budget ── */}
          {step === 6 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Étape {step}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">
                Quel est votre budget<br />estimé ?
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Minimum (€)</label>
                  <input
                    autoFocus
                    type="number"
                    placeholder="150"
                    min="1"
                    value={form.budget_min}
                    onChange={e => set("budget_min", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
                  />
                </div>
                <span className="text-gray-300 mt-5">—</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Maximum (€)</label>
                  <input
                    type="number"
                    placeholder="500"
                    min="1"
                    value={form.budget_max}
                    onChange={e => set("budget_max", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
        </div>
      </div>

      {/* ── Boutons navigation en bas ── */}
      <div className="border-t border-gray-100 bg-white px-8 py-4 flex justify-between items-center">
        <button
          onClick={step === 1 ? () => navigate("/dashboard") : prev}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all bg-white"
        >
          {step === 1 ? "Quitter" : "Précédent"}
        </button>

        {step < TOTAL_STEPS ? (
          <button
            onClick={next}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#7e3285" }}
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: "#7e3285" }}
          >
            {loading ? "Publication..." : "Publier la mission"}
          </button>
        )}
      </div>
    </div>
  );
}