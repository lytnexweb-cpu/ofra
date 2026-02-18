# OFRA Session Log

> Ce fichier DOIT être mis à jour à chaque session pour ne jamais perdre le contexte.

---

## Session 2026-02-17b (session 6 — Dashboard Agent + Rail Navigation)

**Date**: 2026-02-17
**Admin**: Sam
**Agents actifs**: Claude Code + Party Mode (John, Sally, Winston, Paige)

### Objectif

Définir et maquetter un deuxième dashboard "Mon espace agent" accessible via un rail de navigation vertical à droite.

### Décisions prises

**Voir document complet** : `_bmad-output/decisions/D36-dashboard-agent-rail-nav.md`

1. **Deux dashboards distincts** : Portefeuille (transactions/urgences/offres/pipeline) + Mon espace (stats agent/commissions/performance)
2. **Rail vertical à droite** : fixe, 2 icônes (📁 Portefeuille / 👤 Mon espace), tabs en mobile
3. **4 zones dashboard agent** : En-tête agent, KPIs performance, Revenus & Objectifs, Activité récente

### Maquettes

| Fichier | Statut |
|---------|--------|
| `maquettes/dashboard-v2-mockup.html` | ✅ Validée (dashboard Portefeuille) |
| `maquettes/dashboard-agent-mockup.html` | ❌ Créée mais rejetée par Sam ("éclatée") — à refaire |

### Ce qui reste à faire (prochaine session)

1. **Refaire la maquette agent** avec Sam — design interactif, pas en autonomie
2. Spec technique backend (`GET /api/dashboard/agent-stats`)
3. Implémenter le rail de navigation droit
4. Implémenter les deux dashboards

### Notes

- Sam avait perdu une longue session de discussion sur ce sujet (connexion perdue)
- Les décisions de structure (2 dashboards, rail, contenu 4 zones) ont été reconstruites et validées
- Le design visuel de la maquette agent ne convient pas — Sally doit retravailler ÇA AVEC Sam

---

## Session 2026-02-17 (session 5 — Bloc 8 Offres intelligentes)

**Date**: 2026-02-17
**Admin**: Sam
**Agents actifs**: Claude Code + Party Mode (Paige, Bob, Mary)

### Objectif

Implémenter le Bloc 8 « Offres intelligentes » (Sprint A + Sprint B) et mettre à jour le PRD.

### Réalisations

#### Bloc 8 — Sprint A : Backend + PartyPicker

| Fichier | Action | Description |
|---------|--------|-------------|
| `backend/database/migrations/1780000000001_add_party_fields_to_offers.ts` | NEW | Migration : `buyer_party_id`, `seller_party_id`, `initial_direction` sur offers |
| `backend/app/models/offer.ts` | EDIT | 3 colonnes + 2 `@belongsTo` TransactionParty |
| `backend/app/services/offer_service.ts` | EDIT | createOffer persiste parties, acceptOffer auto-populate depuis dernière revision, getOffers/getAcceptedOffer preload buyerParty/sellerParty |
| `backend/app/validators/offer_validator.ts` | EDIT | `buyerPartyId`/`sellerPartyId` optionnels |
| `backend/app/controllers/offers_controller.ts` | EDIT | Pass-through nouveaux champs dans store() |
| `frontend/src/api/transactions.api.ts` | EDIT | Interface Offer : buyerPartyId, sellerPartyId, initialDirection, buyerParty?, sellerParty? |
| `frontend/src/api/offers.api.ts` | EDIT | CreateOfferRequest : buyerPartyId?, sellerPartyId? |
| `frontend/src/components/transaction/PartyPicker.tsx` | NEW | Dropdown + inline create form pour sélection buyer/seller |
| `frontend/src/components/transaction/CreateOfferModal.tsx` | EDIT | 2 PartyPickers intégrés, pre-populate en mode contre-offre |

#### Bloc 8 — Sprint B : Thread + Comparison

| Fichier | Action | Description |
|---------|--------|-------------|
| `frontend/src/components/transaction/NegotiationThread.tsx` | NEW | Fil vertical : toutes révisions, deltas prix, direction arrows, compact/expand |
| `frontend/src/components/transaction/OfferComparison.tsx` | NEW | Table side-by-side 2-4 offres, highlight best/worst, CTA accepter |
| `frontend/src/components/transaction/OffersPanel.tsx` | EDIT | NegotiationThread dans active+accepted cards, bouton Compare, OfferComparison panel |
| `frontend/src/components/transaction/AcceptOfferModal.tsx` | EDIT | Affiche buyerParty/sellerParty dans résumé d'acceptation |
| `frontend/src/i18n/locales/fr/common.json` | EDIT | Clés Sprint A + B (addOffer.*, offers.comparison.*, offers.thread.*, transaction.acceptOffer.*) |
| `frontend/src/i18n/locales/en/common.json` | EDIT | Idem EN |
| `frontend/src/i18n/__tests__/key-parity.test.ts` | EDIT | Exceptions cognates (Conditions, Inspection, noValue, parties) |

#### Vérification

- Backend `tsc --noEmit` : 0 erreurs
- Frontend `tsc --noEmit` : 0 erreurs
- Frontend tests : **33 fichiers, 283 tests — tous verts**
- i18n parity : **4/4 tests verts**

#### PRD v2.5

- Bloc 8 : `❌ TODO` → `✅ DONE`
- Description technique mise à jour (suppression `parentOfferId`, description réelle)
- Phase 1 tableau : ajout ligne Offres intelligentes ✅
- Gantt mis à jour : 6/8 blocs DONE
- Emails essentiels corrigé : `❌ TODO` → `✅ Codé`

### État du projet post-session

| Bloc | Statut |
|------|--------|
| 1. D53 Backend (Trial) | ✅ DONE |
| 2. D53 Frontend (Trial) | ✅ DONE |
| 3. Landing Page | ✅ DONE |
| 4. Pricing Page | ✅ DONE |
| 5. Legal (CGU/Privacy) | ❌ TODO |
| 6. Emails essentiels | ✅ DONE |
| 7. Stripe | ❌ TODO |
| 8. Offres intelligentes | ✅ DONE |

**Score : 6/8 blocs DONE. Reste : Legal + Stripe.**

---

## Session 2026-02-13 (session 4 — audit complet + tests + feature gates)

**Date**: 2026-02-13
**Admin**: Sam
**Agents actifs**: Tous (Party Mode)

