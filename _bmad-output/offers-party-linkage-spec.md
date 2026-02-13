# Spec : Attribution des parties aux offres (Offers Party Linkage)

**Date** : 12 fevrier 2026
**Statut** : Valide
**Priorite** : Prochaine iteration

---

## 1. Contexte & Probleme

### Etat actuel

Le systeme d'offres/contre-offres d'OFRA repose sur la table `offer_revisions` qui contient :

- **`direction`** : enum `buyer_to_seller | seller_to_buyer` -- indique le sens generique de l'offre
- **`created_by_user_id`** : FK vers `users(id)` -- identifie l'utilisateur connecte qui a saisi l'offre

### Limites identifiees

| # | Probleme | Impact |
|---|----------|--------|
| 1 | Aucun lien vers `transaction_parties` | Impossible de savoir QUI specifiquement a fait l'offre |
| 2 | Direction generique "B -> S" | L'affichage ne peut pas montrer "Alice Tremblay -> Bob Lavoie" |
| 3 | Agent vs client indistinguable | Quand un agent saisit pour son client, `createdByUserId` = agent, pas le client |
| 4 | Multi-acheteurs ambigus | Si 2 buyers existent, on ne sait pas lequel a fait l'offre |
| 5 | Export PDF appauvri | Les documents officiels ne peuvent pas nommer les parties |

### Objectif

Enrichir structurellement `offer_revisions` avec `from_party_id` et `to_party_id` pour tracer avec precision l'origine et la destination de chaque revision d'offre, tout en preservant la retrocompatibilite avec les offres existantes.

---

## 2. Decisions validees

### D-OPL-01 : Ajouter `fromPartyId` et `toPartyId`

- **Table cible** : `offer_revisions`
- **Type** : `integer unsigned nullable`
- **FK** : vers `transaction_parties(id)`
- **Raison** : Permet l'attribution nominative de chaque revision a des parties concretes de la transaction

### D-OPL-02 : Garder le champ `direction` existant

- **Regle** : Le champ `direction` (`buyer_to_seller | seller_to_buyer`) est conserve tel quel
- **Raison** : Retrocompatibilite. Les offres existantes n'ont pas de `fromPartyId`/`toPartyId`. Le champ `direction` reste la source de verite pour le sens generique. Les deux systemes coexistent.

### D-OPL-03 : Validation backend -- coherence direction / roles

- **Regle** : Si `fromPartyId` et `toPartyId` sont fournis, le backend valide :
  - `direction = buyer_to_seller` -> `fromParty.role` doit etre `buyer`, `toParty.role` doit etre `seller`
  - `direction = seller_to_buyer` -> `fromParty.role` doit etre `seller`, `toParty.role` doit etre `buyer`
- **Raison** : Empecher les incoherences de donnees. Un buyer ne peut pas etre "to" dans une offre `buyer_to_seller`.

### D-OPL-04 : `ON DELETE SET NULL` pour les FK

- **Regle** : Si une `TransactionParty` est supprimee, les FK `from_party_id` / `to_party_id` passent a `NULL`
- **Raison** : L'offre et son historique de revision doivent survivre a la suppression d'une partie. Le fallback `direction` prend le relais pour l'affichage.

### D-OPL-05 : Auto-fill intelligent

- **Regle** : Cote frontend, si la transaction n'a qu'un seul buyer et un seul seller, les champs `fromPartyId` et `toPartyId` sont remplis automatiquement sans dropdown
- **Raison** : UX optimisee. Dans 80%+ des transactions residentielless, il y a 1 buyer et 1 seller. Pas besoin de forcer un choix.

### D-OPL-06 : Fallback affichage generique

- **Regle** : Quand `fromPartyId` ou `toPartyId` est `null` (offres historiques ou parties supprimees), l'affichage retombe sur le badge generique "Acheteur -> Vendeur" / "Vendeur -> Acheteur" base sur `direction`
- **Raison** : Zero regression sur les offres existantes.

---

## 3. Modele de donnees

