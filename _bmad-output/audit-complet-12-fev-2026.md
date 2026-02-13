# Audit Complet du Projet Ofra — 12 février 2026

## Contexte
Audit méthodique approfondi de l'ensemble du projet : documentation, backend, frontend, maquettes, écarts.
Objectif : avoir une vue fidèle de l'état réel avant de planifier la suite.

---

## 1. Inventaire chiffré

| Métrique | Valeur |
|----------|--------|
| Pages frontend | 30 |
| Composants transaction | 57 |
| Composants dashboard | 6 |
| Composants UI (shadcn/Radix) | 18 |
| Fichiers API frontend | 19 |
| Modèles backend | 27 |
| Controllers backend | 20 |
| Services backend | 12 |
| Middleware | 10 |
| Migrations | 70 |
| Seeders | 5 |
| Validators | 14 |
| Routes backend | ~80 endpoints |
| Maquettes HTML | 14 |
| Suivis maquettes (.md) | 4 sur 14 |
| Templates conditions | 52 (4 packs) |
| Villes NB (dropdown) | 64 |
| Clés i18n | ~500+ |

---

## 2. Maquettes — Planifié vs Implémenté

| # | Maquette | HTML | Code | Suivi .md | Audit conformité |
|---|----------|------|------|-----------|-----------------|
| M01 | Transaction Detail | ✅ | ✅ Complet | ❌ | — |
| M02 | Accepter Offre | ✅ | ✅ Complet | ❌ | — |
| M03 | Valider Étape | ✅ | ✅ Complet | ❌ | — |
| M04 | Résoudre Condition (D41) | ✅ | ✅ Complet | ❌ | — |
| M05 | Ajouter Condition | ✅ | ⚠️ Partiel | ❌ | — |
| M06 | Nouvelle Offre | ✅ | ✅ Complet | ❌ | — |
| M07 | Actions Transaction | ✅ | ✅ Complet | ❌ | — |
| M08 | Documents & Preuves | ✅ | ✅ 100% conforme | ✅ | ✅ 6 écarts corrigés |
| M09 | Éditer Transaction | ✅ | ✅ Phases A-C | ✅ | ✅ |
| M10 | Exporter & Partager | ✅ | ✅ 100% conforme | ✅ | ✅ 12 écarts corrigés |
| M11 | Permissions & Rôles | ✅ | ✅ 100% conforme | ✅ | ✅ 6 écarts corrigés |
| M12 | Ajouter Offre | ✅ | ⚠️ À vérifier | ❌ | — |
| M13 | Gestion Parties | ✅ | ✅ Complet | ❌ | — |
| H1 | Landing Page | ✅ | 🔧 En cours | ❌ | — |

**Constat** : 14 maquettes HTML, ~12 implémentées, seulement 4 avec suivi + audit de conformité (M08-M11).

---

## 3. Features — PRD vs Code réel

### 3.1 Implémenté et fonctionnel

