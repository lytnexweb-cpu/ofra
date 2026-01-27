# OFRA v2 — Document de Decisions Fondamentales

**Projet** : OFRA — Transaction Management System pour agents immobiliers canadiens
**Date** : 26 janvier 2026
**Participants** : Sam (Product Owner) + Equipe BMAD (10 agents experts)
**Statut** : Decisions validees — Pret pour Epique 1

---

## 1. VISION PRODUIT

### Positionnement

- OFRA est un **Transaction Management System**, PAS un CRM de leads
- L'outil commence au moment ou un lead devient client et qu'une transaction demarre
- La gestion des leads reste dans les CRM existants (FollowUpBoss, etc.)
- OFRA se positionne comme un complement transactionnel, pas un remplacement de CRM

### Marche cible

- **Lancement** : Nouveau-Brunswick (Moncton)
- **Objectif** : National (tout le Canada)
- **Cible initiale** : Agents immobiliers individuels
- **Cible future** : Brokerages / Courtages (equipes)
- **Defi principal** : Chaque province a un workflow transactionnel different

---

## 2. DECISIONS TECHNIQUES

### 2.1 Stack technologique — CONSERVE + ENRICHI

| Couche | Technologie | Version | Decision |
|--------|-------------|---------|----------|
| Frontend | React + Vite + Tailwind + TanStack Query | 19 / 7 / 4 / 5 | GARDE |
| Backend | AdonisJS + Lucid ORM | 6 / 21 | GARDE |
| Database | PostgreSQL | 16 | GARDE |
| Hosting Frontend | Cloudflare Pages | — | GARDE |
| Hosting Backend | Fly.io | — | GARDE |
| Hosting DB | Fly.io (internal) | — | GARDE |
| CI/CD | GitHub Actions | — | GARDE |
| Email | Brevo (SMTP) | — | GARDE |
| Auth | Session/Cookie (AdonisJS) | — | GARDE |

### 2.2 Ajouts au stack

| Ajout | Raison | Quand |
|-------|--------|-------|
| **Redis** | Cache, rate limiting, session store, job queue backend | Epique 1 |
| **BullMQ** | Jobs asynchrones (emails, reminders, taches de fond) | Epique 3 |
| **react-i18next** (ou similar) | Internationalisation frontend FR/EN | Epique 1 |
| **Sentry** | Error tracking en production | Epique 1 |

### 2.3 Justification du maintien du stack

- TypeScript full-stack (coherence)
- AdonisJS = Laravel du TypeScript (structure, ORM, validation, mail, auth integres)
- PostgreSQL = standard pour donnees relationnelles transactionnelles
- Frameworks matures et bien documentes
- Deja deploye et fonctionnel
- Pas de bottleneck technique identifie pour l'envergure nationale (milliers d'agents)
- Fly.io supporte le multi-region Canada (yyz Toronto, yul Montreal)
- Cloudflare Pages = CDN mondial, frontend rapide partout

---

## 3. DECISIONS ARCHITECTURALES

### 3.1 Clean Slate Transactionnel

**Decision** : Reconstruire le module transactionnel from scratch

**Ce qu'on GARDE** :
- Authentification et gestion utilisateurs
- Gestion des clients et proprietes
- Infrastructure backend (Express/AdonisJS, Knex/Lucid, PostgreSQL)
- Shell frontend (React, routing, layout, dark mode)
- CI/CD pipeline
- Configuration de deploiement

**Ce qu'on SUPPRIME** :
- Ancien enum `TransactionStatus` (7 valeurs hardcodees)
- Anciennes migrations transactionnelles empilees
- `TransactionDetailPage` (1 588 lignes monolithique)
- `TransactionTimeline` (346 lignes)
- Anciens modals conditions/offres
- Ancien systeme d'offres

**Justification** : Pas d'utilisateurs en production avec des donnees a preserver. Migrer l'ancien modele = ecrire du code pour convertir des donnees de test. Cout sans valeur.

### 3.2 Workflow Engine Configurable

**Architecture en 3 couches** :

```
TEMPLATE LAYER (configurable)
├── workflow_templates (province, name, is_default, created_by_user_id)
├── workflow_steps (template_id, step_order, name, slug, typical_duration_days)
├── workflow_step_conditions (step_id, condition_type, is_blocking_default, is_required)
└── workflow_step_automations (step_id, trigger, action_type, template_id, delay_days)
    ├── trigger: "on_enter" | "on_exit" | "on_condition_complete"
    └── action_type: "send_email" | "create_reminder" | "create_task"

INSTANCE LAYER (runtime)
├── transactions (linked to template instance)
├── transaction_steps (current progress, can deviate from template)
├── conditions (per transaction, checkable, with dependencies)
└── automations_log (what fired, when)

ACTIVITY LAYER (historique)
└── activity_feed (unified: status changes, conditions, offers, emails, reminders, notes)
```