### 3.1 Migration : `add_party_ids_to_offer_revisions`

```typescript
// backend/database/migrations/XXXXXXXXX_add_party_ids_to_offer_revisions.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'offer_revisions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('from_party_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transaction_parties')
        .onDelete('SET NULL')

      table
        .integer('to_party_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transaction_parties')
        .onDelete('SET NULL')

      // Index pour les requetes de filtrage par partie
      table.index(['from_party_id'])
      table.index(['to_party_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('from_party_id')
      table.dropColumn('to_party_id')
    })
  }
}
```

### 3.2 Schema resultant de `offer_revisions`

| Colonne | Type | Nullable | FK | Notes |
|---------|------|----------|----|-------|
| `id` | integer (PK) | non | -- | auto-increment |
| `offer_id` | integer | non | `offers(id) ON DELETE CASCADE` | existant |
| `revision_number` | integer | non | -- | existant, unique avec offer_id |
| `price` | decimal(12,2) | non | -- | existant |
| `deposit` | decimal(12,2) | oui | -- | existant |
| `financing_amount` | decimal(12,2) | oui | -- | existant |
| `expiry_at` | timestamp | oui | -- | existant |
| `deposit_deadline` | date | oui | -- | existant |
| `closing_date` | date | oui | -- | existant |
| `inspection_required` | boolean | non | -- | existant, default false |
| `inspection_delay` | varchar(50) | oui | -- | existant |
| `inclusions` | text | oui | -- | existant |
| `message` | text | oui | -- | existant |
| `notes` | text | oui | -- | existant |
| `direction` | enum | non | -- | existant, `buyer_to_seller \| seller_to_buyer` |
| `created_by_user_id` | integer | oui | `users(id) ON DELETE SET NULL` | existant |
| **`from_party_id`** | integer | oui | **`transaction_parties(id) ON DELETE SET NULL`** | **NOUVEAU** |
| **`to_party_id`** | integer | oui | **`transaction_parties(id) ON DELETE SET NULL`** | **NOUVEAU** |
| `created_at` | timestamp | oui | -- | existant |

### 3.3 Relations Lucid

```typescript
// Dans OfferRevision model -- nouvelles relations a ajouter
import TransactionParty from './transaction_party.js'

@column()
declare fromPartyId: number | null

@column()
declare toPartyId: number | null

@belongsTo(() => TransactionParty, { foreignKey: 'fromPartyId' })
declare fromParty: BelongsTo<typeof TransactionParty>

@belongsTo(() => TransactionParty, { foreignKey: 'toPartyId' })
declare toParty: BelongsTo<typeof TransactionParty>
```

---

## 4. Modifications backend

### 4.1 Modele `OfferRevision`

- Ajouter les colonnes `fromPartyId` et `toPartyId` (voir section 3.3)
- Ajouter les relations `belongsTo` vers `TransactionParty`

### 4.2 Validateurs (`offer_validator.ts`)

Ajouter aux deux validateurs existants :

```typescript
// createOfferValidator et addRevisionValidator
fromPartyId: vine.number().positive().optional(),
toPartyId: vine.number().positive().optional(),
```

### 4.3 Service (`offer_service.ts`)

#### `createOffer()`

- Accepter les parametres optionnels `fromPartyId` et `toPartyId`
- Si fournis, valider la coherence direction/roles avant creation :

```typescript
if (params.fromPartyId && params.toPartyId) {
  const fromParty = await TransactionParty.findOrFail(params.fromPartyId)
  const toParty = await TransactionParty.findOrFail(params.toPartyId)

  // Verifier que les parties appartiennent a la meme transaction
  if (fromParty.transactionId !== params.transactionId ||
      toParty.transactionId !== params.transactionId) {
    throw new Error('Parties must belong to the same transaction')
  }

  // Verifier la coherence direction ↔ roles
  const direction = params.direction || 'buyer_to_seller'
  if (direction === 'buyer_to_seller') {
    if (fromParty.role !== 'buyer' || toParty.role !== 'seller') {
      throw new Error('Direction buyer_to_seller requires fromParty=buyer and toParty=seller')
    }
  } else {
    if (fromParty.role !== 'seller' || toParty.role !== 'buyer') {
      throw new Error('Direction seller_to_buyer requires fromParty=seller and toParty=buyer')
    }
  }
}
```