### Objectif

1. Audit complet du projet (backend, frontend, docs, sécurité, feature gates)
2. Mise à jour PRD v2.0 → v2.1
3. Nettoyage debug code
4. Fix de tous les tests frontend et backend
5. Fix FINTRAC identity gate (D52)

### Réalisations

#### 1. Audit Feature Gates — 11/11 implémentées

| Gate | Plan | Statut |
|------|------|--------|
| TX actives limit | Par plan | ✅ + grace 7j |
| Condition Packs | Solo+ | ✅ |
| Evidence/Preuves | Pro+ | ✅ (3 endpoints) |
| Audit History | Pro+ | ✅ |
| PDF Exports/mois | Starter=3 | ✅ |
| Share Links/TX | Starter=1 | ✅ |
| FINTRAC identity | Solo+ | ✅ (D52 — fixé cette session) |
| Frontend hooks | Tous | ✅ useSubscription + SoftLimitBanner |
| Storage quota | Par plan | 🟡 Tracking only (Phase 2) |
| Users per account | 1/1/1/3 | 🟡 Schema only (Agence Phase 2) |

#### 2. Fix FINTRAC Gate (D52)

- `fintrac_controller.ts:complete()` — ajout `PlanService.meetsMinimum('solo')` gate
- `fintrac_controller.ts:resolve()` — ajout `PlanService.meetsMinimum('solo')` gate
- Import `PlanService` ajouté

#### 3. Tests — tous verts

**Backend : 180/180 PASSED** (était 169/180)
- 7 tests multi-tenancy : 404 → 403 (meilleure sécurité)
- Factory `createUser` : ajout `emailVerified: true`
- Test register : `WelcomeMail` → `EmailVerificationMail`
- OfferAcceptedMail : subject override corrigé

**Frontend : 283/283 PASSED** (était 247/291)
- `ConditionsTab.tsx` : fix temporal dead zone (variables avant useMemo)
- `NotesSection.tsx` : ajout aria-label bouton submit
- `ActionZone.tsx` : ajout aria-label bouton MoreVertical
- `ConditionValidationModal.tsx` : ajout role="dialog" + aria-modal
- 5 fichiers test réécrits (DashboardPage, TransactionDetailPage, ConditionCard, ActionZone, LoginPage)
- 1 fichier test supprimé (CreateTransactionModal — composant retiré)
- key-parity : 68+ cognates FR/EN ajoutés à la allowlist

#### 4. Documentation

- PRD mis à jour v2.1 : changelog, D52 ajouté, §2.5 Feature Gates ajouté
- `i18n/index.ts` : debug: true → false
- `OnboardingPage.tsx` : 3 console.log retirés
- `docs/pricing-strategy.md` et `docs/roadmap.md` supprimés (PÉRIMÉ → SUPPRIMÉ)

#### 5. Bugs corrigés

| Bug | Fichier | Impact |
|-----|---------|--------|
| Temporal Dead Zone | `ConditionsTab.tsx` | `steps` utilisé avant déclaration — crash runtime |
| A11y violations | NotesSection, ActionZone, ConditionCard | Boutons/inputs sans texte accessible |
| Subject override ignoré | `offer_accepted_mail.ts` | `config.subject` pas appliqué par automation |
| FINTRAC gate manquant | `fintrac_controller.ts` | Starter pouvait accéder FINTRAC identity (D52) |

#### 6. Décision D53 — Trial 30j + Prix Garanti à Vie (Party Mode)

**Modèle validé par Sam :**
- **Trial 30 jours** : inscription sans CC, 1 TX, toutes features Pro
- **Soft wall J30-J33** : lecture seule + bandeau pricing
- **Hard wall J33+** : seule la page pricing accessible
- **Programme Fondateur simplifié** : plus de −20%/−30%, juste le prix du jour garanti à vie
- **Pitch** : "Votre prix ne bougera jamais. Quand nos prix augmenteront, le vôtre restera."
- Champs DB ajoutés au modèle : `trial_ends_at`, `trial_tx_used`
- PRD mis à jour : §2.3, §2.4, §3.5, D53 dans index décisions

### Prochaines étapes

1. **Stripe** — dernière étape avant lancement
2. **D53 backend** — migration trial fields + logique PlanLimitMiddleware
3. Landing page publique
4. E2E tests (Sprint 4)

---

## Session 2026-02-12 (session 3 — emails & notifications)

**Date**: 2026-02-12
**Admin**: Sam
**Agents actifs**: Tous (Party Mode)

### Objectif

1. Pages auth (Register/Login) — redesign split-screen
2. Email verification
3. Audit complet système email
4. Spec emails + notifications in-app (cloche)

### Réalisations

#### 1. Pages Auth — Redesign split-screen premium

