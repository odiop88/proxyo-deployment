import {
  Search, Shield, MessageSquare, Star, ArrowRight,
  CheckCircle, ChevronDown, Zap,
  Users, TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';

const SECTOR_CHOICES = [
  { value: '',             label: 'Tous les secteurs' },
  { value: 'it',           label: 'IT / Informatique' },
  { value: 'secretariat',  label: 'Secrétariat' },
  { value: 'photographie', label: 'Photographie' },
  { value: 'jardinage',    label: 'Jardinage' },
  { value: 'manutention',  label: 'Manutention' },
  { value: 'securite',     label: 'Sécurité' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'nettoyage',    label: 'Nettoyage' },
  { value: 'autre',        label: 'Autre' },
];

const STATS = [
  { number: '10 000+', label: 'Entreprises actives' },
  { number: '50 000+', label: 'Missions réalisées' },
  { number: '4.8 / 5', label: 'Note moyenne' },
  { number: '< 24h',   label: 'Temps de réponse' },
];

const SECTORS = [
  {
    slug: 'it',
    image: '/images/sectors/it.png',
    title: 'IT / Informatique',
    description: 'Développement web & mobile, cybersécurité, infrastructure cloud, support technique.',
    features: ['Développement web & mobile', 'Cybersécurité', 'Cloud & infrastructure'],
  },
  {
    slug: 'secretariat',
    image: '/images/sectors/secretariat.png',
    title: 'Secrétariat / Assistanat',
    description: 'Gestion administrative, assistanat de direction, accueil et gestion de plannings.',
    features: ['Assistanat de direction', 'Gestion administrative', 'Accueil & planning'],
  },
  {
    slug: 'photographie',
    image: '/images/sectors/photography.png',
    title: 'Photographie / Vidéo',
    description: 'Reportages événementiels, vidéos corporate, shooting produits, montage.',
    features: ['Reportage événementiel', 'Vidéo corporate', 'Shooting produits'],
  },
  {
    slug: 'jardinage',
    image: '/images/sectors/garden.png',
    title: 'Jardinage',
    description: "Entretien d'espaces verts, taille, création de jardins, arrosage automatique.",
    features: ['Entretien espaces verts', 'Taille & élagage', 'Création de jardins'],
  },
  {
    slug: 'securite',
    image: '/images/sectors/guard.png',
    title: 'Sécurité / Gardiennage',
    description: "Surveillance, contrôle d'accès, gardiennage d'événements et de sites.",
    features: ['Gardiennage de site', "Contrôle d'accès", 'Événementiel'],
  },
  {
    slug: 'restauration',
    image: '/images/sectors/cooking.png',
    title: 'Restauration',
    description: 'Traiteurs, chefs à domicile, service en salle pour événements professionnels.',
    features: ['Traiteur événementiel', 'Chef à domicile', 'Service en salle'],
  },
  {
    slug: 'nettoyage',
    image: '/images/sectors/nettoyage.png',
    title: 'Nettoyage / Ménage',
    description: 'Nettoyage de locaux, remise en état, vitrerie et désinfection professionnelle.',
    features: ['Nettoyage de bureaux', 'Vitrerie', 'Remise en état'],
  },
  {
    slug: 'manutention',
    image: '/images/sectors/manutention.png',
    title: 'Manutention / Déménagement',
    description: "Transport de marchandises, déménagement d'entreprise, logistique événementielle.",
    features: ['Déménagement pro', 'Transport marchandises', 'Logistique événementielle'],
  },
  {
    slug: 'autre',
    image: '/images/sectors/depannage.png',
    title: 'Dépannage / Maintenance',
    description: 'Électricité, plomberie, climatisation, maintenance préventive et curative.',
    features: ['Électricité', 'Plomberie', 'Climatisation'],
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Publiez votre mission',
    description: 'Décrivez votre besoin, sélectionnez le secteur, votre ville et votre budget estimé.',
    icon: <TrendingUp size={28} className="text-eminence" />,
  },
  {
    step: '02',
    title: 'Recevez des candidatures',
    description: 'Les entreprises de votre secteur et département reçoivent une alerte et envoient leur devis.',
    icon: <Users size={28} className="text-eminence" />,
  },
  {
    step: '03',
    title: 'Choisissez et collaborez',
    description: 'Comparez les offres, acceptez la meilleure et échangez directement via la messagerie intégrée.',
    icon: <CheckCircle size={28} className="text-eminence" />,
  },
];

const FEATURES = [
  {
    icon: <Shield size={22} className="text-eminence" />,
    title: 'Entreprises vérifiées',
    description: "SIRET, statut légal et avis clients contrôlés. Vous ne traitez qu'avec des pros sérieux.",
  },
  {
    icon: <Star size={22} className="text-eminence" />,
    title: 'Notifications ciblées',
    description: 'Seules les entreprises du bon secteur et du bon département sont notifiées.',
  },
  {
    icon: <MessageSquare size={22} className="text-eminence" />,
    title: 'Messagerie intégrée',
    description: 'Échangez et négociez sans quitter la plateforme, zéro intermédiaire.',
  },
  {
    icon: <Zap size={22} className="text-eminence" />,
    title: 'Réponse rapide',
    description: 'Les prestataires répondent en moins de 24h en moyenne.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Isabelle Moreau',
    role: 'Directrice — CleanPro Services',
    content: 'En 48h nous avions 5 candidatures sérieuses pour notre mission de nettoyage. La qualité des prestataires est vraiment au rendez-vous.',
    rating: 5,
    // Remplacez par : avatar: '/images/testimonials/isabelle.jpg'
    avatar: null,
  },
  {
    name: 'Karim Benali',
    role: 'CEO — DevAgency',
    content: "Proxyo nous a permis de trouver deux clients B2B solides en moins d'une semaine. Les notifications ciblées par secteur font vraiment la différence.",
    rating: 5,
    avatar: null,
  },
  {
    name: 'Sophie Laurent',
    role: 'Responsable événements — CorpEvent',
    content: "Interface claire, prestataires sérieux. J'ai trouvé un photographe et un traiteur en un seul endroit pour notre séminaire annuel.",
    rating: 5,
    avatar: null,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [sector, setSector] = useState('');
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-white pt-10 pb-14 sm:pt-16 sm:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Gauche */}
            <div>
              <span className="inline-flex items-center gap-2 bg-lavender bg-opacity-30 text-eminence text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-lavender">
                <span className="w-2 h-2 rounded-full bg-eminence inline-block" />
                Plateforme B2B · Missions professionnelles
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                Développez votre activité avec des{' '}
                <span className="text-eminence">missions ciblées</span>
              </h1>

              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-6 sm:mb-10 max-w-lg">
                Proxyo met en relation les entreprises qui ont des besoins avec celles qui ont les compétences — par secteur, par département, en temps réel.
              </p>

              {/* Barre de recherche */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-2 flex flex-col sm:flex-row gap-2 mb-8">
                <div className="flex-1 flex items-center px-4 gap-3 bg-gray-50 rounded-xl">
                  <Search className="text-gray-400 flex-shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder="Chercher une mission, un secteur..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full py-3 text-sm text-gray-800 outline-none placeholder-gray-400 bg-transparent"
                  />
                </div>
                <div className="relative flex items-center bg-gray-50 rounded-xl px-3">
                  <select
                    value={sector}
                    onChange={e => setSector(e.target.value)}
                    className="appearance-none bg-transparent text-sm text-gray-600 pr-6 pl-1 outline-none cursor-pointer py-3 min-w-[140px]"
                  >
                    {SECTOR_CHOICES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
                </div>
                <button
                  className="px-7 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ background: '#7E3285' }}
                >
                  Rechercher
                </button>
              </div>

              <div className="flex flex-wrap gap-5 text-sm text-gray-500 mb-8">
                {['100% gratuit', 'Sans engagement', 'Réponse en 24h'].map(badge => (
                  <div key={badge} className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-eminence" />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/companies')}
                className="inline-flex items-center gap-2 border border-eminence text-eminence font-semibold text-sm px-6 py-3 rounded-xl hover:bg-eminence hover:text-white transition-colors"
              >
                Découvrir les entreprises <ArrowRight size={16} />
              </button>
            </div>

            {/* Droite — image hero */}
            <div className="hidden lg:flex justify-center relative">
              {/* Cercle décoratif de fond */}
              <div
                className="absolute inset-0 rounded-full opacity-10 scale-90"
                style={{ background: '#E0B6E4', filter: 'blur(60px)' }}
              />
              <div className="relative z-10 w-80 h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <img
                  src="/images/deal.png"
                  alt="Proxyo hero"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge flottant 1 */}
              <div className="absolute top-8 -left-4 bg-white border border-gray-100 shadow-md rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm z-20">
                <div className="w-8 h-8 rounded-lg bg-lavender bg-opacity-30 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-eminence" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-xs">+10 000 entreprises</div>
                  <div className="text-gray-400 text-xs">partenaires actifs</div>
                </div>
              </div>

              {/* Badge flottant 2 */}
              <div className="absolute bottom-10 -right-4 bg-white border border-gray-100 shadow-md rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm z-20">
                <div className="w-8 h-8 rounded-lg bg-lavender bg-opacity-30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-eminence" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-xs">Mission acceptée</div>
                  <div className="text-gray-400 text-xs">il y a 2 minutes</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-eminence">{s.number}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTRO SPLIT ──────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Une solution complète pour<br />
                <span className="text-eminence">chaque besoin professionnel</span>
              </h2>
            </div>
            <div>
              <p className="text-gray-500 text-lg leading-relaxed">
                Chez Proxyo, nous connectons les entreprises qui publient des missions avec les prestataires capables de les réaliser. Notifications géolocalisées, candidatures en un clic, messagerie intégrée — tout est pensé pour aller vite et bien.
              </p>
              <button className="mt-6 inline-flex items-center gap-2 text-eminence font-semibold text-sm hover:gap-3 transition-all">
                En savoir plus sur Proxyo <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTEURS ─────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">Nos secteurs d'activité</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              9 secteurs couverts, des milliers de missions disponibles chaque mois.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SECTORS.map((sector, i) => (
              <Link
                key={i}
                to={`/secteurs/${sector.slug}`}
                className="relative rounded-2xl overflow-hidden h-44 sm:h-56 group cursor-pointer shadow-sm hover:shadow-xl transition-shadow"
              >
                <img
                  src={sector.image}
                  alt={sector.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-bold text-white text-base mb-2">{sector.title}</h3>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1">
                    {sector.features.map(f => (
                      <li key={f} className="text-xs text-white/70">{f}</li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10 flex flex-wrap justify-center gap-4">
            <button className="inline-flex items-center gap-2 border border-eminence text-eminence font-semibold text-sm px-6 py-3 rounded-xl hover:bg-eminence hover:text-white transition-colors">
              Voir toutes les missions <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/companies')}
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ background: '#7E3285' }}
            >
              Parcourir les entreprises <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────── */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">Comment ça marche ?</h2>
            <p className="text-gray-500 text-lg">3 étapes pour trouver votre prochain partenaire professionnel.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="relative">
                {/* Connecteur */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gray-200 z-0 -translate-x-1/2" />
                )}
                <div className="relative z-10 bg-gray-50 rounded-2xl p-7 border border-gray-100 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-lavender bg-opacity-30 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-4xl font-black text-eminence opacity-20 leading-none">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POURQUOI PROXYO ──────────────────────────────────────── */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Image gauche */}
            <div className="relative">
              
                <img src="/images/france.png" alt="Pourquoi Proxyo" className="w-full rounded-2xl object-cover" />
              {/* Badge flottant */}
              <div className="absolute -bottom-5 -right-5 bg-white border border-gray-100 shadow-lg rounded-2xl px-5 py-4">
                <div className="text-2xl font-black text-eminence">98%</div>
                <div className="text-xs text-gray-500">de satisfaction client</div>
              </div>
            </div>

            {/* Droite */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pourquoi choisir<br />
                <span className="text-eminence">Proxyo ?</span>
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                Nous avons conçu Proxyo pour simplifier les relations B2B : chaque mission trouve son prestataire, chaque prestataire trouve ses clients — sans friction.
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {FEATURES.map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-lavender bg-opacity-25 flex items-center justify-center flex-shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-1">{f.title}</div>
                      <div className="text-gray-500 text-xs leading-relaxed">{f.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">Ce qu'ils en disent</h2>
            <p className="text-gray-500 text-lg">Des entreprises qui nous font confiance chaque jour.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
                {/* Étoiles */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={15} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  {/*
                    ↓ Remplacez par :
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  */}
                  <div className="w-10 h-10 rounded-full bg-lavender bg-opacity-40 flex items-center justify-center text-eminence font-bold text-sm flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA PROFESSIONNEL ────────────────────────────────────── */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-eminence rounded-3xl p-7 sm:p-10 md:p-14 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center overflow-hidden relative">
            {/* Décoration discrète */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-purple opacity-30" />
            <div className="absolute -bottom-10 right-32 w-40 h-40 rounded-full bg-violet opacity-20" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Prêt à développer votre activité ?
              </h2>
              <p className="text-lavender text-base leading-relaxed mb-6">
                Rejoignez Proxyo gratuitement, recevez des missions dans votre secteur et gérez vos candidatures depuis un seul tableau de bord.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-white text-eminence font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-lavender transition-colors inline-flex items-center gap-2 shadow-md">
                  Créer un compte gratuit <ArrowRight size={16} />
                </button>
                <button className="border border-white border-opacity-40 text-white font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-white hover:bg-opacity-10 transition-colors">
                  En savoir plus
                </button>
              </div>
            </div>

            <div className="relative z-10 hidden lg:flex justify-center">
              {/*
                ↓ Remplacez par :
                <img src="/images/cta-join.png" alt="Rejoindre Proxyo" className="w-64 object-contain" />
              */}
              <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-white border-opacity-30 flex items-center justify-center text-white text-opacity-40 text-xs text-center px-6">
                [ IMAGE_CTA ]<br />professionnels / équipe
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