| Feature | PRD | Code | Détails |
|---------|-----|------|---------|
| Transaction CRUD | ✅ | ✅ | Create/Edit/Archive/Cancel/Delete |
| Workflow 8 étapes NB | ✅ | ✅ | consultation → offer-submitted → offer-accepted → conditional-period → firm-pending → pre-closing → closing-day → post-closing |
| Conditions premium (3 niveaux) | ✅ | ✅ | blocking / required / recommended |
| 52 templates conditions (4 packs) | ✅ | ✅ | Universal, Rural NB, Condo NB, Financé NB |
| Auto-conditions (profil matching) | ✅ | ✅ | autoConditionsEnabled + toMatchObject() |
| Documents upload/validation/versions | ✅ | ✅ | 6 catégories, cycle complet |
| Offres & contre-offres | ✅ | ✅ | Revisions multiples, accept/reject/withdraw |
| Parties (8 rôles) | ✅ | ✅ | buyer, seller, lawyer, notary, agent, broker, etc. |
| Members & permissions (4 niveaux) | ✅ | ✅ | owner / admin / editor / viewer |
| Share links publics | ✅ | ✅ | Token + expiry + password + tracking |
| Export PDF | ✅ | ✅ | pdf_export_service.ts |
| Export email | ✅ | ✅ | email_service.ts |
| Dashboard urgences | ✅ | ✅ | overdue / urgent / this_week / green |
| Dashboard KPIs | ✅ | ✅ | active / completed / conversion / overdue |
| Clients CRM | ✅ | ✅ | CRUD + import CSV |
| Onboarding wizard (D40) | ✅ | ✅ | practiceType, volume, préférences |
| Admin dashboard | ✅ | ✅ | metrics, subscribers, activity, plans |
| Vérification email | ✅ | ✅ | Token 24h, resend |
| Multi-tenant (solo + org) | ✅ | ✅ | TenantScopeService |
| Plans & pricing (4 plans) | ✅ | ✅ | Seeder + admin CRUD |
| Soft limit (grace 7 jours) | ✅ | ✅ | plan_limit_middleware.ts |
| Founder flag | ✅ | ✅ | isFounder sur user |
| i18n FR/EN | ✅ | ✅ | ~500+ clés |
| Dark mode | ✅ | ✅ | ThemeToggle |
| Condition validation premium (D41) | ✅ | ✅ | Résolution graduée, escape tracking, evidence |
| Activity feed | ✅ | ✅ | ~20 types d'événements |

### 3.2 Planifié mais PAS codé

| Feature | PRD Ref | Notes |
|---------|---------|-------|
| Intégration Stripe (paiement réel) | Pricing v2 | Plans et pricing existent en DB, mais aucun billing réel |
| Rappels email automatiques | D44 Copilote | Service reminder existe, emails existent, mais le déclenchement automatique n'est PAS câblé |
| Mode assisté (suggestions proactives) | D44 | Non implémenté |
| OCR / scan documents | Roadmap Phase 4 | Non implémenté |
| App mobile native | Roadmap | Non implémenté (responsive uniquement) |
| Collaboration temps réel | Roadmap | Non implémenté |
| Reporting avancé | Roadmap Phase 2 | Non implémenté |
| Notifications push | PRD | Non implémenté |

### 3.3 Ce qui a été retiré / écarté volontairement

| Item | Décision | Raison |
|------|----------|--------|
| MLS (Multiple Listing Service) | ❌ Retiré (commit 8078e18) | Non utilisé au Nouveau-Brunswick. Migration drop de la colonne mls_number. |
| Intégration DocuSign | ❌ Écarté | Non pertinent pour le marché NB actuel |
| Intégration MLS externe | ❌ Écarté | Le MLS n'est pas le standard au NB — on utilise ce qui se fait localement |

### 3.4 FINTRAC — État réel

**Qu'est-ce que FINTRAC ?**
Le Centre d'analyse des opérations et déclarations financières du Canada (Financial Transactions and Reports Analysis Centre of Canada). C'est l'organisme fédéral anti-blanchiment d'argent. La loi oblige tout courtier immobilier canadien à :
- Vérifier l'identité de chaque client (pièce d'identité gouvernementale)
- Collecter et conserver : type d'ID, numéro, date de naissance, occupation, source des fonds
- Signaler les transactions suspectes au gouvernement
- Maintenir un dossier de conformité pour chaque transaction

**Ce qui existe dans le code :**

| Élément | Status | Fichier |
|---------|--------|---------|
| Email de rappel FINTRAC | ✅ Implémenté | `backend/app/mails/fintrac_reminder_mail.ts` |
| Automation : rappel à l'étape firm-pending | ✅ Implémenté | `backend/database/seeders/nb_workflow_template_seeder.ts` |
| Déclencheur dans AutomationExecutorService | ✅ Implémenté | `backend/app/services/automation_executor_service.ts` |
| Test unitaire de l'automation | ✅ Implémenté | `backend/tests/unit/automation_executor_service.spec.ts` |
| Catégorie document "identity" | ✅ Existe | Permet d'uploader des pièces d'identité |
| Formulaire collecte données FINTRAC | ❌ Non implémenté | Champs client absents (DOB, ID type, numéro, occupation) |
| Tracking conformité par transaction | ❌ Non implémenté | Aucun dashboard ou statut FINTRAC |
| Export PDF conformité FINTRAC | ❌ Non implémenté | — |
| Champs identité sur modèle Client | ❌ Non implémenté | Pas de date_of_birth, id_type, id_number, occupation, source_of_funds |

