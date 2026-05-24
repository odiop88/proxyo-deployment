import { useRef, useState, useEffect, useCallback } from "react";
import { MapPin, Mail, Phone, Briefcase, Building2, Shield, Camera, Pencil, Check, X, Star, ImagePlus, Trash2, ChevronRight } from "lucide-react";
import Header from "../components/header";
import { useAuth } from "../context/auth_context";
import { fetchWithAuth } from "../services/auth_api";

const API_URL = "http://127.0.0.1:8000/api/";

// ── Types ──────────────────────────────────────────────────
interface CompanyInfo {
  id: number;
  name: string;
  siret: string;
  sector: string;
  city: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",     color: "#16a34a", bg: "#f0fdf4" },
  pending:   { label: "En attente", color: "#d97706", bg: "#fffbea" },
  inactive:  { label: "Inactive",   color: "#6b7280", bg: "#f9fafb" },
  suspended: { label: "Suspendue",  color: "#dc2626", bg: "#fef2f2" },
};

// ── Inline editable field ──────────────────────────────────
function InlineEdit({
  value, onSave, placeholder = "—", multiline = false, className = ""
}: {
  value: string; onSave: (v: string) => void;
  placeholder?: string; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  function save() { onSave(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        {multiline ? (
          <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} rows={3}
            className="border-b border-purple-400 bg-transparent text-sm outline-none resize-none w-full" />
        ) : (
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            className={`border-b border-purple-400 bg-transparent text-sm outline-none ${className}`} />
        )}
        <button onClick={save} className="text-green-500 hover:text-green-600"><Check size={13} /></button>
        <button onClick={cancel} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
      </span>
    );
  }

  return (
    <span className="group inline-flex items-center gap-1.5 cursor-text"
      onClick={() => { setDraft(value); setEditing(true); }}>
      <span className={value ? className : `text-gray-300 italic text-sm ${className}`}>
        {value || placeholder}
      </span>
      <Pencil size={11} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}

// ── Upload image helper ────────────────────────────────────
function useImageUpload(endpoint: string, field: string, lsKey?: string) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl]             = useState<string | null>(
    lsKey ? localStorage.getItem(lsKey) : null
  );

  const saveUrl = useCallback((u: string | null) => {
    setUrl(u);
    if (lsKey) {
      if (u) localStorage.setItem(lsKey, u);
      else    localStorage.removeItem(lsKey);
    }
  }, [lsKey]);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append(field, file);
    try {
      const res = await fetchWithAuth(`${API_URL}${endpoint}`, { method: "PATCH", body: form });
      const data = await res.json();
      saveUrl(data[`${field}_url`] || data[field] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }, [endpoint, field, saveUrl]);

  const remove = useCallback(async () => {
    setUploading(true);
    try {
      await fetchWithAuth(`${API_URL}${endpoint}`, { method: "DELETE" });
      saveUrl(null);
    } finally {
      setUploading(false);
    }
  }, [endpoint, saveUrl]);

  return { url, setUrl: saveUrl, uploading, upload, remove };
}

