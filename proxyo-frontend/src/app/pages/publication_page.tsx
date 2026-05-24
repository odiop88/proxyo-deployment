import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, MapPin, Briefcase, Clock, Users,
  Eye, Pencil, Trash2, Package, AlertCircle,
  CheckCircle, CreditCard, Activity, CheckSquare, XCircle,
  AlertTriangle, ArrowLeft,
} from "lucide-react";
import Header from "../components/header";
import { getMissions, deleteMission } from "../services/missions_api";

// ── Types ──────────────────────────────────────────────────
interface Mission {
  id: number;
  title: string;
  sector_label: string;
  city: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
  status: "open" | "pending_payment" | "in_progress" | "pending_confirmation" | "completed" | "cancelled" | "expired";
  status_label: string;
  is_expired: boolean;
  applications_count: number;
}

type StatusKey = Mission["status"];

const STATUS_CONFIG: Record<StatusKey, { color: string; bg: string }> = {
  open:                 { color: "#16a34a", bg: "#f0fdf4" },
  pending_payment:      { color: "#7c3aed", bg: "#f5f3ff" },
  in_progress:          { color: "#d97706", bg: "#fffbea" },
  pending_confirmation: { color: "#2563eb", bg: "#eff6ff" },
  completed:            { color: "#6b7280", bg: "#f9fafb" },
  cancelled:            { color: "#dc2626", bg: "#fef2f2" },
  expired:              { color: "#ea580c", bg: "#fff7ed" },
};

const STATUS_FOLDERS: { key: StatusKey; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }> }[] = [
  { key: "open",                 label: "Ouvertes",          Icon: CheckCircle   },
  { key: "pending_payment",      label: "Att. paiement",     Icon: CreditCard    },
  { key: "in_progress",          label: "En cours",          Icon: Activity      },
  { key: "pending_confirmation", label: "Att. confirmation", Icon: Clock         },
  { key: "completed",            label: "Terminées",         Icon: CheckSquare   },
  { key: "cancelled",            label: "Annulées",          Icon: XCircle       },
  { key: "expired",              label: "Expirées",          Icon: AlertTriangle },
];

