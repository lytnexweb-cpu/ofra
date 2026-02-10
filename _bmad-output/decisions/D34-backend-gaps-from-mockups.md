# D34 — Écarts backend identifiés depuis les maquettes UX

**Date** : 2026-02-10
**Mis à jour** : 2026-02-10 (ajout maquettes 10, 11, 12)
**Statut** : À implémenter après finalisation des maquettes
**Source** : Audit croisé maquettes 01–12 vs backend réel

---

## Priorité 1 — Modèles manquants

### P1.1 — Statut `archived` sur Transaction
- **Impacte** : Maquettes 07, 09
- **Actuel** : `Transaction.status` = `'active' | 'cancelled'`
- **Requis** : Ajouter `'archived'` à l'enum status
- **Champs à ajouter** :
  - `archivedAt` (datetime, nullable)
  - `archivedReason` (varchar 255, nullable)
- **Endpoints à créer** :
  - `PATCH /api/transactions/:id/archive`
  - `PATCH /api/transactions/:id/restore`
- **Logique** : Transaction archivée = lecture seule, restaurable. Transaction annulée = non restaurable (sauf admin).

### P1.2 — Modèle Document (standalone)
- **Impacte** : Maquette 08
- **Actuel** : Seulement `ConditionEvidence` (lié à une condition) + `Transaction.folderUrl` (lien externe)
- **Requis** : Nouveau modèle `TransactionDocument`
- **Champs proposés** :
  - `id` (PK)
  - `transactionId` (FK transactions)
  - `conditionId` (FK conditions, nullable — pour lier optionnellement)
  - `category` (enum: `'offer' | 'inspection' | 'financing' | 'identity' | 'legal' | 'other'`)
  - `name` (varchar 255)
  - `fileUrl` (varchar 2048)
  - `fileSize` (integer, bytes)
  - `mimeType` (varchar 100)
  - `status` (enum: `'missing' | 'uploaded' | 'validated' | 'rejected'`)
  - `version` (integer, default 1)
  - `parentDocumentId` (FK self, nullable — pour versioning)
  - `tags` (jsonb, nullable)
  - `rejectionReason` (text, nullable)
  - `validatedBy` (FK users, nullable)
  - `validatedAt` (datetime, nullable)
  - `uploadedBy` (FK users)
  - `createdAt`, `updatedAt`
- **Endpoints à créer** :
  - `GET /api/transactions/:id/documents`
  - `POST /api/transactions/:id/documents`
  - `GET /api/documents/:id`
  - `PUT /api/documents/:id`
  - `PATCH /api/documents/:id/validate`
  - `PATCH /api/documents/:id/reject`
  - `DELETE /api/documents/:id`