**Avantages** :
- Chaque province = un template par defaut
- Agent peut personnaliser ou creer son propre workflow
- Ajout d'une province = ajout d'un template, pas une refonte
- Timeline = activity feed unifie (pas juste des transitions de statuts)

### 3.3 Multi-tenancy Leger

```
organizations (table — optionnel pour agents solo)
├── id, name, province_code

users
├── id, organization_id (nullable), role (agent | admin | assistant)

transactions
├── owner_user_id, organization_id
```

- Agent solo : `organization_id = null`, voit ses transactions
- Agent en brokerage : voit les siennes, admin voit tout le brokerage
- Filtre code des le depart, meme si lancement agents solo uniquement

### 3.4 Bilinguisme / i18n

- **Code** : toujours en anglais
- **UI** : English-first, toutes les strings passent par i18n (cles de traduction)
- **Francais** : premiere locale ajoutee
- **Emails automatiques** : envoyes dans la langue preferee du client (`preferred_language`)
- **Nettoyage** : eliminer le melange FR/EN actuel dans l'interface
- **Glossaire bilingue** : maintenu dans un fichier de reference

| Concept | Code (EN) | UI English | UI Francais |
|---------|-----------|------------|-------------|
| Dossier | `transaction` | Transaction / Deal | Dossier / Transaction |
| Etape | `workflow_step` | Step | Etape |
| Condition | `condition` | Condition | Condition |
| Offre | `offer` | Offer | Offre |
| Courtier | `agent` | Agent | Courtier |
| Courtage | `organization` | Brokerage | Courtage |

### 3.5 Mobile-first

- Design responsive mobile-first (pas desktop adapte)
- PWA-ready (structure le permet, pas implemente au lancement)
- React + Tailwind = responsive natif si code mobile-first
- Zero cout App Store, zero double codebase

### 3.6 Notifications

- **Lancement** : Email + In-app
- **Architecture** : Service abstrait extensible

```
NotificationService.send({
  userId, channel, template, data, language
})

notification_channels: email (v1) | in_app (v1) | push (v2) | sms (v2)
```

- Push (PWA) et SMS ajoutables sans refonte

### 3.7 Strategie de tests

- **Workflow Engine** (logique metier) : Tests unitaires obligatoires
- **API endpoints** : Tests d'integration obligatoires
- **Parcours critiques** : Tests E2E (creer transaction, completer condition, avancer step)
- **UI** : Pas de TDD dogmatique, tests sur composants critiques
- **Regle** : Pas de merge sans tests sur logique metier et API
- **Outils** : Vitest (frontend), Japa (backend) — deja en place

---

## 4. TEMPLATE NB (PREMIER WORKFLOW)

### Source
Echanges email avec un agent immobilier au Nouveau-Brunswick (Moncton)

### Pipeline transactionnel NB (8 etapes)

| # | Etape | Slug |
|---|-------|------|
| 1 | Buyer/Seller Consultation | `consultation` |
| 2 | Offer Submitted | `offer_submitted` |
| 3 | Offer Accepted | `offer_accepted` |
| 4 | Conditional Period | `conditional` |
| 5 | Firm Pending | `firm_pending` |
| 6 | Pre-Closing Tasks | `pre_closing` |
| 7 | Closing Day / Key Delivery | `closing` |
| 8 | Post-Closing Follow-Up | `post_closing` |

### Conditions types (cochables individuellement)

| Condition | Obligatoire | Bloquante par defaut |
|-----------|-------------|----------------------|
| Financing | Non (varie par dossier) | Oui |
| Deposit | Non | Oui |
| Inspection | Non | Oui |
| Water Test | Non | Non |
| RPDS Review | Non | Non |
| Custom (libre) | Non | Configurable |

### Automations client (emails)

| Declencheur | Action |
|-------------|--------|
| Offer Accepted | Email confirmation + next steps + condition timeline |
| Firm Deal | Email "What's Next" avec date de closing |
| SOLD + Key Day | Notification celebration + rappel social media |
| Rejected Offer | Aucune automation (gere manuellement) |

### Automations internes (reminders)

| Declencheur | Reminder |
|-------------|----------|
| Deal becomes Firm | Completer FINTRAC |
| FINTRAC complete | Enregistrer birthday client dans CRM |
| Offer Accepted | Social media reminder |
| SOLD | Social media reminder |
| Key Day | Social media reminder |
| Conditional period | Suivi financing + inspection |
| Post-closing | Demander Google review |

### Formulaire onboarding client

