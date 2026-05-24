import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, MapPin, Briefcase, Building2,
  SlidersHorizontal, X, Star, ChevronLeft, ChevronRight,
} from "lucide-react";
import Header from "../components/header";

const API_URL = "http://127.0.0.1:8000/api/";
const PAGE_SIZE = 9;

interface Company {
  id: number;
  name: string;
  sector: string;
  sector_label: string;
  city: string;
  postal_code: string;
  country: string;
  description: string | null;
  logo_url: string | null;
  missions_count: number;
  created_at: string;
}

const SECTORS = [
  { value: "",             label: "Tous les secteurs" },
  { value: "it",           label: "Informatique / IT" },
  { value: "secretariat",  label: "Secrétariat" },
  { value: "photographie", label: "Photographie" },
  { value: "jardinage",    label: "Jardinage" },
  { value: "manutention",  label: "Manutention" },
  { value: "securite",     label: "Sécurité" },
  { value: "restauration", label: "Restauration" },
  { value: "nettoyage",    label: "Nettoyage / Ménage" },
  { value: "autre",        label: "Autre" },
];

function daysAgoLabel(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `${days} jours`;
}

function CompanyCard({ company, onClick }: { company: Company; onClick: () => void }) {
  const initials = company.name.slice(0, 2).toUpperCase();

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-300 group border border-gray-100 flex flex-col"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      {/* ── Photo / Banner ── */}
      <div className="relative h-44 overflow-hidden cursor-pointer" onClick={onClick}>
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d8b4dd 0%, #9b4daa 100%)" }}
          >
            <span className="text-5xl font-bold text-white/50 select-none">{initials}</span>
          </div>
        )}

        {/* Badge date */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-lg shadow-sm">
          {daysAgoLabel(company.created_at)}
        </div>

        {/* Badge secteur */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-sm">
          <Briefcase size={11} style={{ color: "#7e3285" }} />
          <span className="text-xs font-medium" style={{ color: "#7e3285" }}>{company.sector_label}</span>
        </div>
      </div>

      {/* ── Infos ── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Nom + missions */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3
            onClick={onClick}
            className="font-bold text-gray-900 text-sm leading-snug hover:text-purple-700 transition-colors line-clamp-1 cursor-pointer"
          >
            {company.name}
          </h3>
          {company.missions_count > 0 && (
            <span className="text-xs font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1 text-green-600">
              <Star size={10} fill="currentColor" />
              {company.missions_count} mission{company.missions_count > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Localisation */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin size={11} className="flex-shrink-0" />
          <span>{company.city}{company.postal_code ? `, ${company.postal_code}` : ""}</span>
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
            {company.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bouton consulter */}
        <button
          onClick={onClick}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:text-white hover:shadow-md"
          style={{ borderColor: "#7e3285", color: "#7e3285" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#7e3285"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          Consulter le profil
        </button>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [search,     setSearch]     = useState(searchParams.get("search")      || "");
  const [city,       setCity]       = useState(searchParams.get("city")        || "");
  const [postalCode, setPostalCode] = useState(searchParams.get("postal_code") || "");
  const [sector,     setSector]     = useState(searchParams.get("sector")      || "");

  const fetchCompanies = useCallback(() => {
    setLoading(true);
    setPage(1);
    const params = new URLSearchParams();
    if (search)     params.set("search",      search);
    if (city)       params.set("city",        city);
    if (postalCode) params.set("postal_code", postalCode);
    if (sector)     params.set("sector",      sector);
    setSearchParams(params);

    fetch(`${API_URL}companies/?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const results = Array.isArray(data) ? data : data.results || [];
        setCompanies(results);
        setTotal(Array.isArray(data) ? results.length : data.count || results.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, city, postalCode, sector]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  function handleReset() {
    setSearch(""); setCity(""); setPostalCode(""); setSector("");
  }

  const hasFilters = search || city || postalCode || sector;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paginated  = companies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      {/* ── Hero ── */}
      <div className="py-12 sm:py-16 px-4 text-center" style={{ background: "linear-gradient(135deg, #7e3285 0%, #5b1e61 100%)" }}>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3">
          Trouvez l'entreprise idéale
        </h1>
        <p className="text-purple-200 text-sm sm:text-base mb-8 max-w-xl mx-auto">
          Parcourez notre réseau d'entreprises et trouvez le partenaire qu'il vous faut.
        </p>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-lg">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchCompanies()}
              placeholder="Rechercher une entreprise, une ville..."
              className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
                <X size={15} />
              </button>
            )}
            <button
              onClick={fetchCompanies}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ background: "#7e3285" }}
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Barre résultats + filtres ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{total}</span> entreprise{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
            </p>
            {hasFilters && (
              <button onClick={handleReset} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                <X size={11} /> Réinitialiser
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={showFilters
              ? { background: "rgba(126,50,133,0.08)", borderColor: "#7e3285", color: "#7e3285" }
              : { background: "white", borderColor: "#e5e7eb", color: "#6b7280" }}
          >
            <SlidersHorizontal size={14} /> Filtres
            {hasFilters && (
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-bold" style={{ background: "#7e3285" }}>
                {[city, postalCode, sector].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* ── Panneau filtres ── */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1.5">
                <MapPin size={11} /> Ville
              </label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="Ex : Lyon, Paris..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Code postal</label>
              <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)}
                placeholder="Ex : 69000" maxLength={5}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1.5">
                <Briefcase size={11} /> Secteur
              </label>
              <select value={sector} onChange={e => setSector(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white">
                {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-3">
              <button onClick={handleReset}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-gray-300 bg-white transition-all">
                Réinitialiser
              </button>
              <button onClick={() => { fetchCompanies(); setShowFilters(false); }}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: "#7e3285" }}>
                Appliquer
              </button>
            </div>
          </div>
        )}

        {/* ── Grille ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(126,50,133,0.06)" }}>
              <Building2 size={28} style={{ color: "#7e3285" }} />
            </div>
            <p className="text-gray-500 font-medium mb-1">Aucune entreprise trouvée</p>
            <p className="text-sm text-gray-400">Essayez d'autres critères de recherche.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map(c => (
                <CompanyCard
                  key={c.id}
                  company={c}
                  onClick={() => navigate(`/companies/${c.id}`)}
                />
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-purple-300 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all"
                    style={p === page
                      ? { background: "#7e3285", color: "white", border: "2px solid #7e3285" }
                      : { background: "white", color: "#6b7280", border: "1px solid #e5e7eb" }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-purple-300 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