### P1.3 — Modèle TransactionParty (multi-parties)
- **Impacte** : Maquette 09
- **Actuel** : Un seul `clientId` sur Transaction (= l'acheteur OU le vendeur)
- **Requis** : Nouveau modèle `TransactionParty`
- **Champs proposés** :
  - `id` (PK)
  - `transactionId` (FK transactions)
  - `role` (enum: `'buyer' | 'seller' | 'lawyer' | 'notary' | 'agent' | 'broker' | 'other'`)
  - `fullName` (varchar 255)
  - `email` (varchar 255, nullable)
  - `phone` (varchar 50, nullable)
  - `address` (varchar 500, nullable)
  - `company` (varchar 255, nullable — agence, cabinet, etc.)
  - `isPrimary` (boolean, default false — contact principal pour ce rôle)
  - `createdAt`, `updatedAt`
- **Endpoints à créer** :
  - `GET /api/transactions/:id/parties`
  - `POST /api/transactions/:id/parties`
  - `PUT /api/parties/:id`
  - `DELETE /api/parties/:id`
- **Migration** : Le `clientId` existant peut rester pour compatibilité, ou être migré vers une entrée TransactionParty avec `role = 'buyer'`.

### P1.4 — Modèle TransactionMember (accès multi-utilisateurs)
- **Impacte** : Maquette 11
- **Actuel** : Seul `ownerUserId` sur Transaction. Aucun système de partage/rôles par transaction.
- **Requis** : Nouveau modèle `TransactionMember`
- **Champs proposés** :
  - `id` (PK)
  - `transactionId` (FK transactions)
  - `userId` (FK users, nullable — null si invitation en attente)
  - `email` (varchar 255 — email de l'invité, requis)
  - `role` (enum: `'owner' | 'admin' | 'editor' | 'viewer'`)
  - `status` (enum: `'active' | 'pending' | 'revoked'`)
  - `invitedBy` (FK users)
  - `invitedAt` (datetime)
  - `acceptedAt` (datetime, nullable)
  - `revokedAt` (datetime, nullable)
  - `inviteToken` (varchar 255, nullable — token unique pour acceptation)
  - `inviteMessage` (text, nullable — message personnalisé)
  - `createdAt`, `updatedAt`
- **Endpoints à créer** :
  - `GET /api/transactions/:id/members` — liste des membres
  - `POST /api/transactions/:id/members/invite` — inviter (envoie email)
  - `PATCH /api/members/:id/role` — changer le rôle
  - `DELETE /api/members/:id` — retirer l'accès
  - `POST /api/members/:id/resend` — renvoyer l'invitation
  - `POST /api/invitations/:token/accept` — accepter (public, token-based)
- **Middleware** : Créer un middleware `transactionRole(['admin', 'editor'])` qui vérifie le rôle du user sur la transaction avant chaque action.
- **Matrice des permissions** (ref maquette 11) :
  | Action | Viewer | Editor | Admin | Owner |
  |--------|--------|--------|-------|-------|
  | Voir la transaction | ✅ | ✅ | ✅ | ✅ |
  | Modifier offres / conditions | ❌ | ✅ | ✅ | ✅ |
  | Gérer documents | ❌ | ✅ | ✅ | ✅ |
  | Annuler / Archiver | ❌ | ❌ | ✅ | ✅ |
  | Gérer les accès | ❌ | ❌ | ✅ | ✅ |
  | Supprimer la transaction | ❌ | ❌ | ❌ | ✅ |
  | Transférer la propriété | ❌ | ❌ | ❌ | ✅ |
- **Note** : Le `ownerUserId` existant sur Transaction reste. Le owner est aussi créé comme `TransactionMember` avec `role = 'owner'` (source de vérité = TransactionMember).

### P1.5 — Modèle TransactionShareLink (lien public)
- **Impacte** : Maquette 10, 11
- **Actuel** : Aucun système de lien public/partageable.
- **Requis** : Nouveau modèle `TransactionShareLink`
- **Champs proposés** :
  - `id` (PK)
  - `transactionId` (FK transactions)
  - `token` (varchar 255, unique — identifiant public du lien)
  - `role` (enum: `'readonly' | 'comment'`)
  - `isActive` (boolean, default true)
  - `expiresAt` (datetime, nullable)
  - `password` (varchar 255, nullable — hashé)
  - `createdBy` (FK users)
  - `revokedAt` (datetime, nullable)
  - `accessCount` (integer, default 0)
  - `lastAccessedAt` (datetime, nullable)
  - `createdAt`, `updatedAt`
- **Endpoints à créer** :
  - `POST /api/transactions/:id/share-links` — créer un lien
  - `GET /api/transactions/:id/share-links` — lister les liens actifs
  - `PATCH /api/share-links/:id/revoke` — révoquer un lien
  - `GET /api/shared/:token` — accès public (vérifie expiration, password, incrémente compteur)
- **Logique** : Un seul lien actif par transaction à la fois. Créer un nouveau lien révoque l'ancien.

---

## Priorité 2 — Champs manquants sur modèles existants

### P2.1 — Dates clés sur Transaction
- **Impacte** : Maquette 09
- **Actuel** : Aucune date clé sur Transaction (seulement `condition.dueDate` par condition)
- **Champs à ajouter sur `transactions`** :
  - `closingDate` (date, nullable)
  - `offerExpiryDate` (date, nullable)
  - `inspectionDeadline` (date, nullable)
  - `financingDeadline` (date, nullable)
- **OU** : Nouveau modèle `TransactionKeyDate` pour dates dynamiques :
  - `id`, `transactionId`, `label` (varchar), `date` (date), `createdAt`, `updatedAt`
- **Recommandation** : Les 4 dates fixes + un modèle `TransactionKeyDate` pour les "Autres" dynamiques.

### P2.2 — Champs Property
- **Impacte** : Maquette 09
- **Champs à ajouter sur `properties`** :
  - `province` (varchar 100, nullable)
  - `mlsNumber` (varchar 50, nullable)

### P2.3 — Tags sur Transaction
- **Impacte** : Maquette 09
- **Option A** : Champ `tags` (jsonb) directement sur `transactions`
- **Option B** : Modèle `Tag` + table pivot `transaction_tags`
- **Recommandation** : Option A (jsonb) pour simplifier, array de strings.

### P2.4 — Langue sur Transaction
- **Impacte** : Maquette 09
- **Actuel** : `language` et `preferredLanguage` sont sur User, pas sur Transaction
- **Champ à ajouter sur `transactions`** :
  - `language` (varchar 5, nullable, default null → hérite du user)

### P2.5 — Champs manquants sur OfferRevision
- **Impacte** : Maquette 12
- **Actuel** : `OfferRevision` a `price`, `deposit`, `financingAmount`, `expiryAt`, `notes`, `direction`, `createdByUserId`
- **Champs manquants vs maquette 12** :
  - `depositDeadline` (date, nullable) — date limite du dépôt
  - `closingDate` (date, nullable) — date de clôture proposée dans cette révision
  - `inspectionRequired` (boolean, default false)
  - `inspectionDelay` (varchar 50, nullable — ex: "10 jours")
  - `inclusions` (text, nullable — inclusions/exclusions texte libre)
  - `message` (text, nullable — message au vendeur, distinct de `notes`)
- **Note** : `financingAmount` non-null implique financement requis (pas besoin d'un boolean séparé). Le champ `notes` existant est interne ; `message` est destiné au vendeur.

### P2.6 — Types ActivityFeed manquants
- **Impacte** : Maquettes 07, 08, 10, 11
- **Actuel** : `ActivityType` enum couvre transactions, steps, conditions, offers, notes, automations
- **Types à ajouter** :
  - `'transaction_archived'` — maquette 07
  - `'transaction_restored'` — maquette 07
  - `'document_uploaded'` — maquette 08
  - `'document_validated'` — maquette 08
  - `'document_rejected'` — maquette 08
  - `'member_invited'` — maquette 11
  - `'member_role_changed'` — maquette 11
  - `'member_removed'` — maquette 11
  - `'share_link_created'` — maquette 10
  - `'share_link_revoked'` — maquette 10
  - `'pdf_exported'` — maquette 10

---

## Priorité 3 — Fonctionnalités futures (services)

### P3.1 — Système de notifications email
- **Impacte** : Maquettes 06, 07, 10, 11, 12
- **Actuel** : Aucun système email/notification
- **Requis à terme** :
  - Service d'envoi email (Resend, SES, ou SMTP)
  - Templates email :
    - Invitation à rejoindre une transaction (maquette 11)
    - Récapitulatif de transaction (maquette 10)
    - Notification d'offre soumise (maquette 12)
    - Notification d'annulation/archivage (maquettes 06, 07)
  - Toggle "Notifier par email" sur actions clés (maquettes 06, 07, 12)
  - Modèle `EmailLog` pour traçabilité (optionnel)
- **Note** : Pour le moment, le toggle peut exister en UI sans backend (feature flag), ou être implémenté plus tard.

### P3.2 — Raisons d'annulation structurées
- **Impacte** : Maquette 07
- **Actuel** : `cancellationReason` = simple varchar 255
- **Recommandation** : Ajouter `cancellationCategory` (enum: `'financing_refused' | 'inspection_failed' | 'buyer_withdrawal' | 'seller_withdrawal' | 'deadline_expired' | 'mutual_agreement' | 'other'`) et garder `cancellationReason` pour la note libre.

### P3.3 — Service Export PDF
- **Impacte** : Maquette 10
- **Actuel** : Aucun service de génération PDF
- **Requis** :
  - Service de génération PDF (Puppeteer, PDFKit, ou service externe)
  - Sections configurables : offres, conditions, documents, historique (checkboxes maquette 10)
  - Option watermark (toggle)
  - Option langue (FR/EN)
  - Endpoint : `POST /api/transactions/:id/export/pdf`
  - Réponse : URL temporaire du PDF généré (ou stream direct)
- **Complexité** : Moyenne-Élevée (templates, mise en page, données agrégées)

### P3.4 — Endpoint chargement de pack pour offre
- **Impacte** : Maquette 12
- **Actuel** : `ConditionTemplate` avec champ `pack` (PackType: `'rural_nb' | 'condo_nb' | 'finance_nb' | 'universal'`) existe. Pas d'endpoint dédié pour charger un pack dans le contexte d'une offre.
- **Requis** :
  - `GET /api/condition-packs` — liste des packs disponibles avec compteur de conditions
  - `GET /api/condition-packs/:packType/templates` — liste des templates du pack
  - `POST /api/offers/:offerId/apply-pack` — applique un pack (crée les conditions liées à l'offre)
- **Logique** :
  - Charger les templates du pack
  - Créer des `Condition` pour chaque template, liées à `offerId`
  - Marquer les conditions comme `Auto` / `Pack` (via `templateId` non-null + `sourceType`)
  - Les packs sont **additifs** : charger un 2e pack ajoute ses conditions sans supprimer les existantes
- **PackType actuel vs maquette 12** :
  | PackType backend | Chip maquette 12 |
  |-----------------|------------------|
  | `universal` | Standard |
  | `finance_nb` | Financement |
  | (à créer) `inspection_nb` | Inspection |
  | (à créer) `cash_nb` | Cash offer |
- **Migration** : Ajouter `'inspection_nb' | 'cash_nb'` au PackType enum. Seed les templates correspondants.

---

## Résumé d'effort estimé

| Tâche | Type | Complexité | Maquette |
|-------|------|------------|----------|
| P1.1 Statut archived | Migration + Controller + Routes | Faible | 07, 09 |
| P1.2 Modèle Document | Model + Migration + Controller + Validator + Routes | Moyenne | 08 |
| P1.3 Modèle TransactionParty | Model + Migration + Controller + Validator + Routes | Moyenne | 09 |
| P1.4 Modèle TransactionMember | Model + Migration + Controller + Validator + Routes + Middleware | Élevée | 11 |
| P1.5 Modèle TransactionShareLink | Model + Migration + Controller + Routes | Moyenne | 10 |
| P2.1 Dates clés | Migration + Validator update | Faible | 09 |
| P2.2 Champs Property | Migration | Trivial | 09 |
| P2.3 Tags jsonb | Migration | Trivial | 09 |
| P2.4 Langue Transaction | Migration | Trivial | 09 |
| P2.5 Champs OfferRevision | Migration + Validator update | Faible | 12 |
| P2.6 Types ActivityFeed | Code enum update | Trivial | 07, 08, 10, 11 |
| P3.1 Notifications email | Service + Templates + Jobs | Élevée | 06, 07, 10, 11, 12 |
| P3.2 Raisons annulation | Migration | Trivial | 07 |
| P3.3 Service Export PDF | Service + Template + Endpoint | Élevée | 10 |
| P3.4 Pack → Offre endpoint | Controller + Routes + Logic | Moyenne | 12 |

---

## Maquettes conformes (aucun écart backend)

- ✅ Maquette 01 — Transaction detail
- ✅ Maquette 02 — Accepter offre
- ✅ Maquette 03 — Valider étape
- ✅ Maquette 04 — Résoudre condition
- ✅ Maquette 05 — Ajouter condition
- ✅ Maquette 06 — Annuler transaction (P3.1 email = bonus)

## Maquettes avec écarts identifiés

- ⚠️ Maquette 07 — Archiver transaction → P1.1, P2.6, P3.2
- ⚠️ Maquette 08 — Documents & preuves → P1.2, P2.6
- ⚠️ Maquette 09 — Éditer transaction → P1.3, P2.1, P2.2, P2.3, P2.4
- ⚠️ Maquette 10 — Exporter & partager → P1.5, P2.6, P3.1, P3.3
- ⚠️ Maquette 11 — Permissions & rôles → P1.4, P2.6, P3.1
- ⚠️ Maquette 12 — Ajouter offre → P2.5, P3.4

---

## Ordre d'implémentation recommandé

### Phase A — Fondations (pas de dépendances)
1. **P2.2** Property fields (trivial, 1 migration)
2. **P2.3** Tags jsonb (trivial, 1 migration)
3. **P2.4** Langue transaction (trivial, 1 migration)
4. **P2.6** ActivityFeed types (enum update, 0 migration)
5. **P3.2** cancellationCategory (trivial, 1 migration)
6. **P1.1** Statut archived (faible, migration + 2 endpoints)

### Phase B — Modèles cœur
7. **P2.1** Dates clés (faible, migration + validator)
8. **P2.5** OfferRevision fields (faible, migration + validator)
9. **P1.3** TransactionParty (moyenne, full CRUD)
10. **P1.2** TransactionDocument (moyenne, full CRUD + upload)

### Phase C — Collaboration
11. **P1.4** TransactionMember + middleware permissions (élevée)
12. **P1.5** TransactionShareLink (moyenne, dépend de P1.4 pour les rôles)

### Phase D — Services
13. **P3.4** Pack → Offre (moyenne, dépend du ConditionTemplate existant)
14. **P3.1** Notifications email (élevée, service transversal)
15. **P3.3** Export PDF (élevée, service standalone)
