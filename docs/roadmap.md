# Roadmap Ofra - SaaS Launch

> Plan d'exécution pour le lancement SaaS d'Ofra
> Dernière mise à jour: 2026-01-29

## Vue d'ensemble

```
ÉTAT ACTUEL (Complété)
├── Epic 1: Workflow Engine ✓
├── Epic 2: Frontend Core ✓
├── Epic 3: Automations + Multi-tenant + Auth ✓
├── Epic 4 (partiel): CSV Import API ✓
└── 77 tests backend + 16 tests E2E ✓

À FAIRE (Lancement SaaS)
├── Epic 5: UI Import CSV + Uploads documents
├── Epic 6: Landing Page
└── Epic 7: Stripe Billing
```

## Epic 5: UI Import CSV + Uploads Documents

### Objectif
Compléter l'expérience utilisateur avec l'interface d'import et la gestion de documents par transaction.

### User Stories

#### 5.1 UI Import CSV Clients

**En tant qu'** agent immobilier
**Je veux** importer mes clients existants via CSV
**Afin de** migrer rapidement depuis mon ancien système

**Critères d'acceptation:**
- [ ] Bouton "Importer des clients" dans la liste clients
- [ ] Modal avec zone drag & drop
- [ ] Lien télécharger template CSV
- [ ] Barre de progression pendant l'upload
- [ ] Résumé: "X clients importés, Y ignorés"
- [ ] Liste des erreurs avec numéro de ligne
- [ ] Tests E2E pour le flow complet

**Maquette:**
```
┌─────────────────────────────────────────────────────┐
│  Importer des clients                          [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │     📁 Glissez votre fichier CSV ici       │   │
│  │        ou cliquez pour sélectionner        │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  📥 Télécharger le template CSV                    │
│                                                     │
│  ─────────────────────────────────────────────     │
│  Colonnes supportées:                              │
│  • firstName / prénom                              │
│  • lastName / nom                                  │
│  • email / courriel                                │
│  • phone / téléphone                               │
│  • address / adresse                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                              [Annuler] [Importer]  │
└─────────────────────────────────────────────────────┘
```

#### 5.2 Upload Documents par Transaction

**En tant qu'** agent immobilier
**Je veux** attacher des documents à mes transactions
**Afin de** centraliser toute l'information au même endroit

**Critères d'acceptation:**
- [ ] Section "Documents" dans la vue transaction
- [ ] Upload drag & drop ou click
- [ ] Types acceptés: PDF, JPG, PNG, HEIC, DOC, DOCX
- [ ] Validation taille selon tier (5/15/25 MB)
- [ ] Affichage quota utilisé / disponible
- [ ] Preview PDF et images dans modal
- [ ] Téléchargement fichier
- [ ] Suppression fichier
- [ ] Tests unitaires service S3
- [ ] Tests E2E upload/download

**Backend tasks:**
- [ ] Model `Document` (id, transaction_id, filename, original_name, size, mime_type, s3_key)
- [ ] Migration create_documents_table
- [ ] Service `StorageService` (upload, download, delete, getSignedUrl)
- [ ] Configuration S3 (bucket, credentials)
- [ ] Endpoints:
  - `POST /api/transactions/:id/documents` - upload
  - `GET /api/transactions/:id/documents` - list
  - `GET /api/documents/:id/download` - signed URL
  - `DELETE /api/documents/:id` - delete
- [ ] Validation quota par tier
- [ ] Middleware vérification plan utilisateur

**Frontend tasks:**
- [ ] Component `DocumentUpload` (dropzone)
- [ ] Component `DocumentList` (table avec actions)
- [ ] Component `DocumentPreview` (modal PDF/image)
- [ ] Component `StorageQuota` (barre de progression)
- [ ] Hook `useDocuments` (CRUD + upload progress)
- [ ] Intégration dans `TransactionDetail`

**Maquette:**
```
┌─────────────────────────────────────────────────────┐
│  📁 Documents                                       │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  + Glisser vos fichiers ici                 │   │
│  │    PDF, JPG, PNG, DOC • Max 15 MB           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  📄 Offre_achat_123.pdf         1.2 MB   👁️  ⬇️  🗑️ │
│  📄 Rapport_inspection.pdf      8.4 MB   👁️  ⬇️  🗑️ │
│  🖼️ Photo_facade.jpg            2.1 MB   👁️  ⬇️  🗑️ │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Utilisé: 847 MB / 2 GB                    [42%]   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────────────────────┘
```

### Estimation
- Backend: 3-4 jours
- Frontend: 3-4 jours
- Tests: 1-2 jours
- **Total: ~8-10 jours**

### Dépendances
- AWS S3 bucket configuré
- Variables d'environnement S3

---

## Epic 6: Landing Page

### Objectif
Créer une page marketing pour présenter Ofra et recruter les Fondateurs.

### User Stories

#### 6.1 Landing Page Marketing

**En tant que** visiteur
**Je veux** comprendre ce qu'est Ofra et ses avantages
**Afin de** décider si je veux m'inscrire