**RegisterPage.tsx** — réécriture complète :
- Split-screen : left panel (brand bleu #1E3A5F, logo blanc, tagline) + right panel (formulaire sobre SaaS)
- 8 champs : fullName, email, phone, address, city, province (dropdown NB défaut), password, confirmPassword
- Migration `1776000000001_add_address_fields_to_users.ts` (address, city, province_code)
- Modèle User + validator + controller + API type mis à jour

**LoginPage.tsx** — réécriture complète :
- Même split-screen que RegisterPage
- Gère erreur `E_EMAIL_NOT_VERIFIED`

**AdminLoginPage.tsx** — NOUVEAU :
- Login simple centré (card), icône Shield, pas de liens register
- Route `/admin/login`, AdminRoute redirige vers `/admin/login`

**OfraLogo** — variant `white` ajouté :
- Maison blanche + fenêtre bleue pour fonds sombres
- Corrige le bug "bleu sur bleu invisible"

#### 2. Email Verification

- Migration `1776000000002_add_email_verification_to_users.ts`
- `EmailVerificationMail.ts` — NOUVEAU (FR/EN, layout brandé)
- AuthController : register → envoie token, login → bloque non-vérifié (admins bypass)
- `verifyEmail()` + `resendVerification()` endpoints
- `VerifyEmailPage.tsx` — NOUVEAU (4 états : loading, success, error, no-token)
- Router : `/verify-email` route ajoutée
- Token SHA256 hashé en DB, 24h expiry, anti-enumeration

#### 3. Audit complet emails — Brand Consistency

**10 emails existants** audités :
- 10/10 utilisent `wrapEmailContent()` ✅
- 10/10 utilisent `OFRA_COLORS` ✅
- 10/10 bilingues FR/EN ✅
- Typo Inter/Outfit cohérente ✅

**Corrections appliquées** :
- **P0** : `OFRA_LOGO_SVG` dans `email_layout.ts` — maison `#1E3A5F` → `#FFFFFF` (même fix que frontend)
- **P1** : `EmailVerificationMail` — traductions inline migrées vers `email_translations.ts` centralisé

#### 4. Spec Emails & Notifications — Consigné

**Document** : `_bmad-output/specs/email-notifications-spec.md`

**Inventaire email** :
- 10 existants (auth, automation, reminders)
- 13 nouveaux à créer (collab, offres, étapes, conditions, transaction)
- **Total : 23 emails**

**Système de cloche (notifications in-app)** :
- Centre de contrôle du courtier :
  - Alertes : "Deadline dans 48h, consultez votre courriel"
  - Confirmations : "Étape complétée, courriel envoyé à Me Tremblay et Marie Dupont"
- Table `notifications` (user_id, type, title, body, icon, severity, link, email_recipients, read_at)
- API : 4 routes (list, unread-count, mark-read, mark-all-read)
- UI : badge rouge sur cloche existante + dropdown Radix Popover
- Polling 60s (pas de WebSocket v1)

**Matrice destinataires** (décision Party Mode) :
- Courtier reçoit : rappels (conditions, deadlines, offres) + confirmations d'envoi
- Parties reçoivent : informations d'avancement (étapes, offres, conditions)
- Langue = langue du courtier propriétaire de la transaction

**13 nouveaux emails en 4 batches** :
1. Collab (3) : MemberInvitation, PartyAdded, ShareLink
2. Offres (4) : Submitted, Countered, Rejected, Expired
3. Conditions (4) : StepAdvanced, ConditionResolved, BlockingAlert, ConditionAssigned
4. Transaction (2) : Cancelled, Recap

#### 5. Tests RED écrits (Murat)

| Fichier | Tests | Couvre |
|---------|-------|-------|
| `backend/tests/functional/notifications.spec.ts` | 12 | API CRUD notifications |
| `backend/tests/unit/notification_service.spec.ts` | 10 | Service + twin pattern |
| `frontend/src/components/__tests__/NotificationBell.test.tsx` | 8 | Composant cloche UI |

**Total : 30 tests RED** — Barry les passe green pendant l'implémentation.

#### 6. Phase 1 — Backend Notification Infrastructure (DONE)

**Migration** : `1777000000002_create_notifications_table.ts`
- Table `notifications` : id, user_id (FK), transaction_id (FK nullable), type, title, body, icon, severity, link, email_recipients (text[]), read_at, timestamps
- Index : `idx_notifications_user_unread`, `idx_notifications_user_created`

**Fichiers créés** :
| Fichier | Description |
|---------|-------------|
| `backend/app/models/notification.ts` | Lucid model, 12 types, 3 severities (info/warning/urgent) |
| `backend/app/services/notification_service.ts` | `notify()`, `unreadCount()`, `list()`, `markRead()`, `markAllRead()` |
| `backend/app/controllers/notifications_controller.ts` | 4 endpoints (GET list, GET count, PATCH read, POST read-all) |

**Routes ajoutées** dans `backend/start/routes.ts` (groupe auth) :
- `GET /api/notifications` — liste paginée (unread first)
- `GET /api/notifications/unread-count` — compteur non-lus
- `PATCH /api/notifications/:id/read` — marquer lu (ownership enforced)
- `POST /api/notifications/read-all` — tout marquer lu

**Tests** : 22/22 GREEN
- 11 unit (`notification_service.spec.ts`)
- 11 functional (`notifications.spec.ts` — corrigé `withAuth()` pattern)

**Fixes pendant implémentation** :
- `assert.isNull` → `assert.notExists` (Lucid DateTime = undefined, pas null)
- FK violation `transactionId: 1` → créer vraie transaction via WorkflowEngineService
- `.use(authenticateAs())` → `withAuth(request, userId)` (pattern du projet)

#### 7. Phase 2 — Frontend NotificationBell (DONE)

**Fichiers créés** :
| Fichier | Description |
|---------|-------------|
| `frontend/src/api/notifications.api.ts` | API layer (list, unreadCount, markRead, markAllRead) |
| `frontend/src/components/NotificationBell.tsx` | Bell + Radix DropdownMenu, badge rouge, polling 60s |

**Layout.tsx modifié** :
- Import `BellIcon` retiré (plus utilisé directement)
- Import `NotificationBell` ajouté
- Placeholder bell mobile (ligne 189-194) → `<NotificationBell />`
- Placeholder bell desktop (ligne 225-230) → `<NotificationBell />`

**i18n ajouté** : `notificationBell.markAllRead`, `notificationBell.empty`, `notificationBell.emailSentTo` (FR+EN)

**Tests** : 9/9 GREEN (`NotificationBell.test.tsx`)
- Fix : mock fetch manquait `headers: { get: () => null }` pour `apiRequest`

**Fonctionnalités** :
- Badge rouge avec count (cap 9+), masqué si 0
- Dropdown Radix avec liste de notifications
- Unread first (dot bleu), severity urgent (bg-red-50, data-severity)
- Email recipients affichés ("Courriel envoyé à X, Y")
- Timestamp relatif via `formatDistanceToNow`
- Mark read individuel (click) + mark all read (bouton)
- Navigation vers `link` au click

#### 8. Phase 3 — Batch 1 Emails Collab + Twins (DONE)

**3 emails créés** :
| Fichier | Trigger | Destinataire |
|---------|---------|-------------|
| `backend/app/mails/member_invitation_mail.ts` | Inviter un membre | Le membre invité |
| `backend/app/mails/party_added_mail.ts` | Ajouter une partie | La partie (si email) |
| `backend/app/mails/share_link_mail.ts` | Créer un lien de partage | Le courtier |

**Traductions ajoutées** dans `email_translations.ts` : `memberInvitation`, `partyAdded`, `shareLink` (FR+EN)

**Controllers modifiés** (email + notification twin) :
| Controller | Méthode | Email | Notification twin |
|-----------|---------|-------|-------------------|
| `transaction_members_controller.ts` | `store()` | MemberInvitationMail → membre | "Invitation envoyée à X" |
| `transaction_parties_controller.ts` | `store()` | PartyAddedMail → partie | "Partie ajoutée: X" |
| `transaction_share_links_controller.ts` | `store()` | ShareLinkMail → courtier | "Lien de partage créé" |

**Pattern twin** : Chaque trigger crée (1) un email aux destinataires + (2) une notification bell pour le courtier confirmant l'envoi. Tous les erreurs sont non-bloquantes (`try/catch` + logger).

#### 9. Phase 4 — Batch 2 Emails Offres + Twins (DONE)

**4 emails créés** :
| Fichier | Trigger | Destinataire |
|---------|---------|-------------|
| `backend/app/mails/offer_submitted_mail.ts` | Soumettre une offre | Le courtier (confirmation) |
| `backend/app/mails/offer_countered_mail.ts` | Ajouter une contre-offre | Le courtier (confirmation) |
| `backend/app/mails/offer_rejected_mail.ts` | Refuser une offre | Le courtier (confirmation) |
| `backend/app/mails/offer_withdrawn_mail.ts` | Retirer une offre | Le courtier (confirmation) |

**Traductions ajoutées** dans `email_translations.ts` : `offerSubmitted`, `offerCountered`, `offerRejected`, `offerWithdrawn` (FR+EN)

**Controller modifié** (`offers_controller.ts`) — 5 méthodes câblées :
| Méthode | Email | Notification twin |
|---------|-------|-------------------|
| `store()` | OfferSubmittedMail → courtier | "Offre soumise: $X" (prix formaté CAD) |
| `addRevision()` | OfferCounteredMail → courtier | "Contre-offre #N: $X" |
| `accept()` | _(existant via automation)_ | "Offre acceptée" |
| `reject()` | OfferRejectedMail → courtier | "Offre refusée" |
| `withdraw()` | OfferWithdrawnMail → courtier | "Offre retirée" |

**Détails techniques** :
- Prix formaté via `Intl.NumberFormat` (fr-CA/en-CA, currency CAD)
- `body: undefined` (pas `null`) — type `NotifyOptions.body` est `string | undefined`
- Imports ajoutés : `mail`, `NotificationService`, `logger`, 4 mail classes

#### 10. Phase 5 — Batch 3 Emails Conditions + Twins (DONE)

**4 emails créés** :
| Fichier | Trigger | Destinataire |
|---------|---------|-------------|
| `backend/app/mails/step_advanced_mail.ts` | Avancer une étape | Le courtier (confirmation) |
| `backend/app/mails/condition_resolved_mail.ts` | Résoudre une condition | Le courtier (confirmation) |
| `backend/app/mails/blocking_condition_alert_mail.ts` | Créer condition bloquante | Le courtier (alerte) |
| `backend/app/mails/condition_assigned_mail.ts` | Créer une condition | Le courtier (confirmation) |

**Traductions ajoutées** dans `email_translations.ts` : `stepAdvanced`, `conditionResolved`, `blockingConditionAlert`, `conditionAssigned` (FR+EN)

**Controllers modifiés** :
| Controller | Méthode | Email | Notification twin |
|-----------|---------|-------|-------------------|
| `transactions_controller.ts` | `advanceStep()` | StepAdvancedMail → courtier | "Étape avancée: X" |
| `transactions_controller.ts` | `skipStep()` | _(aucun)_ | "Étape sautée → X" |
| `conditions_controller.ts` | `store()` blocking | BlockingConditionAlertMail → courtier | "Condition ajoutée: X" (warning) |
| `conditions_controller.ts` | `store()` non-blocking | _(aucun)_ | "Condition ajoutée: X" (info) |
| `conditions_controller.ts` | `complete()` | _(aucun)_ | "Condition complétée: X" |
| `conditions_controller.ts` | `resolve()` | ConditionResolvedMail → courtier | "Condition résolue: X" |

**Fix technique** : `await mail.send()` → `mail.send().catch()` (fire-and-forget) pour éviter timeout en test (SMTP non configuré). Le pattern `await` bloquait les tests fonctionnels 30s.

#### 11. Phase 6 — Batch 4 Emails Transaction + Twins (DONE)

**2 emails créés** :
| Fichier | Trigger | Destinataire |
|---------|---------|-------------|
| `backend/app/mails/transaction_cancelled_mail.ts` | Annuler une transaction | Le courtier (confirmation) |
| `backend/app/mails/transaction_recap_mail.ts` | Envoyer récapitulatif | Les destinataires choisis |

**Traductions ajoutées** dans `email_translations.ts` : `transactionCancelled`, `transactionRecap` (FR+EN)

**Controllers modifiés** :
| Controller | Méthode | Email | Notification twin |
|-----------|---------|-------|-------------------|
| `transactions_controller.ts` | `cancel()` | TransactionCancelledMail → courtier | "Transaction annulée" (warning) |
| `export_controller.ts` | `email()` | TransactionRecapMail → destinataires | "Récapitulatif envoyé" (info) |

**Détails techniques** :
- TransactionCancelledMail : bordure rouge, raison d'annulation, CTA vers liste transactions
- TransactionRecapMail : client, propriété, statut, prix (Intl.NumberFormat CAD), date fermeture, message personnalisé
- Export email : boucle fire-and-forget sur chaque destinataire + notification twin unique pour le courtier

#### 12. Phase 7 — Rétrofit Notifications sur Emails Existants (DONE)

**7 emails existants** câblés avec notification twin :

| Email | Service | Notification twin |
|-------|---------|-------------------|
| OfferAcceptedMail | `automation_executor_service.ts` | "Offre acceptée envoyée → client@email" (info) |
| FirmConfirmedMail | `automation_executor_service.ts` | "Confirmation ferme envoyée → client@email" (info) |
| FintracReminderMail | `automation_executor_service.ts` | "Rappel FINTRAC envoyé → client@email" (info) |
| CelebrationMail | `automation_executor_service.ts` | "Célébration envoyée → client@email" (info) |
| GoogleReviewReminderMail | `automation_executor_service.ts` | "Rappel avis Google envoyé → client@email" (info) |
| DeadlineWarningMail | `reminder_service.ts` | "Deadline dans 48h: [condition]" (urgent) |
| DailyDigestMail | `reminder_service.ts` | "Résumé quotidien: X en retard, Y à venir" (warning si overdue) |

**3 emails auth exclus** (pas de session user, pas de contexte transaction) :
- EmailVerificationMail, PasswordResetMail, WelcomeMail

**Détails techniques** :
- `automationNotifMeta` : map `templateRef → {icon, titleFr, titleEn}` pour les 5 emails automation
- Langue détectée via `user.language?.substring(0, 2) || 'fr'`
- Automation : charge `User.find(transaction.ownerUserId)` pour langue du courtier
- DailyDigest : severity `warning` si conditions en retard, `info` sinon
- DeadlineWarning : severity `urgent` (48h warning)

#### 13. Récapitulatif Final — Emails & Notifications

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1 | Migration notifications + Model + Service + Controller + Routes | ✅ DONE |
| 2 | Composant NotificationBell + API frontend + Layout integration | ✅ DONE |
| 3 | Batch 1 emails (Collab: 3) + traductions + notifications twin | ✅ DONE |
| 4 | Batch 2 emails (Offres: 4) + traductions + notifications twin | ✅ DONE |
| 5 | Batch 3 emails (Conditions: 4) + traductions + notifications twin | ✅ DONE |
| 6 | Batch 4 emails (Transaction: 2) + traductions + notifications twin | ✅ DONE |
| 7 | Rétrofit notifications sur les 7 emails existants éligibles | ✅ DONE |

**Tests totaux** : 31 GREEN (11 unit + 11 functional + 9 frontend)
**Emails totaux** : 23 (10 existants + 13 nouveaux) — tous avec notification twin (sauf 3 auth)

---

## Session 2026-02-12 (session 2 — audit & FINTRAC)

**Date**: 2026-02-12
**Admin**: Sam
**Agents actifs**: Tous (Party Mode)

### Objectif

1. Audit complet du projet (docs vs code réel)
2. Planification module FINTRAC
3. Landing page H1 (hero — en cours)

### Réalisations

1. **Audit méthodique approfondi** — 4 agents en parallèle : docs, frontend, backend, maquettes
   - Document : `_bmad-output/audit-complet-12-fev-2026.md`
   - 14 maquettes inventoriées, ~12 implémentées, 4 auditées (M08-M11)
   - 6 écarts critiques identifiés (Sheet/Dialog, pricing, PRD decisions, tech debt)

2. **Module FINTRAC — spec validée** (Party Mode unanime)
   - Document : `_bmad-output/fintrac-spec.md`
   - 7 décisions clés (D-FINTRAC-01 à D-FINTRAC-07)
   - Architecture : FintracRecord model + FintracService + FintracComplianceModal
   - Blocking à `firm-pending`, 1 condition par buyer/seller, override autoConditions
   - UX hybride : données sur FintracRecord, action dans le flow transaction
   - Cas limites : late party, party retiré, 0 buyers, escape interdit

3. **Documentation mise à jour**
   - `project-context.md` : MLS retiré, FINTRAC spec référencée, M10/M11 marqués Done, roadmap mise à jour
   - `audit-complet-12-fev-2026.md` : décisions FINTRAC ajoutées (section 9)

### MLS — Décision définitive
- MLS NON utilisé au Nouveau-Brunswick
- Colonne `mls_number` supprimée (commit 8078e18)
- Aucune intégration MLS/PID prévue pour V1
- DocuSign écarté (non pertinent NB)

---

## Session 2026-02-11 (précédente)

**Date**: 2026-02-11
**Admin**: Sam
**Agents actifs**: Tous (Party Mode activé pour discussions)

### Objectif

1. Sprint 1 du pipeline conditions/profil — refactor complet
2. Corriger 4 bugs rapportés par Sam
3. Implémenter l'offer gate (bloquer l'avancement sans offre acceptée)
4. Maquette 08 — Documents & Preuves (6 commits, 100% conforme)
5. Maquette 09 — Créer/Éditer Transaction (Phase A + B + C)
6. Phase C — UX Overhaul (zéro Sheet desktop, documents inline, Dialogs centrés)
7. Consigner tout avant perte de contexte

