import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Send, Search, Loader2, MessageSquare, CheckCheck, Check,
  Bell, Briefcase, UserCheck, UserX, Star, ArrowLeft,
} from "lucide-react";
import Header from "../components/header";
import { useAuth } from "../context/auth_context";
import { fetchWithAuth } from "../services/auth_api";
import {
  getChannel, getMessages, markMessageRead, createChatSocket,
  type ChatMessage, type Channel,
} from "../services/messaging_api";

// ── Types ──────────────────────────────────────────────────
interface Conversation {
  missionId:      number;
  missionTitle:   string;
  role:           "client" | "prestataire";
  partnerName:    string;
  lastMessage?:   string;
  lastMessageAt?: string;
  unreadCount:    number;
}

// ── Helpers ────────────────────────────────────────────────
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - +new Date(d)) / 1000);
  if (s < 60)    return "maintenant";
  if (s < 3600)  return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  const j = Math.floor(s / 86400);
  if (j === 1) return "hier";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function fmt(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function dayLabel(d: string) {
  const diff = Math.floor((Date.now() - +new Date(d)) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function groupByDay(msgs: ChatMessage[]) {
  const g: { date: string; msgs: ChatMessage[] }[] = [];
  for (const m of msgs) {
    const d = new Date(m.created_at).toDateString();
    if (g.at(-1)?.date === d) g.at(-1)!.msgs.push(m);
    else g.push({ date: d, msgs: [m] });
  }
  return g;
}

// ── Avatar ─────────────────────────────────────────────────
const COLORS = ["#7C3AED","#DB2777","#0891B2","#D97706","#059669","#DC2626","#7E3285","#2563EB"];
function hue(s: string) {
  let h = 0; for (const c of s) h = c.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}
function ini(s: string) {
  return s.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}
function Av({ name, size = 36, logo }: { name: string; size?: number; logo?: string | null }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white select-none"
      style={{ width: size, height: size, background: hue(name), fontSize: size * 0.37 }}
    >
      {ini(name)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SIDEBAR ITEM
// ══════════════════════════════════════════════════════════
function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
      style={{
        background: active ? "rgba(159,94,165,0.14)" : "transparent",
        borderLeft: active ? "3px solid #C084CC" : "3px solid transparent",
      }}
    >
      <div className="relative flex-shrink-0">
        <Av name={conv.partnerName} size={46} />
        <span
          className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{ background: "#22C55E", borderColor: "#1A0B1E" }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-[13.5px] truncate pr-2 font-semibold"
            style={{ color: active ? "#E9D5FF" : "rgba(255,255,255,0.88)" }}
          >
            {conv.partnerName}
          </span>
          {conv.lastMessageAt && (
            <span className="text-[11px] flex-shrink-0" style={{
              color: conv.unreadCount > 0 ? "#C084CC" : "rgba(255,255,255,0.28)"
            }}>
              {timeAgo(conv.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.32)" }}>
            {conv.lastMessage ?? conv.missionTitle}
          </p>
          {conv.unreadCount > 0 && (
            <span
              className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0"
              style={{ background: "#9F5EA5", color: "white" }}
            >
              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════
//  BUBBLE  — bulles stylisées avec gradient + ombre
//  Soi   → droite, gradient violet, texte blanc
//  Autre → gauche, blanc avec bordure subtile, texte sombre
// ══════════════════════════════════════════════════════════
function Bubble({ msg, isOwn, first, last }: {
  msg: ChatMessage; isOwn: boolean; first: boolean; last: boolean;
}) {
  // Coins enchaînés : angle pointu côté "queue" sur le dernier msg du groupe
  const ownRadius   = last ? "20px 4px 20px 20px" : "20px 20px 20px 20px";
  const otherRadius = last ? "4px 20px 20px 20px" : "20px 20px 20px 20px";

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
      style={{ marginTop: first ? "16px" : "3px" }}
    >
      <div className={`flex flex-col max-w-[85%] sm:max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}>

        {/* Bulle */}
        <div
          className="px-4 py-2.5 text-[13.5px] leading-relaxed break-words whitespace-pre-wrap"
          style={
            isOwn
              ? {
                  background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                  color: "white",
                  borderRadius: ownRadius,
                  boxShadow: "0 2px 12px rgba(109,40,217,0.3), 0 1px 3px rgba(109,40,217,0.2)",
                }
              : {
                  background: "white",
                  color: "#1F2937",
                  borderRadius: otherRadius,
                  border: "1px solid #EDE9F4",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }
          }
        >
          {msg.body}
        </div>

        {/* Heure + indicateur lu — sur chaque message envoyé */}
        <div className={`flex items-center gap-1 mt-1 px-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          {/* Heure visible uniquement sur le dernier du groupe */}
          {last && <span className="text-[11px] text-gray-400">{fmt(msg.created_at)}</span>}
          {/* ✓ / ✓✓ sur tous mes messages */}
          {isOwn && (
            msg.is_read
              ? <CheckCheck size={13} style={{ color: "#7C3AED" }} />
              : <Check size={13} className="text-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Séparateur de date ─────────────────────────────────────
function DaySep({ d }: { d: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: "rgba(100,50,120,0.12)" }} />
      <span
        className="text-[11px] text-gray-400 font-medium px-3 py-1 rounded-full"
        style={{ background: "rgba(100,50,120,0.07)" }}
      >
        {dayLabel(d)}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(100,50,120,0.12)" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  NOTIFICATIONS PANEL
// ══════════════════════════════════════════════════════════
interface Notif {
  id: number;
  type: "new_mission" | "new_application" | "application_accepted" | "application_rejected" | "review_received";
  title: string;
  message: string;
  data: { mission_id?: number };
  is_read: boolean;
  created_at: string;
}

const NOTIF_CFG = {
  new_mission:          { icon: Briefcase,  color: "#9F5EA5", bg: "rgba(159,94,165,0.15)"  },
  new_application:      { icon: UserCheck,  color: "#F59E0B", bg: "rgba(245,158,11,0.15)"  },
  application_accepted: { icon: UserCheck,  color: "#10B981", bg: "rgba(16,185,129,0.15)"  },
  application_rejected: { icon: UserX,      color: "#EF4444", bg: "rgba(239,68,68,0.15)"   },
  review_received:      { icon: Star,       color: "#F59E0B", bg: "rgba(245,158,11,0.15)"  },
} as const;

function notifTimeAgo(d: string) {
  const s = Math.floor((Date.now() - +new Date(d)) / 1000);
  if (s < 60)    return "maintenant";
  if (s < 3600)  return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} j`;
}

function NotifItem({ notif, onRead, onNavigate }: {
  notif: Notif;
  onRead: (id: number) => void;
  onNavigate: (missionId?: number) => void;
}) {
  const cfg  = NOTIF_CFG[notif.type] ?? NOTIF_CFG.new_mission;
  const Icon = cfg.icon;
  return (
    <button
      onClick={() => { onRead(notif.id); onNavigate(notif.data.mission_id); }}
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
      style={{ background: !notif.is_read ? "rgba(159,94,165,0.07)" : "transparent" }}
    >
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: cfg.bg }}>
        <Icon size={14} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <p className={`text-[12.5px] leading-tight ${!notif.is_read ? "font-semibold text-white" : "font-medium text-white/75"}`}>
            {notif.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              {notifTimeAgo(notif.created_at)}
            </span>
            {!notif.is_read && (
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: "#C084CC" }} />
            )}
          </div>
        </div>
        <p className="text-[11.5px] leading-snug line-clamp-2" style={{ color: "rgba(255,255,255,0.38)" }}>
          {notif.message}
        </p>
      </div>
    </button>
  );
}

// ── État vide ──────────────────────────────────────────────
function Empty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: "rgba(91,78,173,0.07)" }}>
        <MessageSquare size={38} style={{ color: "#9F5EA5" }} />
      </div>
      <p className="font-bold text-gray-700 text-[15px]">Messagerie Proxyo</p>
      <p className="text-sm text-gray-400 text-center max-w-[260px] leading-relaxed">
        Sélectionnez une conversation dans le panneau de gauche pour démarrer l'échange.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function MessagingPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const { missionId: paramId } = useParams<{ missionId?: string }>();

  const companyId = useMemo<number | null>(() => {
    if (user?.company_id) return user.company_id;
    try {
      const c = localStorage.getItem("company");
      if (c) return JSON.parse(c).id ?? null;
    } catch { /* ignore */ }
    return null;
  }, [user?.company_id]);

  const [sidebarTab, setSidebarTab] = useState<"messages" | "notifications">("messages");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading,   setConvLoading]   = useState(true);
  const [selectedId,    setSelectedId]    = useState<number | null>(
    paramId ? parseInt(paramId) : null
  );
  const [channel,    setChannel]    = useState<Channel | null>(null);
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputText,  setInputText]  = useState("");
  const [wsStatus,   setWsStatus]   = useState<"connecting" | "open" | "closed">("closed");
  const [search,     setSearch]     = useState("");

  const [notifs,       setNotifs]       = useState<Notif[]>([]);
  const [notifsLoading,setNotifsLoading]= useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const wsRef    = useRef<WebSocket | null>(null);
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Charger les conversations ──────────────────────────
  useEffect(() => {
    if (!companyId) return;
    async function load() {
      try {
        type C = { missionId: number; missionTitle: string; role: "client" | "prestataire"; hint: string };
        const cands: C[] = [];

        // Missions publiées (rôle client) — on cherche le nom du prestataire accepté
        const mRes = await fetchWithAuth("http://127.0.0.1:8000/api/mission/publier/");
        if (mRes.ok) {
          const raw: any[] = await mRes.json().then(d => Array.isArray(d) ? d : d.results ?? []);
          await Promise.all(
            raw.filter(m => ["in_progress", "completed"].includes(m.status)).map(async m => {
              let hint = m.title;
              try {
                const r = await fetchWithAuth(`http://127.0.0.1:8000/api/missions/${m.id}/applications/`);
                if (r.ok) {
                  const data = await r.json();
                  const apps: any[] = Array.isArray(data) ? data : data.applications ?? [];
                  const acc = apps.find((a: any) => a.status === "accepted");
                  if (acc) hint = acc.company_name ?? m.title;
                }
              } catch { /* ignore */ }
              cands.push({ missionId: m.id, missionTitle: m.title, role: "client", hint });
            })
          );
        }

        // Candidatures acceptées (rôle prestataire) — posted_by = nom de la company cliente
        const aRes = await fetchWithAuth("http://127.0.0.1:8000/api/applications/mes-candidatures/");
        if (aRes.ok) {
          const raw: any[] = await aRes.json().then(d => Array.isArray(d) ? d : d.results ?? []);
          raw
            .filter(a => a.status === "accepted")
            .forEach(a => cands.push({
              missionId:    a.mission_id,
              missionTitle: a.mission_title,
              role:         "prestataire",
              hint:         a.posted_by ?? a.mission_title,
            }));
        }

        // Charger le canal — interlocutor_name vient du backend, hint en fallback
        const settled = await Promise.allSettled(
          cands.map(async c => {
            const ch = await getChannel(c.missionId);
            return {
              missionId:     c.missionId,
              missionTitle:  c.missionTitle,
              role:          c.role,
              partnerName:   ch.interlocutor_name ?? c.hint,
              lastMessage:   ch.last_message?.body,
              lastMessageAt: ch.last_message?.created_at,
              unreadCount:   ch.unread_count ?? 0,
            } as Conversation;
          })
        );

        setConversations(
          settled
            .filter(r => r.status === "fulfilled")
            .map(r => (r as PromiseFulfilledResult<Conversation>).value)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setConvLoading(false);
      }
    }
    load();
  }, [companyId]);

  // ── Charger les messages d'une conversation ────────────
  useEffect(() => {
    if (!selectedId) return;
    setMsgLoading(true); setMessages([]); setChannel(null);
    Promise.all([getChannel(selectedId), getMessages(selectedId)])
      .then(([ch, msgs]) => {
        setChannel(ch);
        setMessages(msgs);
        // Marquer comme lus tous les messages reçus (pas les miens)
        const unread = msgs.filter(m =>
          !m.is_read && m.sender_name === conversations.find(c => c.missionId === selectedId)?.partnerName
        );
        unread.forEach(m =>
          markMessageRead(selectedId, m.id).catch(() => { /* ignore */ })
        );
        if (unread.length > 0) {
          setMessages(prev => prev.map(m =>
            unread.some(u => u.id === m.id) ? { ...m, is_read: true } : m
          ));
          setConversations(prev => prev.map(c =>
            c.missionId === selectedId ? { ...c, unreadCount: 0 } : c
          ));
        }
      })
      .catch(console.error)
      .finally(() => setMsgLoading(false));
  }, [selectedId]);

  // ── WebSocket ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    wsRef.current?.close(); wsRef.current = null;
    setWsStatus("connecting");
    const ws = createChatSocket(selectedId);
    wsRef.current = ws;
    ws.onopen  = () => setWsStatus("open");
    ws.onclose = () => setWsStatus("closed");
    ws.onerror = () => setWsStatus("closed");
    ws.onmessage = ({ data }) => {
      try {
        const d = JSON.parse(data);
        if (d.error) return;
        const msg: ChatMessage = {
          id: d.id, sender_id: d.sender_id, sender_name: d.sender_name,
          sender_logo: d.sender_logo, body: d.body, is_read: false, created_at: d.created_at,
        };
        setMessages(p => [...p, msg]);
        setConversations(p => p.map(c =>
          c.missionId === selectedId
            ? { ...c, lastMessage: d.body, lastMessageAt: d.created_at }
            : c
        ));
      } catch { /* ignore */ }
    };
    return () => { ws.close(); wsRef.current = null; };
  }, [selectedId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Charger les notifications ──────────────────────────
  useEffect(() => {
    if (sidebarTab !== "notifications") return;
    setNotifsLoading(true);
    fetchWithAuth("http://127.0.0.1:8000/api/notifications/")
      .then(r => r.json())
      .then(d => {
        setNotifs(d.notifications ?? d ?? []);
        setUnreadNotifs(d.unread_count ?? 0);
      })
      .catch(console.error)
      .finally(() => setNotifsLoading(false));
  }, [sidebarTab]);

  async function handleReadNotif(id: number) {
    await fetchWithAuth(`http://127.0.0.1:8000/api/notifications/${id}/read/`, { method: "PATCH" }).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadNotifs(prev => Math.max(0, prev - 1));
  }

  // ── Polling is_read toutes les 8 s (pour que l'expéditeur voie ✓✓) ──
  useEffect(() => {
    if (!selectedId) return;
    const id = setInterval(async () => {
      try {
        const fresh = await getMessages(selectedId);
        setMessages(prev => prev.map(m => {
          const updated = fresh.find(f => f.id === m.id);
          return updated ? { ...m, is_read: updated.is_read } : m;
        }));
      } catch { /* ignore */ }
    }, 8000);
    return () => clearInterval(id);
  }, [selectedId]);

  const sendMsg = useCallback(() => {
    const body = inputText.trim();
    if (!body || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ body }));
    setInputText(""); inputRef.current?.focus();
  }, [inputText]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  const filtered     = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(search.toLowerCase()) ||
    c.missionTitle.toLowerCase().includes(search.toLowerCase())
  );
  const selectedConv = conversations.find(c => c.missionId === selectedId);
  const groups       = groupByDay(messages);
  const totalUnread  = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const [mobileView, setMobileView] = useState<"sidebar" | "chat">(
    paramId ? "chat" : "sidebar"
  );

  const wsColor =
    wsStatus === "open"       ? "#22C55E" :
    wsStatus === "connecting" ? "#F59E0B" : "#EF4444";
  const wsLabel =
    wsStatus === "open"       ? "Connecté" :
    wsStatus === "connecting" ? "Connexion…" : "Hors ligne";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header unreadMessages={totalUnread} />

      <div className="flex flex-1 overflow-hidden">

        {/* ════════════════════════════════════════
            SIDEBAR
        ════════════════════════════════════════ */}
        <div
          className={`flex-shrink-0 flex md:w-[300px] ${mobileView === "sidebar" ? "flex w-full" : "hidden md:flex"}`}
          style={{ background: "#1A0B1E" }}
        >

          {/* Icônes de navigation (colonne gauche) */}
          <div className="w-[54px] flex-shrink-0 flex flex-col items-center pt-5 pb-4 gap-5"
            style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(159,94,165,0.25)" }}>
              <MessageSquare size={17} style={{ color: "#C084CC" }} />
            </button>
            <div className="flex-1" />
          </div>

          {/* Corps du sidebar */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Profil utilisateur */}
            <div className="px-4 pt-5 pb-4">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative">
                  <Av name={`${user?.first_name ?? "?"} ${user?.last_name ?? ""}`} size={40} />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: "#22C55E", borderColor: "#1A0B1E" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-white truncate leading-tight">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(192,132,204,0.55)" }}>
                    En ligne
                  </p>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.2)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-[12.5px] outline-none text-white placeholder-white/20"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              </div>
            </div>

            {/* ── Tabs Messages / Notifications ── */}
            <div className="px-3 pb-3">
              <div className="flex rounded-xl p-0.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                <button
                  onClick={() => setSidebarTab("messages")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={sidebarTab === "messages"
                    ? { background: "#7E3285", color: "white" }
                    : { color: "rgba(255,255,255,0.38)" }}
                >
                  <MessageSquare size={13} />
                  Messages
                  {totalUnread > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: sidebarTab === "messages" ? "rgba(255,255,255,0.25)" : "#9F5EA5", color: "white" }}>
                      {totalUnread}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSidebarTab("notifications")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={sidebarTab === "notifications"
                    ? { background: "#7E3285", color: "white" }
                    : { color: "rgba(255,255,255,0.38)" }}
                >
                  <Bell size={13} />
                  Notifs
                  {unreadNotifs > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: sidebarTab === "notifications" ? "rgba(255,255,255,0.25)" : "#9F5EA5", color: "white" }}>
                      {unreadNotifs}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ── Contenu selon l'onglet ── */}
            <div className="flex-1 overflow-y-auto">

            {sidebarTab === "notifications" ? (
              notifsLoading ? (
                <div className="flex justify-center pt-14">
                  <Loader2 size={20} className="animate-spin" style={{ color: "#9F5EA5" }} />
                </div>
              ) : notifs.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <Bell size={28} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>Aucune notification</p>
                </div>
              ) : (
                notifs.map(n => (
                  <NotifItem
                    key={n.id}
                    notif={n}
                    onRead={handleReadNotif}
                    onNavigate={mId => mId && navigate(`/missions/${mId}`)}
                  />
                ))
              )
            ) : (
              /* ── Liste des conversations ── */
              convLoading ? (
                <div className="flex justify-center pt-14">
                  <Loader2 size={22} className="animate-spin" style={{ color: "#9F5EA5" }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <MessageSquare size={30} className="mx-auto mb-3"
                    style={{ color: "rgba(255,255,255,0.08)" }} />
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Aucune conversation
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.1)" }}>
                    Apparaît quand une mission est en cours
                  </p>
                </div>
              ) : (
                filtered.map(conv => (
                  <ConvItem
                    key={`${conv.missionId}-${conv.role}`}
                    conv={conv}
                    active={selectedId === conv.missionId}
                    onClick={() => {
                      setSelectedId(conv.missionId);
                      navigate(`/messages/${conv.missionId}`);
                      setMobileView("chat");
                    }}
                  />
                ))
              )
            )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            ZONE DE CHAT
        ════════════════════════════════════════ */}
        <div
          className={`flex-col overflow-hidden flex-1 ${mobileView === "chat" ? "flex" : "hidden md:flex"}`}
          style={{ background: "#EEF0F8" }}
        >
          {!selectedId ? <Empty /> : (
            <>
              {/* ── Header ── */}
              <div
                className="flex items-center justify-between px-3 sm:px-6 py-3 flex-shrink-0 bg-white"
                style={{ borderBottom: "1px solid #E8E2F0" }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileView("sidebar")}
                    className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <Av name={selectedConv?.partnerName ?? "?"} size={44} />
                  <div>
                    <p className="font-bold text-[15px] text-gray-900 leading-tight">
                      {selectedConv?.partnerName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[12px] text-gray-400 truncate max-w-[220px]">
                        {selectedConv?.missionTitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Statut WS */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                    style={{ background: "#F5F0FB", color: "#7E5BAD" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: wsColor }} />
                    {wsLabel}
                  </div>

                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
                {msgLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 size={28} className="animate-spin" style={{ color: "#9F5EA5" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(91,78,173,0.07)" }}>
                      <MessageSquare size={26} style={{ color: "#9F5EA5" }} />
                    </div>
                    <p className="text-gray-500 font-semibold text-sm">Aucun message</p>
                    <p className="text-xs text-gray-400">
                      Envoyez le premier message à {selectedConv?.partnerName} !
                    </p>
                  </div>
                ) : (
                  <>
                    {groups.map(group => (
                      <div key={group.date}>
                        <DaySep d={group.msgs[0].created_at} />
                        {group.msgs.map((msg, idx) => {
                          const prev  = group.msgs[idx - 1];
                          const next  = group.msgs[idx + 1];
                          const first = !prev || prev.sender_name !== msg.sender_name;
                          const last  = !next || next.sender_name !== msg.sender_name;
                          // isOwn : le message vient de moi si ce n'est pas le partenaire
                          const isOwn = msg.sender_name !== selectedConv?.partnerName;
                          return (
                            <Bubble
                              key={msg.id}
                              msg={msg}
                              isOwn={isOwn}
                              first={first}
                              last={last}
                            />
                          );
                        })}
                      </div>
                    ))}
                    <div ref={endRef} />
                  </>
                )}
              </div>

              {/* ── Zone de saisie ── */}
              {channel?.is_closed ? (
                <div
                  className="px-6 py-4 text-center bg-white flex-shrink-0"
                  style={{ borderTop: "1px solid #E8E2F0" }}
                >
                  <p className="text-sm text-gray-400 font-medium">Canal fermé — mission terminée</p>
                </div>
              ) : (
                <div
                  className="px-5 py-3.5 bg-white flex-shrink-0"
                  style={{ borderTop: "1px solid #E8E2F0" }}
                >
                  <div
                    className="flex items-end gap-3 rounded-2xl px-4 py-2.5"
                    style={{ background: "#F7F4FC", border: "1.5px solid #DDD5EA" }}
                  >
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={onKey}
                      placeholder={`Message à ${selectedConv?.partnerName ?? "…"}`}
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-[13.5px] text-gray-800 outline-none placeholder-gray-400 py-0.5"
                      style={{ maxHeight: "130px" }}
                    />
                    <button
                      onClick={sendMsg}
                      disabled={!inputText.trim() || wsStatus !== "open"}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all mb-0.5"
                      style={{
                        background: inputText.trim() && wsStatus === "open" ? "#5B4EAD" : "#E5DFF0",
                        color:      inputText.trim() && wsStatus === "open" ? "white"   : "#9CA3AF",
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  <p className="hidden sm:block text-[11px] text-gray-400 mt-1.5 text-center">
                    <kbd className="px-1.5 py-0.5 rounded font-mono text-[11px]"
                      style={{ background: "#EDE8F5", color: "#5B4EAD" }}>↵</kbd>{" "}envoyer ·{" "}
                    <kbd className="px-1.5 py-0.5 rounded font-mono text-[11px]"
                      style={{ background: "#EDE8F5", color: "#5B4EAD" }}>⇧↵</kbd>{" "}nouvelle ligne
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
