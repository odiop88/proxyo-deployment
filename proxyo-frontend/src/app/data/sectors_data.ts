export interface SectorData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string;
  image: string;
  services: { title: string; description: string }[];
  benefits: string[];
  faq: { question: string; answer: string }[];
}

const SECTORS_DATA: SectorData[] = [
  {
    slug: "it",
    title: "IT / Informatique",
    metaTitle: "Trouver des prestataires IT & Informatique B2B | Proxyo",
    metaDescription:
      "Proxyo connecte vos projets IT avec les meilleures entreprises spécialisées : développement web, cybersécurité, cloud, support. Recevez des devis en 24h.",
    headline: "Trouvez les meilleurs prestataires IT pour vos projets",
    intro:
      "Le secteur IT évolue vite. Proxyo vous met en relation avec des entreprises spécialisées en développement, cybersécurité, cloud et infrastructure — vérifiées et disponibles dans votre département.",
    image: "/images/sectors/it.png",
    services: [
      {
        title: "Développement web & mobile",
        description:
          "Sites vitrine, applications métier, e-commerce, applications mobiles iOS et Android.",
      },
      {
        title: "Cybersécurité",
        description:
          "Audit de sécurité, tests d'intrusion, mise en conformité RGPD, protection des données.",
      },
      {
        title: "Cloud & infrastructure",
        description:
          "Migration cloud, hébergement, administration de serveurs, DevOps et CI/CD.",
      },
      {
        title: "Support & maintenance",
        description:
          "Helpdesk, infogérance, maintenance applicative et support utilisateurs.",
      },
    ],
    benefits: [
      "Prestataires IT vérifiés avec SIRET validé",
      "Candidatures reçues sous 24h",
      "Comparaison des devis en un coup d'oeil",
      "Messagerie intégrée pour échanger les specs",
    ],
    faq: [
      {
        question: "Comment trouver un développeur freelance pour mon entreprise ?",
        answer:
          "Publiez votre mission sur Proxyo en précisant vos besoins techniques, votre budget et vos délais. Les entreprises IT de votre département reçoivent une alerte et vous envoient leur devis.",
      },
      {
        question: "Quels types de projets IT puis-je confier ?",
        answer:
          "Tous types : site web, application mobile, audit sécurité, migration cloud, infogérance, intégration ERP/CRM, etc.",
      },
      {
        question: "Les prestataires IT sont-ils vérifiés ?",
        answer:
          "Oui. Chaque entreprise inscrite sur Proxyo a son SIRET vérifié et son statut légal contrôlé avant activation.",
      },
    ],
  },
  {
    slug: "secretariat",
    title: "Secrétariat / Assistanat",
    metaTitle: "Prestataires Secrétariat & Assistanat B2B | Proxyo",
    metaDescription:
      "Trouvez rapidement une entreprise spécialisée en secrétariat externalisé, assistanat de direction et gestion administrative. Devis gratuit en 24h sur Proxyo.",
    headline: "Externalisez votre secrétariat et gestion administrative",
    intro:
      "Manque de temps pour votre administratif ? Proxyo vous connecte avec des entreprises spécialisées en secrétariat externalisé, disponibles dans votre zone géographique et prêtes à intervenir rapidement.",
    image: "/images/sectors/secretariat.png",
    services: [
      {
        title: "Assistanat de direction",
        description:
          "Gestion d'agenda, organisation de réunions, rédaction de comptes-rendus et suivi de dossiers.",
      },
      {
        title: "Gestion administrative",
        description:
          "Traitement du courrier, saisie de données, gestion des factures et archivage.",
      },
      {
        title: "Accueil & standard téléphonique",
        description:
          "Accueil physique et téléphonique externalisé pour votre entreprise.",
      },
      {
        title: "Rédaction & communication",
        description:
          "Rédaction de documents professionnels, emails, présentations et supports de communication.",
      },
    ],
    benefits: [
      "Flexibilité : ponctuellement ou sur le long terme",
      "Pas de charges patronales liées à un salarié",
      "Réactivité garantie sous 24h",
      "Prestataires proches de votre entreprise",
    ],
    faq: [
      {
        question: "Quel est le coût d'un secrétariat externalisé ?",
        answer:
          "Le prix varie selon le volume horaire et les missions confiées. Sur Proxyo, vous recevez plusieurs devis et comparez librement avant de choisir.",
      },
      {
        question: "Puis-je confier mon secrétariat à distance ?",
        answer:
          "Oui. La plupart des prestataires en secrétariat proposent des services 100% à distance avec des outils collaboratifs adaptés.",
      },
    ],
  },
  {
    slug: "photographie",
    title: "Photographie / Vidéo",
    metaTitle: "Trouver un photographe ou vidéaste professionnel B2B | Proxyo",
    metaDescription:
      "Proxyo met en relation votre entreprise avec des photographes et vidéastes professionnels pour vos événements, shootings produits et vidéos corporate.",
    headline: "Des photographes et vidéastes professionnels pour vos projets",
    intro:
      "Un visuel professionnel vaut mille mots. Proxyo vous connecte avec des entreprises spécialisées en photographie et vidéo, pour donner à votre marque l'image qu'elle mérite.",
    image: "/images/sectors/photography.png",
    services: [
      {
        title: "Reportage événementiel",
        description:
          "Séminaires, conférences, team buildings, inaugurations et soirées d'entreprise.",
      },
      {
        title: "Vidéo corporate",
        description:
          "Film institutionnel, présentation de produits, témoignages clients, motion design.",
      },
      {
        title: "Shooting produits",
        description:
          "Photos de produits pour e-commerce, catalogues et supports publicitaires.",
      },
      {
        title: "Portrait & personal branding",
        description:
          "Photos professionnelles pour vos collaborateurs, dirigeants et pages LinkedIn.",
      },
    ],
    benefits: [
      "Professionnels équipés et expérimentés",
      "Livrables rapides pour vos deadlines",
      "Devis personnalisés selon vos besoins",
      "Couverture nationale par département",
    ],
    faq: [
      {
        question: "Comment trouver un photographe pour un événement d'entreprise ?",
        answer:
          "Publiez votre mission sur Proxyo avec la date, le lieu et le type d'événement. Les photographes professionnels de votre région vous contactent avec leur devis.",
      },
      {
        question: "Les droits d'auteur sont-ils inclus dans les devis ?",
        answer:
          "Cela dépend du prestataire. Précisez vos besoins (usage commercial, durée, territoire) lors de la publication de votre mission.",
      },
    ],
  },
  {
    slug: "jardinage",
    title: "Jardinage",
    metaTitle: "Prestataires Jardinage & Espaces Verts B2B | Proxyo",
    metaDescription:
      "Trouvez une entreprise spécialisée en entretien d'espaces verts, taille, élagage et aménagement paysager pour vos locaux professionnels. Devis en 24h.",
    headline: "Entretien et aménagement de vos espaces verts professionnels",
    intro:
      "Un espace vert bien entretenu valorise votre image de marque. Proxyo vous connecte avec des entreprises paysagistes sérieuses, disponibles dans votre département.",
    image: "/images/sectors/garden.png",
    services: [
      {
        title: "Entretien régulier",
        description:
          "Tonte, taille de haies, désherbage, arrosage et entretien périodique de vos espaces verts.",
      },
      {
        title: "Élagage & abattage",
        description:
          "Élagage d'arbres, abattage sécurisé et broyage des déchets verts.",
      },
      {
        title: "Création & aménagement",
        description:
          "Conception de jardins, plantation, création de pelouses et systèmes d'arrosage automatique.",
      },
      {
        title: "Nettoyage de terrain",
        description:
          "Débroussaillage, nettoyage post-saison et remise en état de terrains.",
      },
    ],
    benefits: [
      "Prestataires locaux connaissant votre région",
      "Interventions ponctuelles ou contrats réguliers",
      "Matériel professionnel inclus",
      "Devis gratuit sous 24h",
    ],
    faq: [
      {
        question: "Puis-je trouver un prestataire pour l'entretien régulier de mes espaces verts ?",
        answer:
          "Oui. Sur Proxyo, vous pouvez publier une mission récurrente pour trouver un prestataire qui interviendra chaque semaine ou chaque mois selon vos besoins.",
      },
    ],
  },
  {
    slug: "manutention",
    title: "Manutention / Déménagement",
    metaTitle: "Prestataires Manutention & Déménagement B2B | Proxyo",
    metaDescription:
      "Trouvez une entreprise professionnelle pour vos déménagements d'entreprise, transports de marchandises et logistique événementielle. Proxyo.",
    headline: "Manutention et déménagement d'entreprise en toute confiance",
    intro:
      "Déménagement de bureaux, transport de matériel ou logistique événementielle — Proxyo vous met en relation avec des entreprises de manutention fiables et expérimentées.",
    image: "/images/sectors/manutention.png",
    services: [
      {
        title: "Déménagement d'entreprise",
        description:
          "Déménagement complet de bureaux, transfert d'équipements et remontage sur site.",
      },
      {
        title: "Transport de marchandises",
        description:
          "Livraison locale et nationale, transport de matériel fragile et logistique B2B.",
      },
      {
        title: "Logistique événementielle",
        description:
          "Montage/démontage de stands, transport de matériel pour salons et événements.",
      },
      {
        title: "Manutention sur site",
        description:
          "Déchargement, mise en place, rangement et gestion des stocks.",
      },
    ],
    benefits: [
      "Équipes formées et assurées",
      "Matériel adapté aux déménagements pro",
      "Réactivité pour les missions urgentes",
      "Devis précis basés sur votre inventaire",
    ],
    faq: [
      {
        question: "Comment organiser un déménagement d'entreprise rapidement ?",
        answer:
          "Publiez votre mission sur Proxyo avec les détails (volumes, adresses, date souhaitée). Vous recevez des devis d'entreprises spécialisées sous 24h.",
      },
    ],
  },
  {
    slug: "securite",
    title: "Sécurité / Gardiennage",
    metaTitle: "Prestataires Sécurité & Gardiennage B2B | Proxyo",
    metaDescription:
      "Trouvez une société de sécurité et gardiennage pour vos locaux, événements d'entreprise et sites professionnels. Agents qualifiés. Devis gratuit sur Proxyo.",
    headline: "Sécurité et gardiennage professionnel pour vos sites et événements",
    intro:
      "La sécurité de vos locaux et événements ne doit pas être laissée au hasard. Proxyo vous connecte avec des sociétés de sécurité agréées, disponibles dans votre département.",
    image: "/images/sectors/guard.png",
    services: [
      {
        title: "Gardiennage de site",
        description:
          "Surveillance 24h/24, rondes de sécurité, contrôle d'accès et gestion des alarmes.",
      },
      {
        title: "Sécurité événementielle",
        description:
          "Agents de sécurité pour conférences, concerts, soirées d'entreprise et salons.",
      },
      {
        title: "Contrôle d'accès",
        description:
          "Gestion des entrées/sorties, vérification des badges et accueil sécurisé.",
      },
      {
        title: "Télésurveillance",
        description:
          "Surveillance à distance, levée de doute et intervention rapide.",
      },
    ],
    benefits: [
      "Sociétés agréées CNAPS",
      "Agents formés et certifiés",
      "Disponibles 7j/7, 24h/24",
      "Couverture nationale",
    ],
    faq: [
      {
        question: "Les sociétés de sécurité sur Proxyo sont-elles agréées ?",
        answer:
          "Oui. Toutes les entreprises de sécurité doivent être agréées CNAPS. Proxyo vérifie les documents légaux de chaque prestataire lors de l'inscription.",
      },
    ],
  },
  {
    slug: "restauration",
    title: "Restauration",
    metaTitle: "Trouver un Traiteur ou Chef à Domicile B2B | Proxyo",
    metaDescription:
      "Proxyo vous connecte avec les meilleurs traiteurs, chefs à domicile et prestataires restauration pour vos événements d'entreprise. Devis gratuit en 24h.",
    headline: "Des professionnels de la restauration pour vos événements",
    intro:
      "Un repas d'affaires réussi commence par le bon prestataire. Proxyo met en relation les entreprises avec des traiteurs et chefs professionnels pour tous leurs événements.",
    image: "/images/sectors/cooking.png",
    services: [
      {
        title: "Traiteur événementiel",
        description:
          "Buffets, cocktails dinatoires, repas assis pour vos séminaires et soirées d'entreprise.",
      },
      {
        title: "Chef à domicile",
        description:
          "Chef professionnel qui cuisine sur place pour vos repas d'affaires et événements privés.",
      },
      {
        title: "Service en salle",
        description:
          "Personnel de service (maîtres d'hôtel, serveurs) pour vos événements professionnels.",
      },
      {
        title: "Livraison de repas",
        description:
          "Plateaux repas et déjeuners livrés pour vos équipes et réunions.",
      },
    ],
    benefits: [
      "Professionnels certifiés HACCP",
      "Menus personnalisables selon vos contraintes",
      "De 10 à 1000 convives",
      "Gestion complète de A à Z",
    ],
    faq: [
      {
        question: "Comment trouver un traiteur pour un séminaire d'entreprise ?",
        answer:
          "Publiez votre mission sur Proxyo avec le nombre de convives, la date et le type d'événement. Les traiteurs de votre région vous répondent sous 24h.",
      },
    ],
  },
  {
    slug: "nettoyage",
    title: "Nettoyage / Ménage",
    metaTitle: "Prestataires Nettoyage de Locaux Professionnels B2B | Proxyo",
    metaDescription:
      "Trouvez une entreprise de nettoyage pour vos bureaux, locaux commerciaux et sites industriels. Intervention ponctuelle ou contrat régulier. Proxyo.",
    headline: "Nettoyage professionnel de vos locaux et bureaux",
    intro:
      "Des locaux propres, c'est une meilleure image et un environnement de travail sain. Proxyo vous connecte avec des entreprises de nettoyage professionnelles, réactives et fiables.",
    image: "/images/sectors/nettoyage.png",
    services: [
      {
        title: "Nettoyage de bureaux",
        description:
          "Entretien régulier de vos espaces de travail, sanitaires, salles de réunion et parties communes.",
      },
      {
        title: "Nettoyage industriel",
        description:
          "Nettoyage de sites de production, entrepôts, ateliers et zones à contraintes spécifiques.",
      },
      {
        title: "Vitrerie",
        description:
          "Nettoyage de vitres intérieures et extérieures, façades et vérandas.",
      },
      {
        title: "Remise en état",
        description:
          "Nettoyage fin de chantier, remise en état après travaux ou sinistre.",
      },
    ],
    benefits: [
      "Produits professionnels certifiés",
      "Intervention hors heures de bureau si souhaité",
      "Contrats ponctuels ou récurrents",
      "Devis détaillé sans engagement",
    ],
    faq: [
      {
        question: "Quel est le prix d'un nettoyage de bureaux professionnels ?",
        answer:
          "Le tarif dépend de la superficie, de la fréquence et des prestations souhaitées. Publiez votre mission sur Proxyo et recevez plusieurs devis comparatifs.",
      },
    ],
  },
  {
    slug: "autre",
    title: "Autres secteurs",
    metaTitle: "Prestataires professionnels tous secteurs B2B | Proxyo",
    metaDescription:
      "Proxyo couvre tous les besoins professionnels B2B. Électricité, plomberie, maintenance, et bien plus. Trouvez votre prestataire en 24h.",
    headline: "Tous vos besoins professionnels, un seul endroit",
    intro:
      "Votre besoin ne rentre pas dans une case ? Proxyo couvre un large spectre de métiers et services professionnels. Publiez votre mission, les bons prestataires vous répondront.",
    image: "/images/sectors/depannage.png",
    services: [
      {
        title: "Électricité",
        description:
          "Installation, dépannage et maintenance électrique pour locaux professionnels.",
      },
      {
        title: "Plomberie",
        description:
          "Dépannage, installation et maintenance des réseaux eau et sanitaires.",
      },
      {
        title: "Climatisation & chauffage",
        description:
          "Installation, entretien et dépannage de systèmes CVC.",
      },
      {
        title: "Maintenance générale",
        description:
          "Maintenance préventive et curative de vos équipements et locaux.",
      },
    ],
    benefits: [
      "Prestataires multi-métiers disponibles",
      "Intervention rapide sur devis",
      "Vérification des certifications métier",
      "Couverture nationale",
    ],
    faq: [
      {
        question: "Mon secteur n'est pas listé, puis-je quand même publier une mission ?",
        answer:
          "Oui. Sélectionnez 'Autre' lors de la publication et décrivez précisément votre besoin. Les prestataires correspondants recevront votre mission.",
      },
    ],
  },
];

export default SECTORS_DATA;

export function getSectorBySlug(slug: string): SectorData | undefined {
  return SECTORS_DATA.find((s) => s.slug === slug);
}