### Contexte — Plan en 4 Sprints (validé avec ChatGPT)

Le refactor conditions/profil a été planifié en 4 sprints :

- **Sprint 1** : Flag `autoConditionsEnabled`, profil propriété atomique à la création, offer gate
- **Sprint 2** : Verrouillage backend profil+flag après étape 1, toggle "charger conditions prochaine étape" dans ValidateStepModal
- **Sprint 3** : Override admin avec type-to-confirm + recalcul conditions + audit log
- **Sprint 4** : Tests E2E, cas limites, polish

### Travail Accompli

#### 1. Pipeline autoConditionsEnabled (Sprint 1 - Complété)

**Backend (5 fichiers)**

| Fichier | Modification |
|---------|-------------|
| `backend/database/migrations/1774000000011_add_auto_conditions_enabled_to_transactions.ts` | **NOUVEAU** — Ajoute colonne `auto_conditions_enabled BOOLEAN NOT NULL DEFAULT TRUE` |
| `backend/app/models/transaction.ts` | Ajout `autoConditionsEnabled` column declaration |
| `backend/app/validators/transaction_validator.ts` | Ajout `autoConditionsEnabled` + objet `profile` (propertyType, propertyContext, isFinanced) |
| `backend/app/controllers/transactions_controller.ts` | `store()` lit le flag et passe `profile` + `autoConditionsEnabled` au service |
| `backend/app/services/workflow_engine_service.ts` | `createTransactionFromTemplate` respecte le flag ; `advanceStep`/`skipStep` vérifient `transaction.autoConditionsEnabled` avant de créer des conditions |