**Verdict** : Le marketing dit "FINTRAC-ready" mais en réalité c'est juste un email de rappel automatique. Le vrai module FINTRAC (formulaire client, collecte données, tracking) était planifié pour V1.5 (mois 3-4).

---

## 4. Sprint Conditions Pipeline

| Sprint | Scope | Status |
|--------|-------|--------|
| Sprint 1 | autoConditionsEnabled, profil à la création, offer gate, PartiesCard, ValidateStepModal | ✅ FAIT (commit 49ab4d7) |
| Sprint 2 | Backend lock profil+flag après step 1, toggle "load next step conditions" dans ValidateStepModal | 📋 TODO |
| Sprint 3 | Admin override type-to-confirm, recalcul conditions, audit log | 📋 TODO |
| Sprint 4 | E2E tests, edge cases, polish | 📋 TODO |

---

## 5. Documentation — État de fraîcheur

### 5.1 À jour (fiable)

| Document | MAJ | Fiabilité |
|----------|-----|-----------|
| `_bmad-output/maquette-08-suivi.md` | 11 fév | ✅ 100% |
| `_bmad-output/maquette-09-suivi.md` | 11 fév | ✅ 100% |
| `_bmad-output/maquette-10-suivi.md` | 12 fév | ✅ 100% |
| `_bmad-output/maquette-11-suivi.md` | 12 fév | ✅ 100% |
| `_bmad-output/session-log.md` | 11 fév | ✅ À jour |

### 5.2 Partiellement périmé

| Document | Problème |
|----------|----------|
| **`project-context.md`** | Section 10 a encore l'ancien tableau 3 plans (devrait être 4). Phase C pas entièrement documentée. M10/M11 pas mentionnés comme faits. |
| **`prd.md`** | Décisions D42-D51 marquées "📋 À coder" — certaines sont faites (D40 ✅, D41 ✅, D42 ✅, D45 ✅). Mentions MLS à retirer. |
| **`epics.md`** | Pattern AR12 (Sheet = formulaires) inversé par Phase C (Sheet → Dialog desktop). Jamais corrigé. |
| **`ux-design-specification.md`** | Même problème AR12. Stepper mentionné "horizontal desktop" mais réalité = vertical timeline. |
| **`README.md`** | Mentionne des features FINTRAC et MLS comme si elles existaient. Sections entières périmées. |

### 5.3 Absent (jamais créé)

| Document manquant | Impact |
|-------------------|--------|
| Suivi maquettes M01-M07 | Pas de vérification de conformité maquette ↔ code |
| Suivi maquettes M12, M13 | Idem |
| Design system centralisé | Tokens de design éparpillés dans chaque maquette HTML |

---

## 6. Écarts critiques

### Écart 1 : Pattern Sheet vs Dialog
- **Les docs disent** : "Sheet = formulaires sur mobile, Dialog = confirmations" (epics AR12)
- **La réalité** : Phase C (M09) a converti TOUS les Sheets desktop en Dialogs centrés. Documents = inline collapsible.
- **Impact** : Un dev qui lit les epics coderait à l'envers.

### Écart 2 : Pricing ancien vs nouveau
- **`project-context.md` section 10** : Encore le tableau 3 plans
- **La réalité** : 4 plans (Starter $29 / Solo $49 / Pro $79 / Agence $149) avec seeder + admin CRUD
- **Impact** : Confusion pour quiconque lit project-context.

### Écart 3 : Décisions PRD non trackées
Les décisions D42-D51 dans le PRD sont marquées "📋 À coder" mais :

