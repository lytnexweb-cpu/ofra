# D35 Phase A — Architecture technique : Offer Intake Link

**Date** : 2026-02-11
**Auteur** : Winston (Architecte)
**Décision parent** : D35-offer-intake-link.md

---

## 1. Vue d'ensemble

Étendre le système `TransactionShareLink` existant avec un nouveau type de lien (`offer_intake`) qui expose un formulaire public de soumission d'offre. La soumission crée automatiquement une `TransactionParty` (rôle buyer) et une `Offer` avec sa première `OfferRevision`.

---

## 2. Modifications Backend

### 2.1 Migration : ajouter `link_type` à `transaction_share_links`

```sql
ALTER TABLE transaction_share_links
  ADD COLUMN link_type VARCHAR(20) NOT NULL DEFAULT 'viewer';
-- Valeurs: 'viewer' (existant), 'offer_intake' (nouveau)
```

Ceci évite de créer un nouveau modèle. Les liens existants deviennent `link_type = 'viewer'`.

### 2.2 Nouveau endpoint public : `POST /api/offer-intake/:token`

**Controller** : `OfferIntakeController`

**Flux :**
1. Résoudre le token → `TransactionShareLink` (type `offer_intake`, isActive, non expiré)
2. Valider le payload (VineJS) : `fullName*`, `email*`, `phone`, `price*`, `message`
3. Créer `TransactionParty` (role=buyer, isPrimary=false, transactionId du lien)
4. Créer `Offer` + `OfferRevision` via `OfferService.createOffer()` avec :
   - `direction: 'buyer_to_seller'`
   - `fromPartyId: newParty.id`
   - `toPartyId: autoFillSeller()` (seller primary si existe)
   - `createdByUserId: transaction.ownerUserId` (le courtier est le owner du record)
5. Notifier le courtier (NotificationService + email)
6. Retourner `201 { success: true, data: { message: 'Offer submitted' } }`

**Sécurité :**
- `middleware.rateLimit()` (réutiliser l'existant, 10 req/min par IP)
- Validation email format strict
- Pas de données sensibles dans la réponse (pas d'ID transaction, pas d'ID offre)
- Token UUID base64url 24 bytes (déjà le standard des share links)

### 2.3 Validator : `offer_intake_validator.ts`

```typescript
export const offerIntakeValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(200),
    email: vine.string().trim().email(),
    phone: vine.string().trim().maxLength(30).optional(),
    price: vine.number().positive(),
    message: vine.string().trim().maxLength(2000).optional(),
  })
)
```

### 2.4 Modification `TransactionShareLinksController.store()`

Ajouter support du `linkType: 'offer_intake'` dans le validator et la création.

### 2.5 Route

```typescript
// Routes publiques (pas d'auth)
router.post('/api/offer-intake/:token', '#controllers/offer_intake_controller.submit')
  .use(middleware.rateLimit())
```

---

## 3. Modifications Frontend

### 3.1 Nouvelle page : `OfferIntakePage.tsx`

**Route** : `/offer/:token` (pas sous `/app`, pas de layout auth)

**Composants :**
- Header minimal : logo Ofra + "Soumettre une offre"
- Résumé propriété (adresse, ville, prix demandé) — lecture seule
- Formulaire : nom, email, téléphone, prix, message
- Bouton "Soumettre mon offre"
- État succès : "Offre envoyée! Le courtier sera notifié."
- État erreur : lien expiré / désactivé / invalide

**API call :**
```typescript
// GET /api/share/:token → récupérer les infos de la transaction (réutiliser publicAccess existant)
// POST /api/offer-intake/:token → soumettre l'offre
```

### 3.2 Modification `TransactionDetailPage` — côté courtier

Ajouter un bouton "Générer lien d'offre" dans la section Offres (OffersSection).

**Comportement :**
- Clic → modale de configuration (expiration, mot de passe optionnel)
- Appel `POST /api/transactions/:id/share-link` avec `linkType: 'offer_intake'`
- Afficher le lien avec bouton copier + partager par email

### 3.3 i18n

Nouvelles clés FR/EN pour :
- Page publique (titre, labels formulaire, succès, erreurs)
- Bouton génération côté courtier
- Notification d'offre reçue via intake

---

## 4. Découpage en stories (Bob)

| # | Story | Dépendances |
|---|-------|-------------|
| S1 | Migration `link_type` + modifier validator/controller share links | — |
| S2 | `OfferIntakeController` + validator + route publique + tests | S1 |
| S3 | `OfferIntakePage.tsx` — formulaire public React | S2 |
| S4 | Bouton "Générer lien d'offre" dans OffersSection + modale config | S1 |
| S5 | Notifications (in-app + email) au courtier quand offre intake reçue | S2 |

**Chemin critique** : S1 → S2 → S3
**Parallélisable** : S4 peut démarrer après S1, S5 après S2

---

## 5. Ce qu'on ne fait PAS en Phase A

- Pas de CAPTCHA (rate limit suffit pour le MVP)
- Pas de vérification email de l'acheteur (Phase B)
- Pas de upload de documents (Phase B)
- Pas de conditions/dépôt/financement dans le formulaire (Phase B)
- Pas de portail de suivi pour l'acheteur (Phase C)
- Pas de protection par mot de passe sur le lien offer_intake (Phase B — on réutilise juste token + expiration)

---

## 6. Diagramme de flux

```
COURTIER                          SYSTÈME                         ACHETEUR
   |                                 |                               |
   |-- Clic "Lien d'offre" -------->|                               |
   |                                 |-- Génère token UUID           |
   |<-- Lien copié/envoyé ----------|                               |
   |                                 |                               |
   |   (email/SMS/Centris)           |                               |
   |-------------------------------->|------- Lien envoyé --------->|
   |                                 |                               |
   |                                 |<-- GET /share/:token ---------|
   |                                 |-- Résumé propriété ---------->|
   |                                 |                               |
   |                                 |<-- POST /offer-intake/:token -|
   |                                 |    {nom, email, prix, msg}    |
   |                                 |                               |
   |                                 |-- Crée TransactionParty       |
   |                                 |-- Crée Offer + Revision       |
   |                                 |-- Notifie courtier            |
   |                                 |                               |
   |<-- Notification 📨 ------------|-- "Offre envoyée!" ---------->|
   |                                 |                               |
   |-- Ouvre detail transaction ---->|                               |
   |<-- Voit nouvelle offre --------|                               |
```
