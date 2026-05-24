import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Briefcase, ArrowLeft, Building2, Star,
  Clock, ChevronRight, Calendar, Phone, X,
  LogIn, UserPlus, Banknote,
} from "lucide-react";
import Header from "../components/header";

const API_URL = "http://127.0.0.1:8000/api/";

interface OpenMission {
  id: number;
  title: string;
  description: string | null;
  budget_min: number | null;
  budget_max: number | null;
  city: string;
  deadline: string | null;
}

interface CompanyDetail {
  id: number;
  name: string;
  sector: string;
  sector_label: string;
  city: string;
  postal_code: string;
  country: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  missions_count: number;
  created_at: string;
  open_missions: OpenMission[];
}

function fmt(n: number | null) {
  if (n == null) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function isLoggedIn() {
  return !!localStorage.getItem("access_token");
}

// ── Modal demande de connexion ──────────────────────────────
function AuthModal({
  action,
  redirectAfter,
  onClose,
}: {
  action: string;
  redirectAfter: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(126,50,133,0.08)" }}>
          <LogIn size={22} style={{ color: "#7e3285" }} />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Connexion requise</h2>
        <p className="text-sm text-gray-500 mb-6">
          Pour <span className="font-semibold text-gray-700">{action}</span>, vous devez être connecté ou avoir un compte Proxyo.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(`/auth?next=${encodeURIComponent(redirectAfter)}`)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ background: "#7e3285" }}
          >
            <LogIn size={15} /> Se connecter
          </button>
          <button
            onClick={() => navigate(`/auth?mode=register&next=${encodeURIComponent(redirectAfter)}`)}
            className="w-full py-3 rounded-xl text-sm font-semibold border-2 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            style={{ borderColor: "#7e3285", color: "#7e3285" }}
          >
            <UserPlus size={15} /> Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authModal, setAuthModal] = useState<{ action: string; redirectAfter: string } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}companies/${id}/`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setCompany(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function handleProtectedAction(action: string, path: string) {
    if (isLoggedIn()) {
      navigate(path);
    } else {
      setAuthModal({ action, redirectAfter: path });
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    </div>
  );

  if (notFound || !company) return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Building2 size={40} className="text-gray-300" />
        <p className="text-gray-500 font-medium">Entreprise introuvable</p>
        <button onClick={() => navigate("/companies")} className="text-sm text-purple-600 hover:underline">
          ← Retour aux entreprises
        </button>
      </div>
    </div>
  );

  const initials = company.name.slice(0, 2).toUpperCase();
  const memberSince = new Date(company.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {authModal && (
        <AuthModal
          action={authModal.action}
          redirectAfter={authModal.redirectAfter}
          onClose={() => setAuthModal(null)}
        />
      )}

      <Header />

      {/* ── Bannière ── */}
      <div className="relative h-52 sm:h-72 overflow-hidden">
        {company.banner_url ? (
          <img src={company.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full"
            style={{ background: "linear-gradient(135deg, #c084d0 0%, #7e3285 55%, #4a1260 100%)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <button
          onClick={() => navigate("/companies")}
          className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
        >
          <ArrowLeft size={15} /> Retour
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4">

        {/* ── Carte identité ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 -mt-14 relative z-10 mb-6"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Logo flottant */}
            <div className="-mt-20 flex-shrink-0">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-xl" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-bold"
                  style={{ background: "linear-gradient(135deg, #9b4daa, #7e3285)" }}>
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={13} style={{ color: "#7e3285" }} />
                      {company.sector_label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} style={{ color: "#7e3285" }} />
                      {company.city}{company.postal_code ? ` ${company.postal_code}` : ""}
                    </span>
                  </div>
                </div>

                {/* CTA principal */}
                <button
                  onClick={() => handleProtectedAction("proposer une mission", "/missions/new")}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex-shrink-0 flex items-center gap-2"
                  style={{ background: "#7e3285" }}
                >
                  <Briefcase size={14} /> Proposer une mission
                </button>
              </div>

              <p className="text-sm leading-relaxed mt-4 max-w-2xl" style={{ color: company.description ? "#6b7280" : "#d1d5db", fontStyle: company.description ? "normal" : "italic" }}>
                {company.description || "Aucune description renseignée pour cette entreprise."}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: "#7e3285" }}>{company.missions_count}</div>
              <div className="text-xs text-gray-400 mt-0.5">Mission{company.missions_count !== 1 ? "s" : ""} ouverte{company.missions_count !== 1 ? "s" : ""}</div>
            </div>
            <div className="border-x border-gray-100">
              <div className="text-2xl font-bold text-gray-700">{company.open_missions.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Publiée{company.open_missions.length !== 1 ? "s" : ""} récemment</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">✓</div>
              <div className="text-xs text-gray-400 mt-0.5">Entreprise vérifiée</div>
            </div>
          </div>
        </div>

        {/* ── Layout 2 colonnes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">

          {/* Colonne gauche — infos */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* À propos */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <h2 className="text-sm font-bold text-gray-900 mb-3">À propos</h2>
              {company.description ? (
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{company.description}</p>
              ) : (
                <p className="text-sm text-gray-300 italic">Aucune description renseignée.</p>
              )}
            </div>

            {/* Infos de contact */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <h2 className="text-sm font-bold text-gray-900 mb-4">Informations</h2>
              <div className="flex flex-col gap-4">

                {[
                  {
                    icon: <MapPin size={13} style={{ color: "#7e3285" }} />,
                    label: "Adresse",
                    value: [company.address, `${company.city}${company.postal_code ? ` ${company.postal_code}` : ""}`, company.country]
                      .filter(Boolean).join(", "),
                  },
                  {
                    icon: <Phone size={13} style={{ color: "#7e3285" }} />,
                    label: "Téléphone",
                    value: company.phone,
                  },
                  {
                    icon: <Briefcase size={13} style={{ color: "#7e3285" }} />,
                    label: "Secteur d'activité",
                    value: company.sector_label,
                  },
                  {
                    icon: <Calendar size={13} style={{ color: "#7e3285" }} />,
                    label: "Membre depuis",
                    value: memberSince,
                  },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3 text-sm">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(126,50,133,0.08)" }}>
                      {row.icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                      {row.value
                        ? <p className="text-gray-700 font-medium">{row.value}</p>
                        : <p className="text-gray-300 italic text-xs">Non renseigné</p>
                      }
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* Colonne droite — missions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Missions ouvertes
                {company.missions_count > 0 && (
                  <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: "#7e3285" }}>
                    {company.missions_count}
                  </span>
                )}
              </h2>
            </div>

            {company.open_missions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <Briefcase size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium text-sm">Aucune mission ouverte pour le moment</p>
                <p className="text-xs text-gray-300 mt-1">Revenez plus tard ou explorez d'autres entreprises</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {company.open_missions.map(m => (
                  <div key={m.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-purple-200 hover:shadow-lg transition-all group"
                    style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug">
                          {m.title}
                        </h3>
                        {(m.budget_min || m.budget_max) && (
                          <div className="flex-shrink-0 text-right">
                            <span className="text-sm font-bold" style={{ color: "#7e3285" }}>
                              {m.budget_min && m.budget_max
                                ? `${fmt(m.budget_min)} – ${fmt(m.budget_max)}`
                                : fmt(m.budget_min ?? m.budget_max)}
                            </span>
                          </div>
                        )}
                      </div>

                      {m.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                          {m.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
                        {m.city && (
                          <span className="flex items-center gap-1"><MapPin size={11} />{m.city}</span>
                        )}
                        {m.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Avant le {new Date(m.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        {(m.budget_min || m.budget_max) && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Banknote size={11} />
                            {m.budget_min && m.budget_max
                              ? `${fmt(m.budget_min)} – ${fmt(m.budget_max)}`
                              : fmt(m.budget_min ?? m.budget_max)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleProtectedAction("candidater à cette mission", `/missions/${m.id}/apply`)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          style={{ background: "#7e3285" }}
                        >
                          <Star size={13} /> Candidater
                        </button>
                        <button
                          onClick={() => navigate(`/missions/${m.id}`)}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-1"
                        >
                          Voir <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