- Persister `fromPartyId` et `toPartyId` sur la revision

#### `addRevision()` (contre-offre)

- Accepter `fromPartyId` et `toPartyId` optionnels
- **Auto-inversion** : si non fournis mais que la revision precedente avait des party IDs, inverser automatiquement :

```typescript
if (!params.fromPartyId && !params.toPartyId && lastRevision) {
  // Auto-invert : la contre-offre va dans le sens inverse
  params.fromPartyId = lastRevision.toPartyId
  params.toPartyId = lastRevision.fromPartyId
}
```

- Meme validation de coherence direction/roles que `createOffer()`

### 4.4 Controleur (`offers_controller.ts`)

#### `store()` et `addRevision()`

- Passer `fromPartyId` et `toPartyId` du payload vers le service

#### Preloading enrichi

- Dans `loadOfferWithOwnershipCheck()`, ajouter le preload des parties :

```typescript
query.preload('createdBy')
     .preload('fromParty')  // NOUVEAU
     .preload('toParty')    // NOUVEAU
     .preload('conditions')
     .orderBy('revision_number', 'asc')
```

- Idem dans `OfferService.getOffers()` et `getAcceptedOffer()` :

```typescript
.preload('revisions', (query) =>
  query
    .preload('conditions')
    .preload('fromParty')   // NOUVEAU
    .preload('toParty')     // NOUVEAU
    .orderBy('revision_number', 'asc')
)
```

---

## 5. Modifications frontend

### 5.1 Types API (`transactions.api.ts`)

Enrichir l'interface `OfferRevision` :

```typescript
export interface OfferRevision {
  // ... champs existants ...
  fromPartyId: number | null       // NOUVEAU
  toPartyId: number | null         // NOUVEAU
  fromParty?: TransactionParty     // NOUVEAU (preloaded)
  toParty?: TransactionParty       // NOUVEAU (preloaded)
}
```

### 5.2 Types API (`offers.api.ts`)

Enrichir les interfaces de requete :

```typescript
export interface CreateOfferRequest {
  // ... champs existants ...
  fromPartyId?: number   // NOUVEAU
  toPartyId?: number     // NOUVEAU
}

export interface AddRevisionRequest {
  // ... champs existants ...
  fromPartyId?: number   // NOUVEAU
  toPartyId?: number     // NOUVEAU
}
```

### 5.3 `CreateOfferModal`

**Logique d'auto-fill** :

1. Charger les parties de la transaction via l'API existante
2. Filtrer buyers et sellers
3. Cas 1 buyer + 1 seller : auto-fill silencieux, pas de dropdown
4. Cas multi-buyers ou multi-sellers : afficher un `<Select>` pour choisir la partie specifique
5. Cas 0 buyer ou 0 seller : ne pas remplir (nullable), l'offre fonctionnera avec `direction` seul

```typescript
const buyers = parties.filter(p => p.role === 'buyer')
const sellers = parties.filter(p => p.role === 'seller')

// Auto-fill si une seule partie par role
const autoFrom = direction === 'buyer_to_seller'
  ? (buyers.length === 1 ? buyers[0].id : null)
  : (sellers.length === 1 ? sellers[0].id : null)

const autoTo = direction === 'buyer_to_seller'
  ? (sellers.length === 1 ? sellers[0].id : null)
  : (buyers.length === 1 ? buyers[0].id : null)
```

### 5.4 `CounterOfferModal`

- Recuperer `fromPartyId` et `toPartyId` de la derniere revision
- Inverser automatiquement (`from` devient `to` et vice versa)
- Permettre a l'utilisateur de modifier si multi-parties

