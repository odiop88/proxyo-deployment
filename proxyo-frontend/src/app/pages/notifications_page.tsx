import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Briefcase, UserCheck, UserX, Star, X } from "lucide-react";
import Header from "../components/header";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/notifications_api";

// ── Types ──────────────────────────────────────────────────
interface NotificationData {
  mission_id?: number;
  mission_title?: string;
  application_id?: number;
  city?: string;
  budget_min?: string;
  budget_max?: string;
}

interface Notification {
  id: number;
  type: "new_mission" | "new_application" | "application_accepted" | "application_rejected" | "review_received";
  title: string;
  message: string;
  data: NotificationData;
  is_read: boolean;
  created_at: string;
}

// ── Config icônes par type ─────────────────────────────────
const TYPE_CONFIG = {
  new_mission:          { icon: Briefcase, color: "#7e3285", bg: "rgba(126,50,133,0.08)" },
  new_application:      { icon: UserCheck, color: "#d97706", bg: "rgba(217,119,6,0.08)"  },
  application_accepted: { icon: UserCheck, color: "#16a34a", bg: "rgba(22,163,74,0.08)"  },
  application_rejected: { icon: UserX,     color: "#dc2626", bg: "rgba(220,38,38,0.08)"  },
  review_received:      { icon: Star,      color: "#d97706", bg: "rgba(217,119,6,0.08)"  },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

// ── Actions par type ───────────────────────────────────────
function getActions(
  notif: Notification,
  navigate: ReturnType<typeof useNavigate>,
  onIgnore: (id: number) => void
) {
  const { type, data, id } = notif;

  switch (type) {
    case "new_mission":
      return (
        <div className="flex gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/missions/${data.mission_id}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#7e3285" }}
          >
            Voir la mission
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/missions/${data.mission_id}/apply`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors bg-white"
          >
            Candidater
          </button>
        </div>
      );

    case "new_application":
      return (
        <div className="flex gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/missions/${data.mission_id}/applications`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#7e3285" }}
          >
            Voir la candidature
          </button>
        </div>
      );

    case "application_accepted":
      return (
        <div className="flex gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/missions/${data.mission_id}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#16a34a" }}
          >
            Voir la mission
          </button>
        </div>
      );

    case "application_rejected":
      return (
        <div className="flex gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); onIgnore(id); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors bg-white"
          >
            <X size={11} /> Ignorer
          </button>
        </div>
      );

    case "review_received":
      return (
        <div className="flex gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/missions/${data.mission_id}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#d97706" }}
          >
            Voir l'avis
          </button>
        </div>
      );

    default:
      return null;
  }
}

// ── Page ───────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<"all" | "unread">("all");

  useEffect(() => {
    getNotifications()
      .then(data => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id: number) {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  async function handleIgnore(id: number) {
    await markNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  const filtered = activeTab === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: "#7e3285" }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CheckCheck size={14} /> Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-6">
          {(["all", "unread"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="py-3 mr-6 text-sm font-medium border-b-2 transition-all"
              style={activeTab === tab
                ? { color: "#7e3285", borderColor: "#7e3285" }
                : { color: "#9ca3af", borderColor: "transparent" }
              }
            >
              {tab === "all" ? "Toutes" : "Non lues"}
              {tab === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(126,50,133,0.1)", color: "#7e3285" }}>
                  {unreadCount}
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
          <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(126,50,133,0.06)" }}>
              <Bell size={24} style={{ color: "#7e3285" }} />
            </div>
            <p className="text-gray-500 font-medium mb-1">Aucune notification</p>
            <p className="text-sm text-gray-400">
              {activeTab === "unread" ? "Vous avez tout lu." : "Vous n'avez pas encore de notifications."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filtered.map((notif, i) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.new_mission;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                    i < filtered.length - 1 ? "border-b border-gray-50" : ""
                  } ${!notif.is_read ? "bg-purple-50/30" : ""}`}
                >
                  {/* Icône */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: cfg.bg }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>

                  {/* Texte + actions */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm mb-0.5 ${!notif.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#7e3285" }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-gray-300 mt-1">{timeAgo(notif.created_at)}</p>

                    {/* Actions */}
                    {getActions(notif, navigate, handleIgnore)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}