// ── Zone d'upload cliquable ────────────────────────────────
function UploadZone({
  currentUrl,
  uploading,
  onUpload,
  onRemove,
  shape = "square",
  label,
  children,
}: {
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (f: File) => void;
  onRemove: () => void;
  shape?: "square" | "circle" | "banner";
  label: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const sizeClass = shape === "banner"
    ? "w-full h-full"
    : shape === "circle"
    ? "w-24 h-24 rounded-full"
    : "w-full aspect-square rounded-2xl max-h-[200px]";

  return (
    <div className={`relative group ${shape !== "banner" ? sizeClass : "w-full h-full"}`}>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); e.target.value = ""; }} />

      {/* Aperçu ou fallback */}
      {currentUrl ? (
        <img src={currentUrl} alt={label}
          className={`object-cover ${shape === "banner" ? "w-full h-full" : sizeClass}`} />
      ) : children}

      {/* Overlay au hover */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
          ${shape === "circle" ? "rounded-full" : shape === "banner" ? "" : "rounded-2xl"}
          ${uploading ? "bg-black/40" : "bg-black/0 group-hover:bg-black/40"}`}
        onClick={() => ref.current?.click()}
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
            <Camera size={20} className="text-white drop-shadow" />
            <span className="text-white text-xs font-semibold drop-shadow">{label}</span>
          </div>
        )}
      </div>

      {/* Bouton supprimer si image présente */}
      {currentUrl && !uploading && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function ProfilPage() {
  const { user } = useAuth();

  const storedCompany = localStorage.getItem("company");
  const company: CompanyInfo | null = storedCompany ? JSON.parse(storedCompany) : null;
  const cfg = company ? (STATUS_CONFIG[company.status] || STATUS_CONFIG.pending) : STATUS_CONFIG.pending;

  const [activeTab, setActiveTab] = useState<"company" | "media">("company");

  const [profile, setProfile] = useState({
    first_name: user?.first_name || "",
    last_name:  user?.last_name  || "",
    email:      user?.email      || "",
    tel:        "",
    job_title:  "",
    bio:        "",
    city:       company?.city || "",
  });

  const set = (field: keyof typeof profile) => (val: string) =>
    setProfile(prev => ({ ...prev, [field]: val }));

  async function saveProfile() {
    try {
      await fetchWithAuth(`${API_URL}profile/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name:  profile.last_name,
          tel:        profile.tel,
          job_title:  profile.job_title,
          bio:        profile.bio,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  const initials = `${profile.first_name[0] || "?"}${profile.last_name[0] || ""}`.toUpperCase();

  // Uploads
  const avatar  = useImageUpload("profile/avatar/", "avatar", "avatar_url");
  const logo    = useImageUpload("company/logo/",   "logo");
  const banner  = useImageUpload("company/banner/", "banner");

  const companyId = company?.id;

  const setAvatarUrl = avatar.setUrl;
  const setLogoUrl   = logo.setUrl;
  const setBannerUrl = banner.setUrl;

  // Charger les données existantes au montage
  useEffect(() => {
    fetchWithAuth(`${API_URL}profile/`).then(r => r.json()).then(data => {
      const avatarUrl = data.avatar ? `http://127.0.0.1:8000${data.avatar}` : null;
      if (avatarUrl) {
        localStorage.setItem("avatar_url", avatarUrl);
        setAvatarUrl(avatarUrl);
      }
      setProfile(prev => ({
        ...prev,
        first_name: data.first_name || prev.first_name,
        last_name:  data.last_name  || prev.last_name,
        email:      data.email      || prev.email,
        tel:        data.tel        || "",
        job_title:  data.job_title  || "",
        bio:        data.bio        || "",
      }));
    }).catch(() => {});

    if (companyId) {
      fetch(`${API_URL}companies/${companyId}/`).then(r => r.json()).then(data => {
        if (data.logo_url)   setLogoUrl(data.logo_url);
        if (data.banner_url) setBannerUrl(data.banner_url);
      }).catch(() => {});
    }
  }, [companyId, setAvatarUrl, setLogoUrl, setBannerUrl]);

  return (
    <div className="min-h-screen" style={{ background: "#f6f3fb", fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">

        {/* ── CARTE IDENTITÉ ── */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(126,50,133,0.06)" }}>

          {/* Bannière */}
          <div className="relative h-44 overflow-hidden">
            <UploadZone currentUrl={banner.url} uploading={banner.uploading}
              onUpload={banner.upload} onRemove={banner.remove}
              shape="banner" label="Modifier la bannière">
              <div className="w-full h-full relative" style={{ background: "linear-gradient(135deg, #c084d0 0%, #7e3285 55%, #4a1260 100%)" }}>
                <div className="absolute inset-0 opacity-[0.07]"
                  style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }} />
              </div>
            </UploadZone>
          </div>

          {/* Identité */}
          <div className="px-8 pb-7">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

              {/* Avatar + nom */}
              <div className="flex items-end gap-5 -mt-14">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0 bg-gray-100">
                  <UploadZone currentUrl={avatar.url} uploading={avatar.uploading}
                    onUpload={avatar.upload} onRemove={avatar.remove}
                    shape="circle" label="Modifier">
                    <div className="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold"
                      style={{ background: "linear-gradient(135deg, #7e3285, #6b1fa8)" }}>
                      {initials}
                    </div>
                  </UploadZone>
                </div>

                <div className="mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    <InlineEdit value={profile.first_name} onSave={set("first_name")} placeholder="Prénom" className="font-bold text-2xl text-gray-900" />
                    {" "}
                    <InlineEdit value={profile.last_name} onSave={set("last_name")} placeholder="Nom" className="font-bold text-2xl text-gray-900" />
                  </h1>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "#7e3285" }}>
                    <InlineEdit value={profile.job_title} onSave={set("job_title")} placeholder="Poste / Titre" />
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
                    <MapPin size={12} />
                    <InlineEdit value={profile.city} onSave={set("city")} placeholder="Ville" className="text-sm text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Badges + bouton sauvegarde */}
              <div className="flex flex-col items-start md:items-end gap-3 pb-1">
                <div className="flex flex-wrap gap-2">
                  {company && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(126,50,133,0.08)", color: "#7e3285" }}>
                      <Building2 size={11} /> {company.name}
                    </span>
                  )}
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                    {user?.role === "owner" ? "Propriétaire" : "Employé"}
                  </span>
                  {company && (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  )}
                </div>
                <button onClick={saveProfile}
                  className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ background: "#7e3285" }}>
                  Sauvegarder
                </button>
              </div>
            </div>

            {/* Étoiles */}
            <div className="flex items-center gap-2 mt-5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} fill={i < 4 ? "#f59e0b" : "#e5e7eb"} className={i < 4 ? "text-yellow-400" : "text-gray-200"} />
              ))}
              <span className="text-xs text-gray-400 ml-1">Évaluations à venir</span>
            </div>
          </div>
        </div>

        {/* ── CORPS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Sidebar gauche */}
          <div className="space-y-4">

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Contact</p>
              <div className="space-y-3">
                {([
                  { icon: Mail,  label: "Email",     field: "email" as const, placeholder: "votre@email.fr"    },
                  { icon: Phone, label: "Téléphone", field: "tel"   as const, placeholder: "+33 6 00 00 00 00" },
                ] as const).map(item => (
                  <div key={item.field} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(126,50,133,0.08)" }}>
                      <item.icon size={12} style={{ color: "#7e3285" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 mb-0.5">{item.label}</p>
                      <span className="text-sm font-medium" style={{ color: "#7e3285" }}>
                        <InlineEdit value={profile[item.field]} onSave={set(item.field)} placeholder={item.placeholder} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entreprise */}
            {company && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Entreprise</p>
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: "Nom",     value: company.name   },
                    { icon: MapPin,    label: "Ville",   value: company.city   },
                    { icon: Briefcase, label: "Secteur", value: company.sector },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(126,50,133,0.08)" }}>
                        <item.icon size={12} style={{ color: "#7e3285" }} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">{item.label}</p>
                        <p className="text-sm font-medium text-gray-800">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sécurité */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Sécurité</p>
              <div className="space-y-1">
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Modifier le mot de passe <ChevronRight size={14} className="text-gray-300" />
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors">
                  Supprimer le compte <ChevronRight size={14} className="text-red-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-4">

            {/* Bio */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">À propos</p>
              <div className="text-sm text-gray-600 leading-relaxed">
                <InlineEdit value={profile.bio} onSave={set("bio")}
                  placeholder="Décrivez votre activité en quelques mots..."
                  multiline className="text-sm text-gray-600 leading-relaxed w-full" />
              </div>
            </div>

            {/* Tabs Entreprise + Médias */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex border-b border-gray-100 px-6">
                {(["company", "media"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
                    className="py-4 mr-6 text-sm font-medium border-b-2 transition-all"
                    style={activeTab === tab
                      ? { color: "#7e3285", borderColor: "#7e3285" }
                      : { color: "#9ca3af", borderColor: "transparent" }}>
                    {tab === "company" ? "Entreprise" : "Médias"}
                  </button>
                ))}
              </div>

              <div className="p-6">

                {/* TAB ENTREPRISE */}
                {activeTab === "company" && company && (
                  <div>
                    <div className="space-y-4 mb-6">
                      {[
                        { icon: Building2, label: "Nom",     value: company.name   },
                        { icon: Shield,    label: "SIRET",   value: company.siret  },
                        { icon: MapPin,    label: "Ville",   value: company.city   },
                        { icon: Briefcase, label: "Secteur", value: company.sector },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-4">
                          <span className="text-sm text-gray-400 w-28 flex-shrink-0 flex items-center gap-2">
                            <item.icon size={13} /> {item.label}
                          </span>
                          <span className="text-sm font-medium text-gray-800">{item.value}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400 w-28 flex-shrink-0">Statut</span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Shield size={11} /> Les informations sont gérées par l'équipe Proxyo après vérification du SIRET.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB MÉDIAS */}
                {activeTab === "media" && (
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <ImagePlus size={11} /> Bannière
                      </p>
                      <p className="text-xs text-gray-400 mb-3">Page publique de l'entreprise · 1200×300px recommandé</p>
                      <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors bg-gray-50">
                        <UploadZone currentUrl={banner.url} uploading={banner.uploading}
                          onUpload={banner.upload} onRemove={banner.remove}
                          shape="banner" label="Changer">
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                            <ImagePlus size={22} className="text-gray-300" />
                            <span className="text-sm text-gray-400">Cliquer pour ajouter</span>
                          </div>
                        </UploadZone>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Building2 size={11} /> Logo entreprise
                      </p>
                      <p className="text-xs text-gray-400 mb-3">Affiché dans les résultats de recherche · 400×400px</p>
                      <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors bg-gray-50">
                        <UploadZone currentUrl={logo.url} uploading={logo.uploading}
                          onUpload={logo.upload} onRemove={logo.remove}
                          shape="square" label="Changer">
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer">
                            <Building2 size={22} className="text-gray-300" />
                            <span className="text-xs text-gray-400">Logo</span>
                          </div>
                        </UploadZone>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Camera size={11} /> Photo de profil
                      </p>
                      <p className="text-xs text-gray-400 mb-3">Visible dans les messages et candidatures</p>
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors bg-gray-50">
                        <UploadZone currentUrl={avatar.url} uploading={avatar.uploading}
                          onUpload={avatar.upload} onRemove={avatar.remove}
                          shape="circle" label="Changer">
                          <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xl font-bold"
                            style={{ background: "linear-gradient(135deg, #7e3285, #6b1fa8)" }}>
                            {initials}
                          </div>
                        </UploadZone>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