### 5.5 `OffersSection` -- Affichage enrichi

Remplacer le badge generique par un affichage nominatif :

```typescript
function renderDirection(revision: OfferRevision): string {
  if (revision.fromParty && revision.toParty) {
    return `${revision.fromParty.fullName} → ${revision.toParty.fullName}`
  }
  // Fallback generique (offres historiques ou parties supprimees)
  return revision.direction === 'buyer_to_seller'
    ? t('offers.buyerToSeller')
    : t('offers.sellerToBuyer')
}
```

### 5.6 Cles i18n

Ajouter dans `fr/common.json` et `en/common.json` :

```json
{
  "offers": {
    "fromParty": "De",
    "toParty": "A",
    "selectBuyer": "Selectionner l'acheteur",
    "selectSeller": "Selectionner le vendeur",
    "partyDeleted": "(partie supprimee)",
    "autoFilledParties": "Parties detectees automatiquement"
  }
}
```

---

## 6. Risques & mitigations

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R1 | Offres existantes sans `fromPartyId`/`toPartyId` | Certain | Faible | Champs nullable + fallback affichage `direction`. Zero migration de donnees necessaire. |
| R2 | Incoherence direction/roles | Moyenne | Moyen | Validation backend D-OPL-03 bloque la creation incoherente. Contrainte applicative, pas DB (flexibilite). |
| R3 | Partie supprimee apres creation offre | Faible | Faible | `ON DELETE SET NULL` (D-OPL-04) + fallback affichage generique (D-OPL-06). L'offre survit. |
| R4 | Transaction sans parties (offre creee avant ajout de parties) | Moyenne | Faible | Champs nullable. L'offre est creee avec `direction` seul. Les party IDs peuvent etre ajoutes plus tard via edition. |
| R5 | Performance -- preload supplementaire | Faible | Faible | `TransactionParty` est une table legere. Le preload ajoute 2 LEFT JOIN avec index. Impact negligeable. |

---

## 7. Plan d'implementation

### Etape 1 : Migration + Modele

**Scope** : Backend uniquement, zero impact frontend

- [ ] Creer la migration `add_party_ids_to_offer_revisions`
- [ ] Ajouter `fromPartyId`, `toPartyId` au modele `OfferRevision`
- [ ] Ajouter les relations `belongsTo` vers `TransactionParty`
- [ ] Executer la migration en dev
- [ ] Verifier que les offres existantes fonctionnent toujours (regression)

**Verification** : `node ace migration:run` + requete SQL confirmant les colonnes nullable

### Etape 2 : Backend service/controleur

**Scope** : API enrichie, retrocompatible

- [ ] Ajouter `fromPartyId` et `toPartyId` aux validateurs VineJS
- [ ] Modifier `OfferService.createOffer()` : accepter + valider les party IDs
- [ ] Modifier `OfferService.addRevision()` : accepter + auto-inverser les party IDs
- [ ] Ajouter la logique de validation de coherence direction/roles
- [ ] Enrichir le preload dans le controleur et le service (`fromParty`, `toParty`)
- [ ] Ecrire les tests fonctionnels :
  - Creation avec party IDs valides
  - Creation avec direction incoherente (doit echouer)
  - Contre-offre avec auto-inversion
  - Creation sans party IDs (retrocompatibilite)

**Verification** : Tests fonctionnels passent + API retourne `fromParty`/`toParty` dans les reponses

### Etape 3 : Frontend modales + affichage

**Scope** : UX enrichie

- [ ] Enrichir les types `OfferRevision`, `CreateOfferRequest`, `AddRevisionRequest`
- [ ] Modifier `CreateOfferModal` : logique auto-fill + dropdown conditionnel
- [ ] Modifier `CounterOfferModal` : auto-inversion des parties
- [ ] Modifier `OffersSection` : affichage nominatif avec fallback generique
- [ ] Ajouter les cles i18n FR/EN
- [ ] Tests manuels : scenarios 1 buyer, multi-buyers, 0 parties

