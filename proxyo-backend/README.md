# Proxyo — Backend

API REST d'une plateforme B2B de mise en relation entre entreprises pour des missions ponctuelles. Une entreprise publie une mission, d'autres y candidatent, et la plateforme gère le paiement sécurisé via Stripe.

## Stack technique

| Technologie | Usage |
|---|---|
| Django 6 + DRF | Framework principal + API REST |
| PostgreSQL | Base de données |
| Simple JWT | Authentification par token (Bearer) |
| Django Channels + Redis | WebSocket temps réel (messagerie) |
| Stripe | Paiement sécurisé (PaymentIntent + Webhooks) |
| Gmail SMTP | Envoi d'emails transactionnels |

---

## Structure du projet

```
Proxyo_back/
├── Proxyo_back/        # Configuration Django (core)
├── User/               # Module principal (users, missions, paiements...)
├── Messaging/          # Messagerie temps réel (WebSocket)
├── Service/            # Service de notifications centralisé
└── templates/          # Templates HTML (emails)

```

## Modules

### `Proxyo_back/` — Configuration centrale

Le cœur Django du projet.

- **`settings.py`** — Configuration complète : base de données PostgreSQL, JWT (access 10h / refresh 7j), CORS, Redis pour les channels, Stripe, email SMTP Gmail, médias.
- **`urls.py`** — Routage principal vers tous les sous-modules.
- **`asgi.py`** — Point d'entrée ASGI (requis pour le WebSocket via Django Channels).

---

### `User/` — Module principal

Le module le plus complet. Regroupe toute la logique métier de la plateforme.

#### Modèles (`User/models/`)

| Fichier | Modèle | Description |
|---|---|---|
| `company_model.py` | `Company` | Entreprise enregistrée sur la plateforme. Secteur d'activité, SIRET, logo, bannière, statut (active / suspendu / en attente). |
| `users_model.py` | `User` | Utilisateur lié à une entreprise. Rôles : `owner` (peut tout gérer) ou `employee`. Email unique, avatar, vérification email. Quand un owner est supprimé, sa company entière est supprimée en cascade. |
| `missions_model.py` | `Mission` | Mission publiée par une entreprise cliente. Titre, secteur, ville, budget min/max, deadline. Cycle de vie : `open → pending_payment → in_progress → pending_confirmation → completed`. |
| `applications_model.py` | `Application` | Candidature d'une entreprise prestataire à une mission. Lettre de motivation, prix proposé, délai estimé, option TVA. Une seule candidature par mission par entreprise. |
| `payment_model.py` | `Payment` | Paiement lié à une candidature acceptée. Calcule et snapshote tous les montants : TVA, commission plateforme (10%), total client, montant prestataire. Intégré à Stripe (PaymentIntent + Transfer). |
| `stripe_model.py` | `StripeAccount` | Coordonnées bancaires Stripe du prestataire pour recevoir les fonds (Connect). |
| `notifications_model.py` | `Notification` | Notification in-app liée à une entreprise. Types : nouvelle mission, nouvelle candidature, acceptation/rejet, etc. |
| `email_token_model.py` | `EmailVerificationToken` | Token UUID à usage unique pour la vérification d'email à l'inscription. |
| `support_model.py` | `SupportAdmin` | Compte administrateur support avec accès étendu à la plateforme. |

#### Vues (`User/views/`)

| Fichier | Responsabilité |
|---|---|
| `auth_user_view.py` | Inscription, connexion, déconnexion, vérification email, refresh token |
| `user_view.py` | Profil utilisateur (lecture, mise à jour, suppression) |
| `company_manage_view.py` | Gestion de sa propre entreprise (owner uniquement) |
| `company_public_view.py` | Consultation publique des profils d'entreprises |
| `missions_view.py` | CRUD des missions + changement de statut |
| `applications_view.py` | Candidater, accepter, rejeter, retirer une candidature |
| `payment_view.py` | Initialiser un paiement, confirmer la mission terminée |
| `stripe_view.py` | Webhook Stripe (payment_intent.succeeded / failed) + gestion des comptes Connect |
| `notifications_view.py` | Lister et marquer les notifications comme lues |
| `support_view.py` | Dashboard support admin |

#### Configs (`User/configs/`)