**Sections:**
- [ ] Hero: Titre accrocheur + CTA
- [ ] Problème: Pain points des agents
- [ ] Solution: Features clés Ofra
- [ ] Pricing: 3 tiers avec recommandation
- [ ] Programme Fondateur: Offre spéciale
- [ ] FAQ: Questions fréquentes
- [ ] Footer: Contact, légal

**Maquette Hero:**
```
┌─────────────────────────────────────────────────────────────┐
│  🍁 OFRA                              FR | EN    [Connexion]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     Gérez vos transactions immobilières                     │
│     sans stress, de l'offre à la clôture                   │
│     ─────────────────────────────────────                   │
│                                                             │
│     Le seul Transaction Manager 100% canadien,              │
│     bilingue, conçu pour les agents du Nouveau-Brunswick.   │
│                                                             │
│     [Rejoindre le Programme Fondateur - 3 mois gratuits]   │
│                                                             │
│     ✓ 100% Canadien   ✓ Bilingue FR/EN   ✓ Simple          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Maquette Pricing:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     Choisissez votre plan                                   │
│     Tous les prix en dollars canadiens. Sans surprise.      │
│                                                             │
│  ┌─────────────┐  ┌───────────────┐  ┌─────────────┐       │
│  │  ESSENTIEL  │  │ ⭐ MEILLEUR   │  │   AGENCE    │       │
│  │             │  │    CHOIX      │  │             │       │
│  │    29$      │  │   PRO  49$    │  │     99$     │       │
│  │   /mois     │  │    /mois      │  │    /mois    │       │
│  │             │  │               │  │             │       │
│  │ 1 user      │  │ 3 users       │  │ 10 users    │       │
│  │ 500 MB      │  │ 2 GB          │  │ 10 GB       │       │
│  │ 5 MB/file   │  │ 15 MB/file    │  │ 25 MB/file  │       │
│  │             │  │               │  │             │       │
│  │ [Choisir]   │  │ [Commencer]   │  │ [Choisir]   │       │
│  └─────────────┘  └───────────────┘  └─────────────┘       │
│                                                             │
│  💳 Essai 14 jours • Annulez quand vous voulez             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2 Formulaire Programme Fondateur

**En tant que** agent immobilier intéressé
**Je veux** m'inscrire au Programme Fondateur
**Afin de** bénéficier de 3 mois gratuits

**Critères d'acceptation:**
- [ ] Formulaire: Nom, Email, Téléphone, Ville, Années d'expérience
- [ ] Compteur places restantes (25 - inscrits)
- [ ] Validation email unique
- [ ] Email de confirmation
- [ ] Page "Merci" avec prochaines étapes
- [ ] Admin: liste des inscrits

**Maquette:**
```
┌─────────────────────────────────────────────────────┐
│  🎁 Programme Fondateur                             │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ⚡ Plus que 18 places disponibles!                │
│                                                     │
│  Prénom:     [___________________________]         │
│  Nom:        [___________________________]         │
│  Email:      [___________________________]         │
│  Téléphone:  [___________________________]         │
│  Ville:      [___________________________]         │
│  Expérience: [___ ans dans l'immobilier__]         │
│                                                     │
│  [ ] J'accepte d'offrir 2 sessions de feedback     │
│                                                     │
│  [     Rejoindre le Programme Fondateur     ]      │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  ✓ 3 mois gratuits (plan Pro)                      │
│  ✓ -25% à vie après la période d'essai            │
│  ✓ Badge Membre Fondateur                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 6.3 SEO & Analytics

**Critères d'acceptation:**
- [ ] Meta tags (title, description, og:image)
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Analytics (Plausible ou Posthog)
- [ ] Événements: page_view, cta_click, form_submit

### Stack technique

Options:
1. **Astro** - Static site, fast, SEO-friendly
2. **Next.js static export** - Si besoin d'interactivité
3. **Page dans l'app React existante** - Plus simple, même stack

**Recommandation:** Page dans l'app React existante (route `/` publique)

### Estimation
- Design & copy: 1-2 jours
- Développement: 2-3 jours
- Tests & polish: 1 jour
- **Total: ~4-6 jours**

### Dépendances
- Textes marketing finalisés
- Assets visuels (screenshots app)

---

## Epic 7: Stripe Billing

### Objectif
Implémenter le système de paiement et gestion des abonnements.

### User Stories

#### 7.1 Configuration Stripe

**Tasks:**
- [ ] Créer compte Stripe (mode test)
- [ ] Créer Products:
  - Ofra Essentiel (29$ CAD/mois)
  - Ofra Pro (49$ CAD/mois)
  - Ofra Agence (99$ CAD/mois)
- [ ] Créer Prices avec trial_period_days
- [ ] Configurer webhooks endpoint
- [ ] Variables d'environnement:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ESSENTIEL`
  - `STRIPE_PRICE_PRO`
  - `STRIPE_PRICE_AGENCE`

#### 7.2 Checkout & Subscription

**En tant qu'** utilisateur
**Je veux** m'abonner à un plan
**Afin d'** accéder aux fonctionnalités payantes

**Backend tasks:**
- [ ] Model `Subscription` (user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
- [ ] Migration create_subscriptions_table
- [ ] Ajouter `plan` et `storage_used` à User model
- [ ] Service `StripeService`:
  - createCheckoutSession(userId, priceId)
  - createPortalSession(userId)
  - handleWebhook(event)
- [ ] Endpoints:
  - `POST /api/billing/checkout` - créer session checkout
  - `POST /api/billing/portal` - accès portail client
  - `POST /api/webhooks/stripe` - recevoir events
- [ ] Webhooks handlers:
  - `checkout.session.completed` - activer abo
  - `customer.subscription.updated` - màj plan
  - `customer.subscription.deleted` - désactiver
  - `invoice.payment_failed` - notifier user

**Frontend tasks:**
- [ ] Page `/pricing` avec les 3 plans
- [ ] Bouton "S'abonner" → redirect Stripe Checkout
- [ ] Page `/settings/billing`:
  - Plan actuel
  - Prochaine facturation
  - Bouton "Gérer mon abonnement" → Stripe Portal
- [ ] Affichage quota storage dans sidebar
- [ ] Bannière upgrade si limite atteinte

**Maquette Settings/Billing:**
```
┌─────────────────────────────────────────────────────┐
│  💳 Facturation                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Plan actuel:     Pro ⭐                            │
│  Prix:            49$ CAD/mois                      │
│  Prochaine date:  28 février 2026                   │
│  Statut:          ✓ Actif                           │
│                                                     │
│  [Gérer mon abonnement]  [Changer de plan]         │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  📊 Utilisation                                     │
│                                                     │
│  Stockage:  847 MB / 2 GB                          │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░  42%      │
│                                                     │
│  Utilisateurs:  2 / 3                               │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░  67%      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 7.3 Middleware Plan Enforcement

**Tasks:**
- [ ] Middleware `checkPlan` pour routes protégées
- [ ] Vérifier:
  - Nombre d'utilisateurs (team)
  - Storage utilisé vs limite
  - Features par plan (import CSV, API, etc.)
- [ ] Réponse 402 si limite dépassée avec message clair
- [ ] Grace period 7 jours si paiement échoue

#### 7.4 Programme Fondateur dans Stripe

**Tasks:**
- [ ] Coupon "-25% forever" pour Fondateurs
- [ ] Trial 90 jours (3 mois) pour Fondateurs
- [ ] Flag `is_founder` sur User
- [ ] Appliquer coupon automatiquement après trial

### Estimation
- Configuration Stripe: 1 jour
- Backend (service, webhooks): 3-4 jours
- Frontend: 2-3 jours
- Tests: 1-2 jours
- **Total: ~7-10 jours**

### Dépendances
- Compte Stripe vérifié
- Compte bancaire canadien lié

---

## Timeline globale

```
SEMAINE 1-2: Epic 5 (UI Import + Uploads)
├── Jours 1-4: Backend S3 + Documents
├── Jours 5-8: Frontend Upload + Import UI
└── Jours 9-10: Tests E2E

SEMAINE 3: Epic 6 (Landing Page)
├── Jours 1-2: Design + Copy
├── Jours 3-5: Développement
└── Jour 6: Tests + Polish

SEMAINE 4-5: Epic 7 (Stripe)
├── Jours 1-2: Config Stripe + Models
├── Jours 3-6: Backend Webhooks + Service
├── Jours 7-9: Frontend Billing
└── Jour 10: Tests

SEMAINE 6: Launch Fondateurs
├── Ouvrir inscriptions
├── Onboarder premiers Fondateurs
└── Collecter feedback
```

**Total estimé: 5-6 semaines**

---

## Checklist pré-launch

### Infrastructure
- [ ] Hébergement production (AWS ca-central-1 ou DO Toronto)
- [ ] Base de données production
- [ ] Redis production
- [ ] S3 bucket documents
- [ ] Domaine ofra.ca ou ofra.io
- [ ] SSL certificat
- [ ] Monitoring (Sentry)
- [ ] Backups automatiques

### Configuration
- [ ] Variables d'environnement production
- [ ] Stripe mode live
- [ ] Email transactionnel (Resend/Postmark)
- [ ] DNS configuré

### Légal
- [ ] Conditions d'utilisation
- [ ] Politique de confidentialité
- [ ] Mentions légales

### Marketing
- [ ] Screenshots app pour landing
- [ ] Textes FR et EN
- [ ] Logo haute résolution
- [ ] Open Graph image

---

## Métriques de succès

### Launch (Mois 1-3)
- [ ] 25 Fondateurs inscrits
- [ ] 0 bug critique
- [ ] NPS > 7

### Post-launch (Mois 4-6)
- [ ] 50% conversion Fondateurs → Payants
- [ ] 10 clients payants organiques
- [ ] MRR > 500$ CAD

### Croissance (Mois 7-12)
- [ ] 100 clients payants
- [ ] MRR > 4 000$ CAD
- [ ] Churn < 5%/mois