| Décision | Sujet | Status réel |
|----------|-------|-------------|
| D40 | Onboarding wizard | ✅ FAIT |
| D41 | Condition validation premium | ✅ FAIT |
| D42 | Dashboard urgences | ✅ FAIT |
| D43 | Valeur protégée (bloc) | ❓ À vérifier |
| D44 | Mode assisté / copilote | ❌ PAS FAIT |
| D45 | Admin pricing | ✅ FAIT (AdminPlansPage) |

### Écart 4 : M05/M12 — status flou
Les maquettes "Ajouter Condition" (M05) et "Ajouter Offre" (M12) ont des composants qui existent (`CreateConditionModal`, `CreateOfferModal`) mais aucun audit de conformité maquette ↔ code.

### Écart 5 : Tech debt non résolu
4 items flaggés dans session-log depuis le 4 fév :
1. Doublon migration (noms en conflit)
2. N+1 queries potentielles
3. ReminderService non câblé (service existe mais jamais déclenché)
4. Tests Notes/Offers manquants

### Écart 6 : README.md périmé
Le README mentionne des features comme si elles existaient :
- "Internal reminders system (FINTRAC, birthdays, reviews)" — le système existe en skeleton, pas câblé
- "Onboarding Form professionalizes client intake and ensures FINTRAC compliance" — formulaire client FINTRAC non implémenté
- Champs FINTRAC listés (ID type, number, DOB, occupation) — absents du modèle Client

---

## 7. Backend — Architecture résumée