**Frontend (6 fichiers)**

| Fichier | Modification |
|---------|-------------|
| `frontend/src/api/transactions.api.ts` | Ajout `autoConditionsEnabled` + `profile` dans `CreateTransactionRequest` |
| `frontend/src/components/CreateTransactionModal.tsx` | 3 dropdowns profil propriété — **SUPPRIMÉ en Phase C (C5), remplacé par EditTransactionPage** |
| `frontend/src/components/transaction/PropertyProfileCard.tsx` | Verrouillé après étape 1 (icône Lock + "Verrouillé") |
| `frontend/src/pages/TransactionDetailPage.tsx` | Passe `currentStepOrder` à PropertyProfileCard |
| `frontend/src/i18n/locales/fr/common.json` | Clés i18n profil propriété, conditions auto, verrouillage |
| `frontend/src/i18n/locales/en/common.json` | Idem en anglais |

**Comportement** :
- Checkbox "Générer automatiquement les conditions" dans le formulaire de création
- Si activé + profil fourni → conditions générées automatiquement via packs
- Si désactivé → aucune condition auto, l'agent ajoute manuellement
- Profil verrouillé visuellement après étape 1 (icône cadenas)

#### 2. Offer Gate (Bloquer avancement sans offre acceptée)

**Backend**

| Fichier | Modification |
|---------|-------------|
| `backend/app/services/workflow_engine_service.ts` | Guard dans `advanceStep` : vérifie offre acceptée sur slug `offer-submitted` |
| `backend/app/controllers/conditions_controller.ts` | `advanceCheck()` enrichi avec `requiresAcceptedOffer` + `hasAcceptedOffer` + `slug` |