**Verification** : Scenario complet creation -> contre-offre -> affichage nominatif

### Etape 4 : Export PDF enrichi

**Scope** : Documents officiels

- [ ] Enrichir le template PDF des offres pour inclure les noms des parties
- [ ] Fallback sur labels generiques si party IDs null
- [ ] Validation visuelle du rendu PDF

**Verification** : PDF genere avec noms complets des parties

---

## 8. Cas limites (edge cases)

| # | Scenario | Comportement attendu |
|---|----------|---------------------|
| EC-01 | Aucune partie ajoutee a la transaction | `fromPartyId` et `toPartyId` restent `null`. L'offre fonctionne avec `direction` seul. Le frontend n'affiche pas de dropdown. |
| EC-02 | Multi-acheteurs (ex: couple) | Le frontend affiche un dropdown pour choisir quel buyer est l'emetteur. L'utilisateur selectionne explicitement. |
| EC-03 | Partie supprimee apres creation de l'offre | `ON DELETE SET NULL` met les FK a `null`. L'affichage retombe sur le badge generique "Acheteur -> Vendeur". |
| EC-04 | Agent saisit pour son client | `fromPartyId` = ID de la partie client (buyer/seller), `createdByUserId` = ID de l'agent connecte. Les deux informations sont complementaires. |
| EC-05 | Contre-offre quand parties inversees | Auto-inversion : si revision N a `from=Alice(buyer), to=Bob(seller)`, revision N+1 aura `from=Bob(seller), to=Alice(buyer)`. La direction s'inverse aussi. |
| EC-06 | Partie ajoutee en cours de negociation | Les nouvelles revisions peuvent utiliser les nouvelles parties. Les revisions anterieures conservent leurs references originales. |
| EC-07 | Offre historique (pre-migration) | `fromPartyId = null`, `toPartyId = null`. Aucune regression. L'affichage utilise `direction` exclusivement. |
| EC-08 | Transaction avec buyer = seller (auto-transaction) | Theoriquement possible. La validation ne bloque pas si les roles sont corrects par rapport a `direction`. Cas rare mais supporte. |
| EC-09 | Party change de role apres offre | L'offre conserve la reference FK. La validation de coherence n'est faite qu'a la creation. Le role au moment de la creation est celui qui compte. |
| EC-10 | `fromPartyId` fourni sans `toPartyId` (ou inverse) | Accepte. Les champs sont independamment nullable. L'affichage s'adapte : "Alice -> Vendeur" ou "Acheteur -> Bob". |

---

## 9. Fichiers impactes

### Backend

| Fichier | Modification |
|---------|-------------|
| `backend/database/migrations/XXXXXXXXX_add_party_ids_to_offer_revisions.ts` | Nouvelle migration |
| `backend/app/models/offer_revision.ts` | Colonnes + relations `fromParty`, `toParty` |
| `backend/app/services/offer_service.ts` | Parametres party IDs + validation coherence + auto-inversion |
| `backend/app/validators/offer_validator.ts` | `fromPartyId`, `toPartyId` optionnels |
| `backend/app/controllers/offers_controller.ts` | Passage des params + preload enrichi |

### Frontend

| Fichier | Modification |
|---------|-------------|
| `frontend/src/api/transactions.api.ts` | Interface `OfferRevision` enrichie |
| `frontend/src/api/offers.api.ts` | Interfaces `CreateOfferRequest`, `AddRevisionRequest` enrichies |
| `frontend/src/components/CreateOfferModal.tsx` | Auto-fill + dropdown parties |
| `frontend/src/components/transaction/CreateOfferModal.tsx` | Idem (si doublon actif) |
| `frontend/src/components/CounterOfferModal.tsx` | Auto-inversion parties |
| `frontend/src/components/OffersSection.tsx` | Affichage nominatif + fallback |
| `frontend/src/i18n/locales/fr/common.json` | Nouvelles cles i18n |
| `frontend/src/i18n/locales/en/common.json` | Nouvelles cles i18n |