- **`permissions.py`** — Permissions custom DRF (ex: IsOwner, IsCompanyMember).
- **`filter.py`** — Filtres de recherche pour les missions (secteur, ville, budget...).
- **`utils.py`** — Fonctions d'envoi d'emails (vérification, candidature acceptée, mission démarrée...).
- **`support_auth.py`** — Backend d'authentification pour les comptes support.

#### Management commands (`User/management/commands/`)

- **`create_support_admin.py`** — Commande CLI pour créer un compte support admin : `python manage.py create_support_admin`.

---

### `Messaging/` — Messagerie temps réel

Chat WebSocket entre le client et le prestataire d'une mission en cours.

#### Fonctionnement

Un canal de discussion (`MissionChannel`) est créé automatiquement quand une mission passe au statut `in_progress`. Le canal se ferme 7 jours après que la mission soit `completed`.

L'accès au WebSocket est restreint : seul le client (auteur de la mission) et le prestataire (candidature acceptée) peuvent s'y connecter. L'authentification se fait via le token JWT passé en query param (`ws://...?token=<jwt>`).

#### Fichiers clés

| Fichier | Description |
|---|---|
| `consumers.py` | `MissionChatConsumer` — logique WebSocket (connexion, auth, envoi/réception de messages via Redis) |
| `routing.py` | Déclaration de la route WebSocket : `ws/chat/<mission_id>/` |
| `models/channel_model.py` | `MissionChannel` — canal lié à une mission, avec date de fermeture automatique |
| `models/message_model.py` | `Message` — message envoyé dans un canal, lié à une entreprise expéditrice |

---

### `Service/` — Service de notifications

Couche de service centralisée pour déclencher les notifications suite aux événements métier.

Chaque fonction correspond à un événement du cycle de vie d'une mission :

| Fonction | Déclencheur | Destinataire |
|---|---|---|
| `notify_new_mission` | Mission publiée | Toutes les entreprises actives du même secteur/département |
| `notify_new_application` | Candidature reçue | Le client (posteur de la mission) |
| `notify_application_accepted` | Candidature acceptée | Le prestataire (in-app + email) |
| `notify_application_rejected` | Candidature rejetée | Le prestataire |
| `notify_mission_pending_confirmation` | Prestataire marque la mission terminée | Le client |
| `notify_mission_confirmed` | Client confirme la fin | Le prestataire |
| `notify_mission_started` | Paiement confirmé par Stripe | Client + Prestataire (in-app + email) |
| `notify_payment_failed` | Paiement échoué (webhook Stripe) | Le client |

---

### `templates/` — Templates email

Templates HTML pour les emails transactionnels envoyés via Gmail SMTP.

| Template | Email envoyé |
|---|---|
| `emails/verify_email.html` | Vérification d'adresse email à l'inscription |
| `emails/new_mission.html` | Alerte nouvelle mission dans votre secteur |
| `emails/application_accepted.html` | Votre candidature a été acceptée |
| `emails/application_rejected.html` | Votre candidature n'a pas été retenue |
| `emails/mission_started.html` | La mission peut démarrer (paiement confirmé) |
| `emails/billing_confirmation.html` | Confirmation de facturation |

---

## Installation

### Prérequis

- Python 3.12+
- PostgreSQL
- Redis

### Lancement

```bash
# Appliquer les migrations
python manage.py migrate

# Créer un compte support admin (optionnel)
python manage.py create_support_admin

# Lancer le serveur
python manage.py runserver ou en mode ASGI (daphne -p 8000 Proxyo_back.asgi:application
)
```



---

## Flux métier principal

```
[Entreprise A] Publie une mission
        ↓
[Entreprise B] Candidate avec un devis
        ↓
[Entreprise A] Accepte la candidature
        → Payment créé (montants calculés + snapshotés)
        ↓
[Entreprise A] Paie via Stripe (PaymentIntent)
        → Webhook Stripe → Mission passe en "in_progress"
        → Canal de messagerie créé(pour faccilite l'echange entre les parties)
        ↓
[Entreprise B] Marque la mission comme terminée
        ↓
[Entreprise A] Confirme la fin de mission
        → Fonds transférés au prestataire via Stripe Connect(Stripe SEPA à revoir pour le refund instantanée)
        → Canal de messagerie fermé dans 7 jours(apres la fin de la mission)
```