### Modèles clés (27 total)
- **Transaction** : entité principale avec owner, client, property, workflow, steps, conditions, offers, notes, parties, documents, members, share links
- **TransactionProfile** : 8 champs pour le matching de conditions (propertyType, propertyContext, isFinanced, hasWell, hasSeptic, accessType, condoDocsRequired, appraisalRequired)
- **Condition** : modèle premium avec level, sourceType, resolutionType, escape tracking, evidence
- **ConditionTemplate** : 52 templates bilingues (FR/EN) avec deadline calculation
- **ConditionEvidence** : preuves attachées aux conditions (file/link/note)
- **ConditionEvent** : audit trail complet (~12 types d'événements)
- **Plan** : 4 plans avec monthlyPrice, annualPrice, maxTransactions, maxStorageGb, maxUsers

### Services clés (12 total)
- **ConditionsEngineService** : matching profil → templates, anti-duplicate, création auto
- **WorkflowEngineService** : création transaction, avancement étapes, archivage conditions
- **OfferService** : CRUD offres avec revisions et négociation
- **TenantScopeService** : multi-tenant (solo agent vs organisation)
- **AutomationExecutorService** : exécution automatisations (emails, tâches)
- **PdfExportService** : génération PDF transactions

### Middleware clés (10 total)
- **auth** : session cookie HTTP-only
- **txPermission** : résolution rôle (owner > admin > editor > viewer)
- **planLimit** : soft limit avec grace period 7 jours
- **admin / superadmin** : protection routes admin

### Routes
~80 endpoints organisés : public → authenticated → admin → superadmin

---

## 8. Frontend — Architecture résumée

### Pages (30 total)
- **Public** : Landing, Pricing, Privacy, Terms, Contact, Login, Register, ForgotPassword, VerifyEmail, AdminLogin
- **Core** : Dashboard, Clients, ClientDetails, Transactions, TransactionDetail, EditTransaction, ExportShare, Permissions, Settings, Account, Onboarding
- **Admin** : AdminDashboard, AdminSubscribers, AdminActivity, AdminSystem, AdminPlans

### Composants transaction (57 total)
Couvrent l'intégralité du cycle de vie :
- Workflow : StepProgressBar, WorkflowTimeline, VerticalTimeline, ActionZone, ValidateStepModal
- Conditions : ConditionCard, ConditionsTab, ConditionValidationModal, EscapeConfirmationModal, EvidenceUploader
- Offres : OffersPanel, AcceptOfferModal, CreateOfferModal
- Documents : DocumentsSection, DocumentStatusBar, UploadDocumentModal, DocumentProofModal, DocumentVersionModal
- Parties : PartiesCard, PartiesModal
- Collaboration : MembersPanel, ExportSharePanel

### Patterns techniques
- **State** : TanStack Query (server state) + useState (UI state)
- **API** : `frontend/src/api/*.api.ts` avec helper `http`
- **Styling** : Tailwind 4, responsive mobile-first
- **i18n** : react-i18next, ~500+ clés FR/EN
- **Auth** : session cookie, ProtectedRoute guard

---

## 9. Décisions FINTRAC (validées 12 fév — Party Mode)

Le module FINTRAC a été planifié et validé par l'équipe en Party Mode. Spécification complète : `_bmad-output/fintrac-spec.md`

### Décisions clés

| # | Décision | Détail |
|---|----------|--------|
| D-FINTRAC-01 | Étape déclencheur | `firm-pending` (slug exact), blocking |
| D-FINTRAC-02 | Niveau | `blocking` — obligation légale, pas d'escape possible |
| D-FINTRAC-03 | Granularité | 1 condition FINTRAC par buyer (purchase) ou seller (sale) |
| D-FINTRAC-04 | Modèle dédié | `FintracRecord` (table `fintrac_records`) — pas sur TransactionParty |
| D-FINTRAC-05 | Preuve obligatoire | Min 1 document `identity` comme evidence pour résoudre |
| D-FINTRAC-06 | Override autoConditions | FINTRAC toujours créé, même si `autoConditionsEnabled=false` |
| D-FINTRAC-07 | UX hybride | Données sur FintracRecord, action dans le flow transaction (modale) |

### Architecture

- Nouveau modèle : `FintracRecord` (transactionId, partyId, champs identité, verifiedAt/By)
- Nouveau service : `FintracService` (onStepEnter, onPartyAdded, onPartyRemoved, isCompliant, complete)
- Nouveau controller + routes : GET/PATCH `/api/transactions/:id/fintrac`
- Nouveau composant : `FintracComplianceModal.tsx`
- Section PDF : "Conformité FINTRAC" ajoutée à l'export existant

### Cas limites validés

- Buyer ajouté après firm-pending → auto-création condition FINTRAC
- Buyer retiré → auto-archive condition
- 0 buyers à firm-pending → rien créé, auto-création dès ajout
- autoConditionsEnabled=false → FINTRAC créé quand même (conformité > préférences)
- Pas d'escape/skip possible sur conditions FINTRAC

---

## 10. Recommandations (pour discussion)

1. **Mettre à jour `project-context.md`** — pricing 4 plans, Phase C, M10/M11, FINTRAC ✅ FAIT
2. **Mettre à jour le PRD** — marquer D40/D41/D42/D45 comme FAIT, retirer mentions MLS
3. **Corriger les epics** — annoter que AR12 (Sheet pattern) a été inversé par Phase C
4. **Audit conformité M05/M12** — vérifier si le code match les maquettes HTML
5. **Résoudre tech debt** — 4 items du 4 fév (migrations, N+1, ReminderService, tests)
6. **Sprint 2 conditions** — prochaine priorité fonctionnelle (lock profil après step 1)
7. **README** — nettoyer les sections périmées (features FINTRAC inexistantes, MLS retiré)
8. **Landing page (H1)** — finaliser le hero et construire section par section

---

## 10. Commits récents (référence)

| Hash | Description |
|------|-------------|
| 5d37dc4 | docs: suivi M08 — audit conformité + status final 100% |
| fe3d269 | fix(M08): 6 écarts maquette corrigés — conformité 100% |
| 3c23012 | feat(M08): étape 5+6 — câblage DocumentsSection + modales |
| bd874b9 | feat(M08): étape 4 — DocumentVersionModal |
| 6de69f2 | feat(M08): étape 3 — DocumentProofModal |
| 49ab4d7 | Sprint 1 conditions pipeline complet |
| 2693e12 | Phase A : StatusBar + Drawer + câblage |
| 8078e18 | Backend : retirer MLS |
| 0c6ea8e | Page edit complète — 3 onglets + sidebar + 5 états |
| 2c267ea | i18n FR/EN complet |