// ── Modal suppression ──────────────────────────────────────
function DeleteModal({
  mission, onConfirm, onCancel, loading, error,
}: {
  mission: Mission; onConfirm: () => void; onCancel: () => void; loading: boolean; error: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Supprimer la mission ?</h3>
        <p className="text-sm text-gray-400 text-center mb-1">« {mission.title} »</p>
        {mission.applications_count > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4 mt-3">
            <AlertCircle size={15} className="text-orange-400 flex-shrink-0" />
            <p className="text-xs text-orange-600">
              Cette mission a {mission.applications_count} candidature(s). La suppression est impossible.
            </p>
          </div>
        )}
        {!mission.applications_count && (
          <p className="text-xs text-gray-400 text-center mb-5 mt-2">Cette action est irréversible.</p>
        )}
        {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 bg-white transition-colors">
            Annuler
          </button>
          {!mission.applications_count && (
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
              {loading ? "Suppression..." : "Supprimer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Palette dossier (une seule teinte violette)
const F = {
  tab:    "#4a1260",
  top:    "#9b4dab",
  mid:    "#7e3285",
  bottom: "#5c1f72",
  stripe: "rgba(255,255,255,0.55)",
  card:   "rgba(255,255,255,0.18)",
  text:   "rgba(255,255,255,0.65)",
  foot:   "rgba(0,0,0,0.18)",
};

// ── Folder Card ────────────────────────────────────────────
function StatusFolderCard({
  folder, missions, onClick,
}: {
  folder: typeof STATUS_FOLDERS[number];
  missions: Mission[];
  onClick: () => void;
}) {
  const folderMissions = missions.filter(m => m.status === folder.key);
  const count = folderMissions.length;
  const preview = folderMissions.slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="relative text-left group cursor-pointer w-full"
      style={{ paddingTop: "20px" }}
    >
      {/* ── Onglet (tab) ── */}
      <div
        className="absolute top-0 left-0 z-10"
        style={{
          width: "46%",
          height: "24px",
          background: F.tab,
          borderRadius: "16px 16px 0 0",
        }}
      />

      {/* ── Corps principal ── */}
      <div
        className="overflow-hidden group-hover:shadow-2xl transition-all duration-200"
        style={{
          borderRadius: "0 28px 28px 28px",
          background: `linear-gradient(175deg, ${F.top} 0%, ${F.mid} 45%, ${F.bottom} 100%)`,
          boxShadow: "0 6px 20px rgba(94,20,110,0.35)",
        }}
      >
        {/* Bande blanche (bouche du dossier) */}
        <div style={{ height: "4px", background: F.stripe }} />

        {/* Zone contenu */}
        <div className="px-5 pt-4 pb-3 min-h-[110px]">
          {count === 0 ? (
            <div className="flex items-center justify-center h-20">
              <folder.Icon size={38} strokeWidth={1} style={{ color: "rgba(255,255,255,0.25)" }} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {preview.map((m, i) => (
                <div
                  key={m.id}
                  className="px-3 py-2"
                  style={{ background: F.card, opacity: 1 - i * 0.25, borderRadius: "14px" }}
                >
                  <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: F.text }}>
                    {m.city} · {m.sector_label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied du dossier */}
        <div className="px-5 py-3.5" style={{ background: F.foot }}>
          <p className="text-sm font-bold text-white">{folder.label}</p>
          <p className="text-xs mt-0.5" style={{ color: F.text }}>
            {count} mission{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Empty state ────────────────────────────────────────────
function EmptyState({ onPublish }: { onPublish: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(126,50,133,0.06)" }}>
        <Package size={36} strokeWidth={1.2} style={{ color: "#c4b5d0" }} />
      </div>
      <p className="text-sm font-semibold text-gray-500 mb-1">Aucune mission publiée</p>
      <p className="text-xs text-gray-400 text-center max-w-xs mb-6">
        Publiez votre première mission pour recevoir des candidatures d'entreprises qualifiées.
      </p>
      <button onClick={onPublish}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        style={{ background: "#7e3285" }}>
        <Plus size={15} /> Publier une mission
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function PublicationPage() {
  const navigate = useNavigate();

  const [missions,     setMissions]     = useState<Mission[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFolder, setActiveFolder] = useState<StatusKey | null>(null);
  const [toDelete,     setToDelete]     = useState<Mission | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteErr,    setDeleteErr]    = useState("");

  useEffect(() => {
    getMissions()
      .then(data => setMissions(Array.isArray(data) ? data : data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered      = activeFolder ? missions.filter(m => m.status === activeFolder) : [];
  const activeCfg     = activeFolder ? STATUS_CONFIG[activeFolder] : null;
  const activeFolderInfo = activeFolder ? STATUS_FOLDERS.find(f => f.key === activeFolder) : null;

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteErr("");
    try {
      await deleteMission(toDelete.id);
      setMissions(prev => prev.filter(m => m.id !== toDelete.id));
      setToDelete(null);
    } catch (err: unknown) {
      setDeleteErr(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            {activeFolder && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <button onClick={() => setActiveFolder(null)}
                  className="hover:text-gray-600 transition-colors font-medium">
                  Mes publications
                </button>
                <span>/</span>
                <span className="font-medium" style={{ color: activeCfg?.color }}>
                  {activeFolderInfo?.label}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">
              {activeFolder ? activeFolderInfo?.label : "Mes publications"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {activeFolder
                ? `${filtered.length} mission${filtered.length !== 1 ? "s" : ""}`
                : `${missions.length} mission${missions.length !== 1 ? "s" : ""} au total`}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {activeFolder && (
              <button
                onClick={() => setActiveFolder(null)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 bg-white transition-colors"
              >
                <ArrowLeft size={14} /> Retour
              </button>
            )}
            <button
              onClick={() => navigate("/missions/new")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "#7e3285" }}
            >
              <Plus size={15} /> Publier une mission
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : activeFolder === null ? (

          /* ── Grille de dossiers ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATUS_FOLDERS.map(folder => (
              <StatusFolderCard
                key={folder.key}
                folder={folder}
                missions={missions}
                onClick={() => setActiveFolder(folder.key)}
              />
            ))}
          </div>

        ) : (

          /* ── Liste des missions du dossier ── */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              activeFolder === "open"
                ? <EmptyState onPublish={() => navigate("/missions/new")} />
                : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <p className="text-sm text-gray-400">Aucune mission dans cette catégorie.</p>
                  </div>
                )
            ) : (
              <div>
                {/* En-tête colonnes */}
                <div className="hidden md:grid grid-cols-12 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">
                  <div className="col-span-5">Mission</div>
                  <div className="col-span-2 text-center">Statut</div>
                  <div className="col-span-2 text-center">Deadline</div>
                  <div className="col-span-1 text-center">Candid.</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Lignes */}
                {filtered.map(mission => {
                  const cfg = STATUS_CONFIG[mission.status];
                  return (
                    <div
                      key={mission.id}
                      className="grid grid-cols-12 items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors group"
                    >
                      <div className="col-span-12 md:col-span-5 min-w-0 mb-3 md:mb-0">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-purple-700 transition-colors">
                          {mission.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {mission.city}</span>
                          <span className="flex items-center gap-1"><Briefcase size={10} /> {mission.sector_label}</span>
                        </div>
                        <p className="text-xs font-semibold mt-1.5" style={{ color: "#7e3285" }}>
                          {Number(mission.budget_min).toLocaleString("fr-FR")} € – {Number(mission.budget_max).toLocaleString("fr-FR")} €
                        </p>
                      </div>

                      <div className="col-span-4 md:col-span-2 flex md:justify-center">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: cfg.color, background: cfg.bg }}>
                          {mission.status_label}
                        </span>
                      </div>

                      <div className="col-span-4 md:col-span-2 flex items-center md:justify-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />
                        {new Date(mission.deadline).toLocaleDateString("fr-FR")}
                      </div>

                      <div className="col-span-2 md:col-span-1 flex items-center md:justify-center gap-1 text-xs">
                        <Users size={11} className="text-gray-400" />
                        <span className={mission.applications_count > 0 ? "font-bold" : "text-gray-400"}
                          style={mission.applications_count > 0 ? { color: "#7e3285" } : {}}>
                          {mission.applications_count}
                        </span>
                      </div>

                      <div className="col-span-2 md:col-span-2 flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/missions/${mission.id}`)} title="Voir le détail"
                          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-eminence hover:border-purple-200 bg-white transition-colors">
                          <Eye size={13} />
                        </button>
                        {mission.status === "open" && mission.applications_count === 0 && (
                          <button onClick={() => navigate(`/missions/${mission.id}/edit`)} title="Modifier"
                            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 bg-white transition-colors">
                            <Pencil size={13} />
                          </button>
                        )}
                        {mission.status === "open" && (
                          <button onClick={() => { setToDelete(mission); setDeleteErr(""); }} title="Supprimer"
                            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-200 bg-white transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {toDelete && (
        <DeleteModal
          mission={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleting}
          error={deleteErr}
        />
      )}
    </div>
  );
}
