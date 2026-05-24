import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronRight } from "lucide-react";
import Header from "../components/header";
import Footer from "../components/footer";
import { getSectorBySlug } from "../data/sectors_data";

export default function SectorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const sector    = getSectorBySlug(slug ?? "");

  useEffect(() => {
    if (!sector) { navigate("/", { replace: true }); return; }
    document.title = sector.metaTitle;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = sector.metaDescription;
  }, [sector, navigate]);

  if (!sector) return null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      {/* ── BREADCRUMB ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-600 transition-colors">Accueil</Link>
          <ChevronRight size={12} />
          <Link to="/secteurs" className="hover:text-gray-600 transition-colors">Secteurs</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600 font-medium">{sector.title}</span>
        </nav>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={sector.image}
            alt={sector.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-block bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              Secteur · {sector.title}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              {sector.headline}
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              {sector.intro}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ background: "#7E3285" }}
              >
                Publier une mission <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate("/companies")}
                className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Voir les entreprises
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Prestations disponibles en {sector.title}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Des entreprises spécialisées prêtes à répondre à vos besoins dans ce secteur.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sector.services.map((service, i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white text-sm font-bold"
                  style={{ background: "#7E3285" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{service.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES PROXYO ── */}
      <section className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Pourquoi passer par Proxyo pour votre{" "}
                <span style={{ color: "#7E3285" }}>{sector.title}</span> ?
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Proxyo simplifie la mise en relation B2B. Plus besoin de chercher des heures — les bons prestataires viennent à vous.
              </p>
              <ul className="space-y-3">
                {sector.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#7E3285" }} />
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth")}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ background: "#7E3285" }}
              >
                Publier gratuitement <ArrowRight size={16} />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: "< 24h",   label: "Temps de réponse moyen" },
                { number: "100%",    label: "Prestataires vérifiés" },
                { number: "Gratuit", label: "Publication de mission" },
                { number: "Local",   label: "Prestataires dans votre département" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm"
                >
                  <div className="text-2xl font-black mb-1" style={{ color: "#7E3285" }}>
                    {stat.number}
                  </div>
                  <div className="text-xs text-gray-500 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {sector.faq.length > 0 && (
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {sector.faq.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{item.question}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="rounded-3xl p-10 text-white"
            style={{ background: "#7E3285" }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Trouvez votre prestataire {sector.title} maintenant
            </h2>
            <p className="text-white/80 mb-7 text-sm leading-relaxed max-w-lg mx-auto">
              Publiez votre mission gratuitement et recevez des devis de professionnels qualifiés sous 24h.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 bg-white font-bold text-sm px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-md"
              style={{ color: "#7E3285" }}
            >
              Démarrer gratuitement <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