**Frontend**

| Fichier | Modification |
|---------|-------------|
| `frontend/src/api/conditions.api.ts` | Ajout types `requiresAcceptedOffer`, `hasAcceptedOffer`, `slug` dans `AdvanceCheckResult` |
| `frontend/src/components/transaction/ValidateStepModal.tsx` | **NOUVEAU** — État bloqué ambre avec CTA "Voir les offres" qui scroll vers OffersPanel |
| `frontend/src/components/transaction/OffersPanel.tsx` | Ajout `id="offers-panel"` pour ancre de scroll |

**Comportement** :
- Sur l'étape `offer-submitted`, le backend refuse l'avancement si aucune offre n'est `accepted`
- Le frontend affiche un bandeau ambre avec message explicatif et bouton "Voir les offres"
- Le bouton ferme la modale et scroll smooth vers le panel des offres

**Bug corrigé** : Le slug en DB est `offer-submitted`, PAS `negotiation` ni `en-negociation`

#### 3. ValidateStepModal (Maquette 03)

| Fichier | Statut |
|---------|--------|
| `frontend/src/components/transaction/ValidateStepModal.tsx` | **NOUVEAU** — 3 états : conditions OK (vert), offer gate bloqué (ambre), conditions bloquantes (rouge) |
| `frontend/src/components/transaction/ActionZone.tsx` | Import ValidateStepModal, standardisation invalidation queries |

#### 4. PartiesCard

| Fichier | Statut |
|---------|--------|
| `frontend/src/components/transaction/PartiesCard.tsx` | **NOUVEAU** — Affichage inline des parties sur la page détail |
| `frontend/src/components/transaction/index.ts` | Export PartiesCard ajouté |
| `frontend/src/pages/TransactionDetailPage.tsx` | PartiesCard affiché entre PropertyProfileCard et OffersPanel |

#### 5. Maquette 08 — Documents & Preuves (100% conforme)

Suivi détaillé : `_bmad-output/maquette-08-suivi.md`

| Étape | Contenu | Commit |
|-------|---------|--------|
| 1 | État A — DocumentsSection liste par catégorie (réécriture) | 973c53c |
| 2 | État B+E — UploadDocumentModal + erreurs | a399d56 |
| 3 | État C — DocumentProofModal (preuve condition) | 6de69f2 |
| 4 | État D — DocumentVersionModal (historique versions) | bd874b9 |
| 5+6 | Câblage page detail + modales + i18n | 3c23012 |
| Audit | 6 écarts corrigés — conformité 100% | fe3d269 |

**Composants créés/réécrits** :
- `DocumentsSection.tsx` — réécriture complète (liste par catégorie, compteurs, badges)
- `UploadDocumentModal.tsx` — **NOUVEAU** (drop zone, catégories, tags, erreurs)
- `DocumentProofModal.tsx` — **NOUVEAU** (cycle de vie preuve, validation/refus)
- `DocumentVersionModal.tsx` — **NOUVEAU** (historique versions, journal activité)

#### 6. Maquette 09 — Créer/Éditer Transaction (Phase A + B + C)

Suivi détaillé : `_bmad-output/maquette-09-suivi.md`

**Phase A : Refactor Documents (StatusBar + Drawer)**

| Étape | Contenu | Commit |
|-------|---------|--------|
| A1 | DocumentStatusBar — compteurs cliquables (emerald/amber/red) | 2693e12 |
| A2 | DocumentsDrawer — Sheet latéral avec DocumentsSection compact | 2693e12 |
| A3 | Câblage page detail — StatusBar + Drawer | 2693e12 |

**Phase B : Page Create/Edit Transaction**

| Étape | Contenu | Commit |
|-------|---------|--------|
| B1 | Backend — retirer MLS (migration, model, validator, controller) | 8078e18 |
| B2-B8 | Page edit complète — 3 onglets + sidebar + 5 états | 0c6ea8e |
| B9 | i18n FR/EN complet (100+ clés) | 2c267ea |

**Phase C : UX Overhaul (validé Sally — hybride Murat)**

Problème : Les Sheet latéraux droits (Documents, Members, Export) combinés au menu vertical gauche créaient un effet "deux barres verticales" étouffant sur desktop.

| Étape | Décision | Commit |
|-------|----------|--------|
| C1 | Documents → section inline collapsible (drawer supprimé) | ddfc201 |
| C2 | MembersPanel → Dialog centré (max-w-2xl) | ddfc201 |
| C3 | ExportSharePanel → Dialog centré (max-w-md) | ddfc201 |
| C4 | Profil propriété → cartes icônes cliquables | ddfc201 |
| C5 | CreateTransactionModal **supprimé** → `/transactions/new` | ddfc201 |
| C6 | autoConditionsEnabled toggle dans page create/edit | ddfc201 |

**Fichiers supprimés** :
- `frontend/src/components/transaction/DocumentsDrawer.tsx`
- `frontend/src/components/CreateTransactionModal.tsx`

**Fichiers majeurs modifiés** :
- `EditTransactionPage.tsx` — dual mode create/edit, icon cards, autoConditions toggle
- `TransactionDetailPage.tsx` — documents inline collapsible, drawer retiré
- `MembersPanel.tsx` — Sheet → Dialog
- `ExportSharePanel.tsx` — Sheet → Dialog
- `TransactionsPage.tsx` — navigate au lieu de modal
- `router.tsx` — route `/transactions/new`

#### 7. Corrections de Bugs (4 bugs rapportés par Sam)

