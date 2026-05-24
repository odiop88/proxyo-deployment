import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Euro, Clock, FileText,
  CheckCircle, XCircle, AlertCircle, Package,
} from "lucide-react";
import Header from "../components/header";
import { getMissionApplications } from "../services/missions_api";
import { actionApplication } from "../services/application_api";

// ── Types ──────────────────────────────────────────────────
interface Application {
  id: number;
  company_name: string;
  company_city?: string;
  proposed_price: string;
  estimated_days: number;
  cover_letter: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  status_label: string;
  created_at: string;
}

interface MissionApplicationsData {
  mission_id: number;
  mission_title: string;
  total_applications: number;
  applications: Application[];
}

const STATUS_CONFIG = {
  pending:   { color: "#d97706", bg: "#fffbea", label: "En attente"  },
  accepted:  { color: "#16a34a", bg: "#f0fdf4", label: "Acceptée"    },
  rejected:  { color: "#dc2626", bg: "#fef2f2", label: "Rejetée"     },
  withdrawn: { color: "#6b7280", bg: "#f9fafb", label: "Retirée"     },
};

// ── Card candidature ───────────────────────────────────────
function ApplicationCard({
  app,
  onAccept,
  onReject,
  actionLoading,
}: {
  app: Application;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: number | null;
}) {
  const [showLetter, setShowLetter] = useState(false);
  const cfg = STATUS_CONFIG[app.status];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Entreprise */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "#7e3285" }}
            >
              {app.company_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{app.company_name}</p>
              {app.company_city && (
                <p className="text-xs text-gray-400 mt-0.5">{app.company_city}</p>
              )}
            </div>
          </div>

          {/* Statut */}
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1">
              <Euro size={11} /> Prix proposé
            </div>
            <div className="text-sm font-bold" style={{ color: "#7e3285" }}>
              {Number(app.proposed_price).toLocaleString("fr-FR")} €
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1">
              <Clock size={11} /> Délai
            </div>
            <div className="text-sm font-bold text-gray-700">
              {app.estimated_days} j.
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1">
              <FileText size={11} /> Reçue le
            </div>
            <div className="text-xs font-semibold text-gray-700">
              {new Date(app.created_at).toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        {/* Lettre de motivation */}
        <div className="mb-4">
          <button
            onClick={() => setShowLetter(v => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FileText size={12} />
            {showLetter ? "Masquer la lettre" : "Voir la lettre de motivation"}
          </button>
          {showLetter && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {app.cover_letter}
            </div>
          )}
        </div>

        {/* Actions — seulement si pending */}
        {app.status === "pending" && (
          <div className="flex gap-2 pt-4 border-t border-gray-50">
            <button
              onClick={() => onAccept(app.id)}
              disabled={actionLoading === app.id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#16a34a" }}
            >
              <CheckCircle size={15} />
              {actionLoading === app.id ? "..." : "Accepter"}
            </button>
            <button
              onClick={() => onReject(app.id)}
              disabled={actionLoading === app.id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <XCircle size={15} />
              {actionLoading === app.id ? "..." : "Refuser"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function MissionApplicationsPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data,          setData]          = useState<MissionApplicationsData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError,   setActionError]   = useState("");

  useEffect(() => {
    if (!id) return;
    getMissionApplications(Number(id))
      .then(setData)
      .catch(() => setError("Impossible de charger les candidatures."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(appId: number, action: "accept" | "reject") {
    setActionLoading(appId);
    setActionError("");
    try {
      await actionApplication(appId, action);
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          applications: prev.applications.map(a =>
            a.id === appId
              ? { ...a, status: action === "accept" ? "accepted" : "rejected" as const }
              : a
          ),
        };
      });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'action.");
    } finally {
      setActionLoading(null);
    }
  }

  const pending   = data?.applications.filter(a => a.status === "pending")   ?? [];
  const treated   = data?.applications.filter(a => a.status !== "pending")   ?? [];

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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle size={36} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">{error || "Données introuvables."}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm hover:underline" style={{ color: "#7e3285" }}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Retour */}
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft size={15} /> Retour au dashboard
        </button>

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Candidatures reçues</h1>
          <p className="text-sm text-gray-400">
            Mission : <span className="font-medium text-gray-600">{data.mission_title}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          {[
            { label: "Total",      value: data.total_applications, icon: <Users size={16} />,       color: "#7e3285" },
            { label: "En attente", value: pending.length,          icon: <Clock size={16} />,        color: "#d97706" },
            { label: "Traitées",   value: treated.length,          icon: <CheckCircle size={16} />, color: "#16a34a" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
              <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Erreur action */}
        {actionError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600">{actionError}</p>
          </div>
        )}

        {/* Aucune candidature */}
        {data.total_applications === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20 shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(126,50,133,0.06)" }}>
              <Package size={28} strokeWidth={1.2} style={{ color: "#c4b5d0" }} />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Aucune candidature pour le moment</p>
            <p className="text-xs text-gray-400">Les candidatures apparaîtront ici dès qu'une entreprise postulera.</p>
          </div>
        )}

        {/* Candidatures en attente */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              En attente de décision ({pending.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pending.map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onAccept={id => handleAction(id, "accept")}
                  onReject={id => handleAction(id, "reject")}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Candidatures traitées */}
        {treated.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Déjà traitées ({treated.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {treated.map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onAccept={id => handleAction(id, "accept")}
                  onReject={id => handleAction(id, "reject")}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
