import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, MapPin, Clock, ArrowRight,
  X, CreditCard, AlertCircle, CheckCircle, Wallet,
} from "lucide-react";
import Header from "../components/header";
import { withdrawApplication } from "../services/application_api";
import { completeMission } from "../services/missions_api";
import { getOnboardingStatus, startOnboarding } from "../services/stripe_api";
import { fetchWithAuth } from "../services/auth_api";

const API_URL = "http://127.0.0.1:8000/api/";

// ── Types ──────────────────────────────────────────────────
interface Application {
  id: number;
  mission_id: number;
  mission_title: string;
  mission_city: string;
  mission_sector: string;
  mission_status: string;
  posted_by: string;
  proposed_price: string;
  estimated_days: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  status_label: string;
  created_at: string;
  payment_id: number | null;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "#d97706", bg: "#fffbea", label: "En attente"  },
  accepted:  { color: "#16a34a", bg: "#f0fdf4", label: "Acceptée"    },
  rejected:  { color: "#dc2626", bg: "#fef2f2", label: "Rejetée"     },
  withdrawn: { color: "#6b7280", bg: "#f9fafb", label: "Retirée"     },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export default function MyApplicationsPage() {
  const navigate = useNavigate();

  const [applications,   setApplications]   = useState<Application[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState("all");
  const [withdrawingId,  setWithdrawingId]  = useState<number | null>(null);
  const [confirmId,      setConfirmId]      = useState<number | null>(null);
  const [completingId,   setCompletingId]   = useState<number | null>(null);
  const [completeConfirm, setCompleteConfirm] = useState<number | null>(null);
  const [completeSuccess, setCompleteSuccess] = useState<number | null>(null);
  const [onboarded,      setOnboarded]      = useState<boolean | null>(null);
  const [onboardLoading, setOnboardLoading] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${API_URL}applications/mes-candidatures/`)
      .then(r => r.json())
      .then(data => setApplications(Array.isArray(data) ? data : data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getOnboardingStatus()
      .then(s => setOnboarded(s.onboarded))
      .catch(() => setOnboarded(null));
  }, []);

  async function handleWithdraw(id: number) {
    setWithdrawingId(id);
    try {
      await withdrawApplication(id);
      setApplications(prev =>
        prev.map(a => a.id === id ? { ...a, status: "withdrawn" as const, status_label: "Retirée" } : a)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawingId(null);
      setConfirmId(null);
    }
  }

  async function handleComplete(missionId: number, appId: number) {
    setCompletingId(appId);
    try {
      await completeMission(missionId);
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, mission_status: "pending_confirmation" } : a)
      );
      setCompleteSuccess(appId);
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingId(null);
      setCompleteConfirm(null);
    }
  }

  async function handleStartOnboarding() {
    setOnboardLoading(true);
    try {
      const { onboarding_url } = await startOnboarding();
      window.location.href = onboarding_url;
    } catch (err) {
      console.error(err);
    } finally {
      setOnboardLoading(false);
    }
  }

  const accepted     = applications.filter(a => a.status === "accepted");
  const needsPayout  = applications.filter(a =>
    a.status === "accepted" &&
    (a.mission_status === "pending_confirmation" || a.mission_status === "completed")
  );
  const showOnboarding = onboarded === false && needsPayout.length > 0;

  const tabs = [
    { key: "all",      label: "Toutes",     count: applications.length },
    { key: "pending",  label: "En attente", count: applications.filter(a => a.status === "pending").length },
    { key: "accepted", label: "Acceptées",  count: accepted.length },
    { key: "rejected", label: "Rejetées",   count: applications.filter(a => a.status === "rejected").length },
  ];

  const filtered = activeTab === "all"
    ? applications
    : applications.filter(a => a.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* En-tête */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes candidatures</h1>
          <p className="text-sm text-gray-400 mt-1">Suivez l'état de vos candidatures</p>
        </div>

        {/* ── Bannière onboarding Stripe ── */}
        {showOnboarding && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Wallet size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">
                    Configurez votre IBAN pour recevoir vos paiements
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Vous avez {needsPayout.length} mission{needsPayout.length > 1 ? "s" : ""} terminée{needsPayout.length > 1 ? "s" : ""}.
                    Renseignez votre IBAN pour recevoir votre virement SEPA automatiquement.
                  </p>
                </div>
              </div>
              <button
                onClick={handleStartOnboarding}
                disabled={onboardLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                {onboardLoading ? "Chargement..." : "Configurer mon IBAN"}
              </button>
            </div>
          </div>
        )}

        {/* ── Bandeau paiement en attente ── */}
        {accepted.filter(a => a.mission_status === "pending_payment").length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <CreditCard size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">
                  Candidature(s) acceptée(s) — en attente de paiement du client
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  La mission démarrera dès que le client aura finalisé le paiement.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {accepted.filter(a => a.mission_status === "pending_payment").map(app => (
                <div key={app.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-green-100">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{app.mission_title}</p>
                    <p className="text-xs text-gray-400">Par {app.posted_by}</p>
                  </div>
                  <span className="text-sm font-bold text-green-700 flex-shrink-0">
                    {Number(app.proposed_price).toLocaleString("fr-FR")} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Liste des candidatures ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 py-4 mr-6 text-sm font-medium border-b-2 transition-all whitespace-nowrap"
                style={activeTab === tab.key
                  ? { color: "#7e3285", borderColor: "#7e3285" }
                  : { color: "#9ca3af", borderColor: "transparent" }
                }
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={activeTab === tab.key
                      ? { background: "rgba(126,50,133,0.1)", color: "#7e3285" }
                      : { background: "#f3f4f6", color: "#9ca3af" }
                    }>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(126,50,133,0.06)" }}>
                <Briefcase size={24} style={{ color: "#7e3285" }} />
              </div>
              <p className="text-gray-500 font-medium mb-1">Aucune candidature</p>
              <p className="text-sm text-gray-400">
                {activeTab === "all"
                  ? "Vous n'avez pas encore candidaté à une mission."
                  : `Aucune candidature "${tabs.find(t => t.key === activeTab)?.label}".`
                }
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((app, i) => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                const canComplete = app.status === "accepted" && app.mission_status === "in_progress";
                const isPendingConfirm = app.mission_status === "pending_confirmation";
                return (
                  <div key={app.id}
                    className={`px-6 py-5 ${i < filtered.length - 1 ? "border-b border-gray-50" : ""} ${app.status === "accepted" ? "bg-green-50/30" : ""}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">

                      {/* Infos mission */}
                      <div className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/missions/${app.mission_id}`)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 hover:text-purple-700 transition-colors truncate">
                            {app.mission_title}
                          </h3>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.label}
                          </span>
                          {app.status === "accepted" && app.mission_status && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: app.mission_status === "in_progress" ? "#fffbea" : app.mission_status === "pending_confirmation" ? "#eff6ff" : "#f0fdf4",
                                color: app.mission_status === "in_progress" ? "#d97706" : app.mission_status === "pending_confirmation" ? "#2563eb" : "#16a34a",
                              }}>
                              {app.mission_status === "in_progress" ? "En cours" : app.mission_status === "pending_confirmation" ? "En attente confirmation" : app.mission_status === "completed" ? "Terminée" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Par {app.posted_by}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin size={11} />{app.mission_city}</span>
                          <span className="flex items-center gap-1"><Briefcase size={11} />{app.mission_sector}</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(app.created_at)}</span>
                        </div>
                        {/* Confirmation succès */}
                        {completeSuccess === app.id && (
                          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <CheckCircle size={11} /> Mission marquée comme terminée — le client doit confirmer.
                          </p>
                        )}
                      </div>

                      {/* Prix + actions */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: "#7e3285" }}>
                            {Number(app.proposed_price).toLocaleString("fr-FR")} €
                          </p>
                          <p className="text-xs text-gray-400">{app.estimated_days} jour{app.estimated_days > 1 ? "s" : ""}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">

                          {/* Marquer terminée (prestataire, mission in_progress) */}
                          {canComplete && (
                            completeConfirm === app.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleComplete(app.mission_id, app.id)}
                                  disabled={completingId === app.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                  {completingId === app.id ? "..." : "Confirmer"}
                                </button>
                                <button onClick={() => setCompleteConfirm(null)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCompleteConfirm(app.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 bg-white transition-colors"
                              >
                                <CheckCircle size={11} /> Terminée
                              </button>
                            )
                          )}

                          {/* En attente de confirmation client */}
                          {isPendingConfirm && app.status === "accepted" && completeSuccess !== app.id && (
                            <span className="flex items-center gap-1 text-xs text-blue-500 px-2 py-1.5 rounded-lg bg-blue-50">
                              <Clock size={11} /> Confirmation client
                            </span>
                          )}

                          {/* Voir mission */}
                          <button
                            onClick={() => navigate(`/missions/${app.mission_id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:border-gray-300 bg-white transition-all"
                          >
                            Voir <ArrowRight size={11} />
                          </button>

                          {/* Retirer si pending */}
                          {app.status === "pending" && (
                            confirmId === app.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleWithdraw(app.id)}
                                  disabled={withdrawingId === app.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
                                >
                                  {withdrawingId === app.id ? "..." : "Confirmer"}
                                </button>
                                <button onClick={() => setConfirmId(null)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmId(app.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-100 text-red-400 hover:bg-red-50 bg-white transition-colors"
                              >
                                <X size={11} /> Retirer
                              </button>
                            )
                          )}

                          {/* Message si rejetée */}
                          {app.status === "rejected" && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <AlertCircle size={11} /> Non retenue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