Formulaire externe envoyable au client apres listing appointment :
- Noms complets
- Email + telephone
- Adresse
- Details d'identite (FINTRAC)
- Info propriete de base
- Questions d'onboarding diverses

A la soumission :
- Donnees envoyees a l'agent (pour ajout dans FollowUpBoss)
- Profil client cree dans OFRA
- Transaction prete a etre suivie

---

## 5. PROBLEMES IDENTIFIES DANS L'INTERFACE ACTUELLE

| # | Probleme | Impact |
|---|----------|--------|
| 1 | Timeline = log de statuts, pas une vraie progression | L'agent ne voit pas ou il en est |
| 2 | Conditions non hierarchisees, bloquantes noyees | Risque de manquer une deadline |
| 3 | Page monolithique (1588 lignes), surcharge cognitive | UX penible |
| 4 | Vocabulaire metier absent | Deconnexion avec le quotidien |
| 5 | Pipeline rigide (enum hardcode) | Impossible d'adapter sans migration |
| 6 | Pas d'activity feed unifie | Vision fragmentee du dossier |
| 7 | Aucune dependance entre conditions | Ne reflete pas la realite |
| 8 | Systeme d'offres trop technique | Formulaire DB, pas flux metier |
| 9 | Interface majoritairement EN avec du FR melange | Incoherent |
| 10 | Non adapte multi-provincial | Bloquant pour expansion nationale |

---

## 6. ROADMAP — EPIQUES SEQUENTIELLES

### Epique 1 : Workflow Engine + Infrastructure
> Fondation technique. Rien ne se construit sans ca.

- Modele de donnees : templates, steps, conditions, automations (3 couches)
- Template NB par defaut (8 etapes + conditions + automations)
- API CRUD pour templates, steps, conditions
- Ajout Redis au stack
- Ajout i18n (react-i18next) au frontend
- Ajout Sentry (error tracking)
- Multi-tenancy leger (organizations table)
- Tests unitaires + integration
- **VALIDATION : Reunion de revue avant Epique 2**

### Epique 2 : Refonte UI Transaction
> L'interface que l'agent utilise tous les jours.

- Page transaction redesignee :
  - Header fixe : statut, client, propriete, stepper horizontal dynamique
  - Zone d'action : conditions bloquantes, offres en attente, deadlines
  - Details par onglets : Conditions, Offres, Documents, Timeline, Notes
- Stepper dynamique base sur le template (NB = 8 etapes)
- Conditions refondues (checklist claire, bloquantes visuellement distinctes)
- Offres simplifiees (flux conversationnel)
- Activity feed unifie (vraie timeline)
- Mobile-first responsive
- **VALIDATION : Reunion de revue avant Epique 3**

### Epique 3 : Automations & Reminders
> L'intelligence du systeme.

- Email automations par etape (templates configurables)
- Integration BullMQ pour jobs async
- Reminder engine connecte au workflow
- Automations NB specifiques (FINTRAC, social, Google review)
- Notifications in-app
- **VALIDATION : Reunion de revue avant Epique 4**

### Epique 4 : Onboarding & Import
> Acquisition et setup des clients.

- Formulaire onboarding client (externe, lien partageable)
- Import CSV de leads/clients
- Integration FollowUpBoss (API bidirectionnelle)
- Setup provincial au premier lancement (choix province → template)
- Upload/personnalisation de workflow custom
- **VALIDATION : Reunion de revue finale**

---

## 7. INFRASTRUCTURE ACTUELLE (REFERENCE)

### Frontend (52 fichiers TypeScript)
- React 19.2.0, Vite 7.2.4, Tailwind 4.1.18
- TanStack Query 5.90.12, React Router 7.11.0
- Framer Motion 12.27.1, Recharts 3.6.0, date-fns 4.1.0
- Vitest 4.0.17, Testing Library

### Backend (102 fichiers TypeScript)
- AdonisJS 6.18.0, Lucid ORM 21.6.1
- Vine validators 3.0.1, AdonisJS Mail 9.2.2
- 9 controllers, 12 models, 5 services, 7 validators, 6 middleware
- Japa test runner, 4 fichiers de specs

### Deploiement
- Frontend : Cloudflare Pages (ofra.pages.dev)
- Backend : Fly.io (crm-yanick-backend.fly.dev), region ewr
- Database : PostgreSQL 16, Fly.io internal
- CI/CD : GitHub Actions (lint + typecheck + tests sur push/PR)
- Docker : Multi-stage builds (node:20-alpine + nginx:alpine)

---

*Document genere lors de la session BMAD Party Mode du 26 janvier 2026*
*Toutes les decisions ont ete validees par Sam (Product Owner)*
