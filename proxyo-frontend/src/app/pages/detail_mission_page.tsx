import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Briefcase, Users, Calendar,
  Building2, Trash2, AlertCircle, Euro, CreditCard, CheckCircle
} from "lucide-react";
import Header from "../components/header";
import { getMission, deleteMission, confirmMission } from "../services/missions_api";

// ── Types ──────────────────────────────────────────────────
interface MissionDetail {
  id: number;
  title: string;
  description: string;
  sector: string;
  sector_label: string;
  city: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
  status: "open" | "pending_payment" | "in_progress" | "pending_confirmation" | "completed" | "cancelled" | "expired";
  status_label: string;
  is_expired: boolean;
  company_id: number;
  company_name: string;
  company_sector: string;
  company_city: string;
  applications_count: number;
  payment_id: number | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  open:                 { color: "#16a34a", bg: "#f0fdf4" },
  pending_payment:      { color: "#7c3aed", bg: "#f5f3ff" },
  in_progress:          { color: "#d97706", bg: "#fffbea" },
  pending_confirmation: { color: "#2563eb", bg: "#eff6ff" },
  completed:            { color: "#6b7280", bg: "#f9fafb" },
  cancelled:            { color: "#dc2626", bg: "#fef2f2" },
  expired:              { color: "#ea580c", bg: "#fff7ed" },
};

export default function MissionDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mission, setMission]           = useState<MissionDetail | null>(null);
  const [loading, setLoading]           = useState(true);
  const [deleteModal, setDeleteModal]   = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [confirming, setConfirming]     = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [error, setError]               = useState("");
  const [confirmSuccess, setConfirmSuccess] = useState("");

  useEffect(() => {
    if (!id) return;
    getMission(Number(id))
      .then(setMission)
      .catch(() => setError("Mission introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  const storedUser     = localStorage.getItem("user");
  const companyId      = storedUser ? JSON.parse(storedUser)?.company_id : null;
  const isCompanyOwner = mission ? Number(mission.company_id) === Number(companyId) : false;

  async function handleDelete() {
    if (!mission) return;
    setDeleting(true);
    try {
      await deleteMission(mission.id);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
      setDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmMission() {
    if (!mission) return;
    setConfirming(true);
    try {
      const res = await confirmMission(mission.id);
      setMission(prev => prev ? { ...prev, status: "completed" } : prev);
      setConfirmSuccess(res.detail || "Mission confirmée avec succès.");
      setConfirmModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la confirmation.");
      setConfirmModal(false);
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Header />
        <div className="flex justify-center py-32">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle size={40} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{error || "Mission introuvable."}</p>
          <button onClick={() => navigate("/dashboard")} className="mt-4 text-sm hover:underline" style={{ color: "#7e3285" }}>
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[mission.status];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Retour */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft size={16} /> Retour
        </button>

        {/* ── Layout 2 colonnes ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── COLONNE GAUCHE — Contenu principal ── */}
          <div className="flex-1 space-y-4">

            {/* Card en-tête */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div className="flex items-start gap-4">
                {/* Icône secteur */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(126,50,133,0.08)" }}>
                  <Briefcase size={22} style={{ color: "#7e3285" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    Publiée le {new Date(mission.created_at).toLocaleDateString("fr-FR")}
                    <span className="text-gray-200">·</span>
                    <span>#{mission.id}</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">{mission.title}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    {mission.is_expired ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-orange-600 bg-orange-50">
                        Expirée
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}>
                        {mission.status_label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Briefcase size={14} style={{ color: "#7e3285" }} /> Description
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {mission.description}
              </p>
            </div>

            {/* Card entreprise */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Building2 size={14} style={{ color: "#7e3285" }} /> Entreprise
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "#7e3285" }}>
                  {mission.company_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{mission.company_name}</p>
                  <p className="text-xs text-gray-400">{mission.company_city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── COLONNE DROITE — Sidebar ── */}
          <div className="w-full lg:w-80 space-y-4 flex-shrink-0">

            {/* Card infos clés */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Euro size={15} /> Budget max
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#7e3285" }}>
                    {Number(mission.budget_max).toLocaleString("fr-FR")} €
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Euro size={15} /> Budget min
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {Number(mission.budget_min).toLocaleString("fr-FR")} €
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={15} /> Lieu
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{mission.city}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={15} /> Deadline
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {new Date(mission.deadline).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                {isCompanyOwner && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users size={15} /> Candidatures
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{mission.applications_count}</span>
                  </div>
                )}
              </div>

              {/* CTA selon rôle */}
              <div className="mt-5 space-y-2">
                {confirmSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-700 font-medium">{confirmSuccess}</p>
                  </div>
                )}
                {isCompanyOwner ? (
                  <>
                    {mission.status === "pending_payment" && mission.payment_id && (
                      <button
                        onClick={() => navigate(`/payment/${mission.payment_id}`)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        style={{ background: "#16a34a" }}
                      >
                        <CreditCard size={15} /> Finaliser le paiement
                      </button>
                    )}
                    {mission.status === "pending_confirmation" && (
                      <button
                        onClick={() => setConfirmModal(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        style={{ background: "#2563eb" }}
                      >
                        <CheckCircle size={15} /> Confirmer la mission terminée
                      </button>
                    )}
                    {mission.applications_count > 0 && mission.status === "open" && (
                      <button
                        onClick={() => navigate(`/missions/${mission.id}/applications`)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                        style={{ background: "#7e3285" }}
                      >
                        Voir les candidatures ({mission.applications_count})
                      </button>
                    )}
                    {mission.status === "open" && (
                      <>
                        <button
                          onClick={() => navigate(`/missions/${mission.id}/edit`)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors bg-white"
                        >
                          Modifier la mission
                        </button>
                        <button
                          onClick={() => setDeleteModal(true)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold border border-red-100 text-red-400 hover:bg-red-50 transition-colors bg-white"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  mission.status === "open" && !mission.is_expired && (
                    <button
                      onClick={() => navigate(`/missions/${mission.id}/apply`)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ background: "#7e3285" }}
                    >
                      Candidater
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Card secteur */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Briefcase size={14} /> Secteur
              </div>
              <p className="text-sm font-semibold text-gray-800">{mission.sector_label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal confirmation mission terminée */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-50">
              <CheckCircle size={20} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Confirmer la mission ?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              En confirmant, vous validez que la mission est terminée. Le virement SEPA vers le prestataire sera déclenché automatiquement.
            </p>
            {error && <p className="text-xs text-red-500 text-center mb-4">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 transition-all bg-white">
                Annuler
              </button>
              <button onClick={handleConfirmMission} disabled={confirming}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
                {confirming ? "Confirmation..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Supprimer la mission ?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Cette action est irréversible. Toutes les candidatures associées seront également supprimées.
            </p>
            {error && <p className="text-xs text-red-500 text-center mb-4">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 transition-all bg-white">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}