| Bug | Cause | Fix |
|-----|-------|-----|
| Profil non visible après création | Navigation conditionnelle (seulement si suggestConditions=true) | Toujours naviguer vers page détail |
| Profil reste modifiable après étape 1 | Pas de verrouillage | Ajout `currentStepOrder` prop + Lock icon quand > 1 |
| Packs conditions se chargent seuls à étape 4 | `advanceStep`/`skipStep` ignoraient le flag | Wrappé avec `if (transaction.autoConditionsEnabled)` |
| Parties pas visible | Seulement dans modale header | Créé PartiesCard inline sur page détail |

### Moteur de Conditions — État Opérationnel

- **52 templates** répartis en 4 packs :
  - Universal (s'applique à tous les profils)
  - Rural NB (propriétés rurales au N.-B.)
  - Condo NB (condos au N.-B.)
  - Financé NB (transactions financées au N.-B.)
- **Matching** via `appliesTo()` sur `TransactionProfile.toMatchObject()`
- **Anti-doublons** intégré (`existingTemplateIds` + `existingTitleKeys`)
- **Seeder** : `node ace db:seed` pour peupler les templates

### Commits de cette Session

| # | Hash | Description |
|---|------|-------------|
| 1 | 49ab4d7 | feat: Sprint 1 — autoConditionsEnabled pipeline, offer gate, PartiesCard, ValidateStepModal |
| 2 | 973c53c | feat(M08): étape 1 — DocumentsSection liste par catégorie |
| 3 | a399d56 | feat(M08): étape 2 — UploadDocumentModal (état B + état E erreurs) |
| 4 | 6de69f2 | feat(M08): étape 3 — DocumentProofModal (état C) |
| 5 | bd874b9 | feat(M08): étape 4 — DocumentVersionModal (état D) |
| 6 | 3c23012 | feat(M08): étape 5+6 — câblage DocumentsSection + modales |
| 7 | fe3d269 | fix(M08): 6 écarts maquette corrigés — conformité 100% |
| 8 | 5d37dc4 | docs: suivi M08 mis à jour |
| 9 | 2693e12 | feat(M08): refactor documents — StatusBar + Drawer |
| 10 | 06481fa | docs: suivi M09 — Phase A complétée |
| 11 | 8078e18 | feat(M09-B1): retirer MLS |
| 12 | 0c6ea8e | feat(M09-B2-B8): page edit transaction complète |
| 13 | 2c267ea | feat(M09-B9): i18n FR/EN complet |
| 14 | 6dd1a32 | docs: suivi M09 — Phase A+B complètes |
| 15 | 2106824 | feat(M09): bouton Modifier navigue vers /edit |
| 16 | ddfc201 | feat(M09-C): UX Overhaul — zéro Sheet desktop |

### Slugs Workflow (référence critique)

```
consultation → offer-submitted → offer-accepted → conditional-period → firm-pending → pre-closing → closing-day → post-closing
```

> **ATTENTION** : Le slug DB est `offer-submitted`, PAS `negotiation` ni `en-negociation`. Toujours vérifier les slugs en DB avant de coder des guards.

---

## Prochaine Session — REPRENDRE ICI

### PRIORITÉ 1 : Dashboard Agent "Mon espace" (D36)

**Document de référence** : `_bmad-output/decisions/D36-dashboard-agent-rail-nav.md`

**État** : Décisions validées, maquette rejetée — à refaire AVEC Sam.

**À faire** :
1. Refaire `maquettes/dashboard-agent-mockup.html` en design interactif avec Sam
2. Implémenter le rail de navigation vertical droit (`RightRail.tsx`)
3. Modifier `Layout.tsx` pour intégrer le rail
4. Créer endpoint backend `GET /api/dashboard/agent-stats`
5. Créer `DashboardAgent.tsx` (ou split `DashboardPage.tsx` en conteneur)
6. Implémenter le dashboard Portefeuille (maquette v2 validée)

**Maquette Portefeuille validée** : `maquettes/dashboard-v2-mockup.html` — 4 zones (KPIs, Offres, Urgences, Pipeline)

---

### Chantier COMPLÉTÉ : Emails & Notifications (7/7 phases)

**Spec** : `_bmad-output/specs/email-notifications-spec.md`
**Tests** : 31 GREEN (11 unit + 11 functional + 9 frontend)
**Emails** : 23 total (10 existants + 13 nouveaux) — tous avec notification twin sauf 3 auth

| Phase | Contenu | Statut |
|-------|---------|--------|
| 1 | Migration notifications + Model + Service + Controller + Routes | ✅ DONE |
| 2 | Composant NotificationBell + API frontend + Layout integration | ✅ DONE |
| 3 | Batch 1 emails (Collab: MemberInvitation, PartyAdded, ShareLink) | ✅ DONE |
| 4 | Batch 2 emails (Offres: Submitted, Countered, Rejected, Withdrawn) | ✅ DONE |
| 5 | Batch 3 emails (Conditions: StepAdvanced, Resolved, BlockingAlert, Assigned) | ✅ DONE |
| 6 | Batch 4 emails (Transaction: Cancelled, Recap) | ✅ DONE |
| 7 | Rétrofit notifications sur les 7 emails existants éligibles | ✅ DONE |

### Migrations exécutées

```bash
# Toutes les migrations sont à jour
# 1776000000001_add_address_fields_to_users.ts ✅
# 1776000000002_add_email_verification_to_users.ts ✅
# 1777000000002_create_notifications_table.ts ✅
```

### Points d'audit à résoudre (remis à plus tard)

| Source | Point | Priorité |
|--------|-------|----------|
| Winston | Polling 60s → planifier SSE/WebSocket pour scale | Low (MVP ok) |
| Winston | Pas de job cleanup notifications (rétention 90j?) | Low |
| Murat | Pas de test markRead individuel frontend | Low |
| Murat | Pas de test navigation click notification | Low |
| Sally | DropdownMenu se ferme au click (tester flash navigate) | Medium |
| Sally | Pas de loading state sur "Tout marquer lu" | Low |
| Sally | `w-80` fixe — ajouter `max-w-[calc(100vw-2rem)]` mobile | Low |
| Sally | Pas de scroll indicator (fade gradient) | Low |
| Sally | Urgent → ajouter `border-l-4 border-red-500` | Low |

### Maquettes restantes

| # | Maquette | Statut | Notes |
|---|----------|--------|-------|
| 10 | Exporter/Partager | ✅ Implémenté | 3 cartes + modales (commit 8c6cf3d) |
| 11 | Permissions & Rôles | ⬜ À implémenter | Aucun travail commencé |
| 12 | Ajouter Offre | ❓ À vérifier | Potentiellement couvert par CreateOfferModal (M06) |

### Sprint 2 conditions/profil (à faire)

1. **Backend guard** : Verrouiller profil + `autoConditionsEnabled` après étape 1
2. **Toggle dans ValidateStepModal** : "Charger conditions prochaine étape" quand autoConditions=true
3. Tests unitaires pour les guards

### Sprint 3-4 conditions (à faire)

- Sprint 3 : Admin override + type-to-confirm + recalcul + audit log
- Sprint 4 : Tests E2E, cas limites, polish

### Dette technique (Audit 2026-02-04)

| Priorité | Problème | Statut |
|----------|----------|--------|
| 🔴 | Doublon migration 1772000000006 | ❓ À vérifier |
| 🔴 | N+1 queries TransactionsController | ❓ Non résolu |
| 🟠 | ReminderService sans tenant scoping | ❓ Non résolu |
| 🟠 | Tests Notes/Offers (0-50% couverture) | ❓ Non résolu |

### État du Projet

```
COMPLÉTÉ
├── Epic 1: Workflow Engine
├── Epic 2: Frontend Core (A-B-C-D)
├── Epic 3: Automations + Multi-tenant + Auth + BullMQ
├── Epic 4 (partiel): CSV Import API backend
├── Sprint 1 conditions/profil: autoConditionsEnabled + offer gate + PartiesCard + ValidateStepModal
├── Maquettes 01-09 + 13 ✅
├── Maquette 10: Exporter/Partager ✅ (commit 8c6cf3d)
├── Phase C UX Overhaul: zéro Sheet desktop ✅
├── Auth redesign: split-screen Register + Login + AdminLogin ✅
├── Email verification (token SHA256, 24h expiry) ✅
├── Audit brand consistency emails (10/10 conformes, logo fixé) ✅
├── Spec emails & notifications in-app ✅
├── Tests RED : 30 tests (notifications API + service + UI) ✅
└── Chantier emails & notifications COMPLET (7/7 phases, 23 emails, 20 notification twins) ✅

EN COURS
├── D36: Dashboard Agent "Mon espace" + Rail Navigation (décisions OK, maquette à refaire)
├── Sprint 2: Lock backend profil/flag après étape 1
├── Sprint 3: Admin override + recalcul
└── Sprint 4: E2E + edge cases

À FAIRE
├── Maquette 11: Permissions & Rôles
├── Maquette 12: Ajouter Offre (vérifier si couvert par M06)
├── Epic 5: UI Import CSV + Uploads documents
├── Epic 6: Landing Page
├── Epic 7: Stripe Billing
└── Module FINTRAC (spec validée, implémentation à planifier)
```

### Fichiers Clés à Consulter

| Fichier | Pourquoi |
|---------|----------|
| `backend/app/services/workflow_engine_service.ts` | Coeur du pipeline : création, avancement, offer gate, conditions auto |
| `backend/app/controllers/conditions_controller.ts` | advanceCheck enrichi (offer gate + conditions) |
| `frontend/src/components/transaction/ValidateStepModal.tsx` | UX validation d'étape (3 états) |
| `frontend/src/pages/EditTransactionPage.tsx` | Page unifiée create/edit (remplace CreateTransactionModal) |
| `frontend/src/pages/TransactionDetailPage.tsx` | Page detail avec documents inline collapsible |
| `frontend/src/components/transaction/DocumentStatusBar.tsx` | Compteurs documents cliquables |
| `_bmad-output/maquette-08-suivi.md` | Suivi M08 complet |
| `_bmad-output/maquette-09-suivi.md` | Suivi M09 complet (Phase A+B+C) |
| `project-context.md` | Contexte technique global |
| `_bmad-output/session-log.md` | Ce fichier — historique complet |

---

## Historique des Sessions

### 2026-02-11 (Session actuelle) — CONSIGNÉE
- Sprint 1 conditions/profil complété (autoConditionsEnabled pipeline)
- 4 bugs corrigés (navigation, verrouillage, flag, parties)
- Offer gate implémenté (backend + frontend)
- ValidateStepModal (Maquette 03) créé
- PartiesCard inline créé
- Maquette 08 complète — 6 commits, 100% conforme, audit passé
- Maquette 09 Phase A+B+C complète — StatusBar, page edit, UX overhaul
- Phase C UX Overhaul — zéro Sheet desktop, documents inline, Dialogs centrés
- CreateTransactionModal supprimé → route `/transactions/new`
- DocumentsDrawer supprimé → section inline collapsible
- MembersPanel + ExportSharePanel convertis Sheet → Dialog
- 16 commits au total
- TypeScript compile clean

### 2026-02-04 à 2026-02-10 — Sessions intermédiaires
- Maquettes pixel-perfect 01, 02, 06, 07, 13 implémentées
- AcceptOfferModal, conditions liées, gestion des parties
- Corrections pixel-perfect (11 écarts Maquette 07)
- Fix column "userId", SMTP crash guard
- Fix preview email, relancer par email, modifier profil propriété

### 2026-01-29 (Session actuelle) — CONSIGNÉE
- BullMQ implémenté (Option A - worker in-process)
- CSV Import API complété (7 tests)
- Party Tour: pricing, roadmap, positionnement
- 3 tiers définis (29/49/99 CAD)
- Programme Fondateur (25 places, 3 mois)
- Upload documents planifié (5/15/25 MB)
- Documentation complète créée
- 5 commits pushés

### 2026-01-29 (Session précédente) — ✅ CONSIGNÉE
- Analyse quantique complète (12 agents parallèles)
- Score projet: 88%
- 3 vulnérabilités P0 corrigées (multi-tenant, token hash, email enum)
- 2 commits sécurité (d23ebc1, fca2ccf)
- 77/77 tests backend passent

### 2026-01-28 — ✅ CONSIGNÉE
- Redémarrage PC, contexte perdu → récupéré via analyse
- Validation workflow BMAD-OFRA (6 étapes + consignation)
- **Option A**: 5/5 templates email ✓
- **Option B**: Auth hardening ✓
- **Option C**: Multi-tenant enforcement ✓
- **Option D**: E2E Tests (16 tests) ✓
- **Epic 3 complété à 100%**

---

_Dernière mise à jour: 2026-02-12 — Paige (Phase 7 Rétrofit notifications complétée, 7/7 phases DONE)_
