import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Briefcase, FileText, Bell, User,
  ArrowRight, TrendingUp, Clock, CheckCircle, XCircle,
} from "lucide-react";
import Header from "../components/header";
import { getMissions } from "../services/missions_api";

const API_URL = "http://127.0.0.1:8000/api/";

interface Stats {
  missions_publiees: number;
  candidatures_envoyees: number;
  candidatures_acceptees: number;
  notifications_non_lues: number;
}

interface RecentMission {
  id: number;
  title: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  status_label: string;
  applications_count: number;
  deadline: string;
}

interface RecentApplication {
  id: number;
  mission_title: string;
  posted_by: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  status_label: string;
  proposed_price: string;
}

const STATUS_MISSION = {
  open:        { color: "#16a34a", bg: "#f0fdf4" },
  in_progress: { color: "#d97706", bg: "#fffbea" },
  completed:   { color: "#6b7280", bg: "#f9fafb" },
  cancelled:   { color: "#dc2626", bg: "#fef2f2" },
};

const STATUS_APPLICATION = {
  pending:   { color: "#d97706", bg: "#fffbea", label: "En attente" },
  accepted:  { color: "#16a34a", bg: "#f0fdf4", label: "Acceptée" },
  rejected:  { color: "#dc2626", bg: "#fef2f2", label: "Refusée" },
  withdrawn: { color: "#6b7280", bg: "#f9fafb", label: "Retirée" },
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const storedUser    = localStorage.getItem("user");
  const storedCompany = localStorage.getItem("company");
  const user          = storedUser    ? JSON.parse(storedUser)    : null;
  const company       = storedCompany ? JSON.parse(storedCompany) : null;

  const [stats,            setStats]            = useState<Stats | null>(null);
  const [recentMissions,   setRecentMissions]   = useState<RecentMission[]>([]);
  const [recentApps,       setRecentApps]       = useState<RecentApplication[]>([]);
  const [loadingMissions,  setLoadingMissions]  = useState(true);
  const [loadingApps,      setLoadingApps]      = useState(true);

  // Missions publiées
  useEffect(() => {
    getMissions()
      .then(data => {
        const list: RecentMission[] = Array.isArray(data) ? data : data.results || [];
        setRecentMissions(list.slice(0, 4));
        setStats(prev => ({
          missions_publiees:       list.length,
          candidatures_envoyees:   prev?.candidatures_envoyees   ?? 0,
          candidatures_acceptees:  prev?.candidatures_acceptees  ?? 0,
          notifications_non_lues:  prev?.notifications_non_lues  ?? 0,
        }));
      })
      .catch(console.error)
      .finally(() => setLoadingMissions(false));
  }, []);

  // Candidatures envoyées
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setLoadingApps(false); return; }

    fetch(`${API_URL}applications/my/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const list: RecentApplication[] = Array.isArray(data) ? data : data.results || [];
        setRecentApps(list.slice(0, 4));
        setStats(prev => ({
          missions_publiees:       prev?.missions_publiees      ?? 0,
          candidatures_envoyees:   list.length,
          candidatures_acceptees:  list.filter(a => a.status === "accepted").length,
          notifications_non_lues:  prev?.notifications_non_lues ?? 0,
        }));
      })
      .catch(console.error)
      .finally(() => setLoadingApps(false));
  }, []);

  const QUICK_ACTIONS = [
    {
      icon: <Plus size={22} />,
      label: "Publier une mission",
      description: "Trouvez des prestataires qualifiés",
      href: "/missions/new",
      primary: true,
    },
    {
      icon: <Briefcase size={22} />,
      label: "Mes missions",
      description: "Gérez vos publications",
      href: "/dashboard/missions",
      primary: false,
    },
    {
      icon: <FileText size={22} />,
      label: "Mes candidatures",
      description: "Suivez vos candidatures envoyées",
      href: "/dashboard/candidatures",
      primary: false,
    },
    {
      icon: <Bell size={22} />,
      label: "Notifications",
      description: "Vos alertes et messages",
      href: "/notifications",
      primary: false,
    },
    {
      icon: <User size={22} />,
      label: "Mon profil",
      description: "Gérez votre entreprise",
      href: "/dashboard/profil",
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Bonjour, {user?.first_name || company?.name || "–"} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-1">{company?.name}</p>
          </div>
          <button
            onClick={() => navigate("/missions/new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity self-start sm:self-auto"
            style={{ background: "#7e3285" }}
          >
            <Plus size={15} /> Publier une mission
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Missions publiées",      value: stats?.missions_publiees      ?? "–", icon: <Briefcase size={18} />,    color: "#7e3285" },
            { label: "Candidatures envoyées",  value: stats?.candidatures_envoyees  ?? "–", icon: <FileText size={18} />,     color: "#2563eb" },
            { label: "Candidatures acceptées", value: stats?.candidatures_acceptees ?? "–", icon: <CheckCircle size={18} />,  color: "#16a34a" },
            { label: "Notifications",          value: stats?.notifications_non_lues ?? "–", icon: <Bell size={18} />,         color: "#d97706" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Actions rapides ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.href)}
                className="flex flex-col items-center text-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-2xl border transition-all hover:shadow-md"
                style={action.primary
                  ? { background: "#7e3285", borderColor: "#7e3285", color: "white" }
                  : { background: "white", borderColor: "#f3f4f6", color: "#374151" }
                }
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={action.primary
                    ? { background: "rgba(255,255,255,0.2)" }
                    : { background: "rgba(126,50,133,0.08)", color: "#7e3285" }
                  }
                >
                  {action.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold">{action.label}</div>
                  <div className="text-xs mt-0.5 opacity-60">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Deux colonnes : missions récentes + candidatures récentes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Missions publiées récentes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Mes dernières missions</h2>
              <button
                onClick={() => navigate("/dashboard/missions")}
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: "#7e3285" }}
              >
                Tout voir <ArrowRight size={12} />
              </button>
            </div>

            {loadingMissions ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : recentMissions.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center px-6">
                <TrendingUp size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Aucune mission publiée pour l'instant.</p>
                <button onClick={() => navigate("/missions/new")}
                  className="mt-3 text-xs font-semibold hover:underline" style={{ color: "#7e3285" }}>
                  Publier ma première mission
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentMissions.map(m => {
                  const cfg = STATUS_MISSION[m.status];
                  return (
                    <div key={m.id}
                      onClick={() => navigate(`/missions/${m.id}`)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{m.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: cfg.color, background: cfg.bg }}>
                              {m.status_label}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={10} /> {new Date(m.deadline).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold" style={{ color: "#7e3285" }}>{m.applications_count}</div>
                          <div className="text-xs text-gray-400">candid.</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Candidatures envoyées récentes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Mes dernières candidatures</h2>
              <button
                onClick={() => navigate("/dashboard/candidatures")}
                className="text-xs flex items-center gap-1 hover:underline"
                style={{ color: "#7e3285" }}
              >
                Tout voir <ArrowRight size={12} />
              </button>
            </div>

            {loadingApps ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : recentApps.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center px-6">
                <FileText size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Vous n'avez pas encore candidaté à une mission.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentApps.map(a => {
                  const cfg = STATUS_APPLICATION[a.status];
                  return (
                    <div key={a.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{a.mission_title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{a.posted_by}</p>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                          <span className="block text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.label}
                          </span>
                          <span className="block text-xs font-bold" style={{ color: "#7e3285" }}>
                            {Number(a.proposed_price).toLocaleString("fr-FR")} €
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Rappel logique candidature ── */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-6 py-4 flex items-start gap-3">
          <XCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-700">
            <span className="font-semibold">Rappel :</span> Vous ne pouvez pas candidater à vos propres missions. Le bouton "Candidater" n'apparaît que sur les missions publiées par d'autres entreprises.
          </p>
        </div>

      </div>
    </div>
  );
}
