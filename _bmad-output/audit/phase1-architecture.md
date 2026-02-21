# Phase 1 — Audit Architecture & Securite
## Auditeur : Winston (Architect) — 20 fev 2026

---

## Resume

| Severite | Nombre |
|----------|--------|
| CRITIQUE | 10 |
| HAUTE | 8 |
| MOYENNE | 9 |
| BASSE | 5 (dont 4 PASS) |
| **Total** | **32** |

---

## Points Positifs (PASS)

- SQL injection : requetes parametrees partout, pas de concatenation raw
- Passwords : `serializeAs: null` sur le model User
- Stripe webhooks : verification signature correcte
- Service layer : bonne separation des responsabilites
- TenantScopeService : abstraction propre pour multi-tenant

---

## 1. SECURITE

### SEC-001 : CRITIQUE — sameSite: 'none' sur session cookie
**Fichier :** `backend/config/session.ts:29`
```ts
sameSite: 'none'
```
Envoie le cookie session sur les requetes cross-site. Dangereux pour CSRF.
**Fix :** Changer a `sameSite: 'lax'`.

### SEC-002 : CRITIQUE — Pas de protection CSRF
**Fichier :** Routes globales
Session cookies HTTP-only sans token CSRF genere/valide pour les mutations.
**Fix :** Implementer middleware CSRF AdonisJS pour operations state-changing.

### SEC-003 : CRITIQUE — Authorization manquante sur sub-resources
**Fichier :** `backend/start/routes.ts:179-203`
Endpoints offers, documents, notes n'ont pas de middleware txPermission :
```ts
router.get('/offers/:offerId', '...')     // Pas de txPermission
router.delete('/notes/:id', '...')        // Pas d'authorization
```
Dependance sur TenantScopeService interne — pas garanti dans chaque handler.
**Fix :** Ajouter middleware explicite sur chaque route sub-resource.

### SEC-004 : CRITIQUE — Validation ownership sub-resources manquante
**Fichiers :** offers_controller.ts, conditions_controller.ts, notes_controller.ts
```ts
async show({ params }) {
  const offer = await Offer.findOrFail(params.offerId)
  // BUG: Pas de verification que auth.user possede cette transaction
}
```
**Fix :** Verifier via TenantScopeService avant de retourner.

### SEC-005 : CRITIQUE — Pas de validation MIME type upload fichiers
**Fichier :** `backend/app/controllers/transaction_documents_controller.ts`
Accepte n'importe quel type de fichier sans whitelist.
**Fix :** Whitelist : PDF, JPEG, PNG, DOCX. Max 100MB.

### SEC-006 : CRITIQUE — Unique constraint manquante sur emailVerificationToken
**Fichier :** Migrations User
Plusieurs tokens de verification pourraient exister pour le meme user.
**Fix :** `table.string('emailVerificationToken').unique().nullable()`

### SEC-007 : HAUTE — Bypass risque dans txPermission middleware
**Fichier :** `backend/app/middleware/transaction_permission_middleware.ts:80-87`
Accepte `ctx.params.transactionId` OU `ctx.params.id` — si un controller utilise un autre nom, bypass possible.
**Fix :** Specifier `paramName` explicite par route.

### SEC-008 : HAUTE — Admin routes sans validation subscriberId
**Fichier :** `backend/start/routes.ts:287-296`
Routes admin notes/tasks n'appliquent pas de validation sur le parametre `:id`.

### SEC-009 : HAUTE — Token verification timezone inconsistante
**Fichier :** `backend/app/controllers/auth_controller.ts:360`
```ts
.where('emailVerificationExpires', '>', DateTime.now().toSQL())
```
`DateTime.now()` vs `DateTime.utc()` — inconsistance timezone possible.
**Fix :** Utiliser `DateTime.utc().toSQL()`.

### SEC-010 : HAUTE — File path traversal protection faible
**Fichier :** `backend/start/routes.ts:20-61`
`path.basename()` bloque la traversal mais la reponse permet brute-force de vrais fichiers.

### SEC-011 : MOYENNE — Enumeration email via timing attack
**Fichier :** `backend/app/controllers/auth_controller.ts:242-282`
Password reset retourne success pour tous les emails (bien) mais timing attack possible.

### SEC-012 : MOYENNE — Validation input faible endpoint public
**Fichier :** `backend/app/controllers/public_site_controller.ts:10-27`
Access code sans contrainte de longueur/caracteres.

### SEC-013 : MOYENNE — Erreurs DB exposees en dev/staging
**Fichier :** `backend/app/controllers/clients_controller.ts:61`
```ts
details: process.env.NODE_ENV !== 'production' ? String(error) : undefined
```

---

## 2. API Design

### API-001 : HAUTE — Pagination sans limite stricte
**Fichier :** `backend/app/controllers/admin_controller.ts:53-78`
Permet `limit` jusqu'a 100 par page — risque memoire avec 10k+ users.
**Fix :** Max 50, default 20.

### API-002 : MOYENNE — Format reponse inconsistant
Certains endpoints retournent `{ received: true }` (Stripe) ou `{ alreadyRegistered: true }` (waitlist) au lieu du pattern standard.

### API-003 : MOYENNE — Codes HTTP inconsistants
Mix de `response.created()` (201) et `response.ok()` (200) pour les POST.

---

## 3. Database Architecture

### DB-001 : CRITIQUE — Index manquants sur foreign keys
| Colonne | Table | Impact |
|---------|-------|--------|
| `owner_user_id` | transactions, clients | O(n) scan par user |
| `transaction_id` | conditions, documents, parties, offers | O(n) lookup |
| `template_id` | conditions | matching template |
| `condition_id` | condition_evidence | lookup preuves |

**Fix :** Creer migration avec tous les index manquants.

### DB-002 : HAUTE — Risques N+1 queries
**Fichier :** Multiples controllers
Certains endpoints chargent des relations en boucle au lieu de preload batch.
```ts
// Mauvais
for (const offer of offers) { await offer.load('revisions') }
// Bon
const offers = await Offer.query().where(...).preload('revisions')
```

### DB-003 : CRITIQUE — Transactions DB manquantes pour operations multi-step
**Fichiers :** transactions_controller.ts (store), offers_controller.ts (store)
Creation transaction + property + conditions sans `Database.transaction()`.
Si une etape echoue, donnees inconsistantes.

### DB-004 : MOYENNE — Cascading delete manquant
Certaines relations utilisent `onDelete('SET NULL')` ou rien — orphelins possibles.

### DB-005 : CRITIQUE — Unique constraint manquante emailVerificationToken
(Voir SEC-006)

---

## 4. Service Layer

### SVC-001 : HAUTE — Etat in-memory (rate limiting + site mode)
**Fichiers :** rate_limit_middleware.ts, site_mode_middleware.ts
```ts
const attempts = new Map<string, RateLimitEntry>()
let cachedMode: string | null = null
```
Perte de donnees au restart, incompatible multi-serveur, fuite memoire potentielle.
**Fix :** Migrer vers Redis pour environnement production.

### SVC-002 : MOYENNE — Error handling manquant dans PlanService
Service peut throw des exceptions non gerees lors d'echecs Stripe API.

### SVC-003 : MOYENNE — Error handling inconsistant
Mix de `console.warn`, `logger.error`, `.catch(() => {})` selon les fichiers.
**Fix :** Pattern unique via helper `handleError()`.

---

## 5. Scalabilite

### SCALE-001 : HAUTE — Dashboard charge tout en memoire
**Fichier :** `backend/app/controllers/dashboard_controller.ts`
Charge TOUTES les transactions d'un user puis filtre en JS.
Avec 10k transactions = 10k rows en memoire pour afficher un resume.
**Fix :** Utiliser aggregation SQL (`COUNT`, `SUM`, `GROUP BY`).

### SCALE-002 : MOYENNE — Connection pool non configure
Pas de configuration explicite du pool de connexions DB. Default AdonisJS = 2 connexions.
**Fix :** Configurer `pool: { min: 10, max: 50 }`.

---

## 6. Compliance / Reglementaire

### COMP-001 : MOYENNE — PIPEDA data residency non documente
Donnees immobilieres reglementees — pas de documentation sur :
- Localisation stockage (Canada?)
- Politique retention donnees
- Droit a l'oubli (suppression)

### COMP-002 : HAUTE — Session timeout trop long (7 jours)
**Fichier :** `backend/config/session.ts:19`
```ts
age: '7d'
```
Pour une plateforme financiere, 7 jours est excessif.
**Fix :** `age: '1h'` avec sliding window, ou 4h max.

---

## Roadmap Recommande

### Semaine 1 (Immediat)
1. `sameSite: 'lax'` (SEC-001)
2. Middleware txPermission sur sub-resources (SEC-003)
3. Validation MIME type upload (SEC-005)
4. Index DB sur foreign keys (DB-001)

### Semaine 2-3 (Urgent)
5. Redis pour rate limiting + site mode (SVC-001)
6. Database.transaction() pour operations multi-step (DB-003)
7. Validation ownership sub-resources (SEC-004)
8. Session timeout 1-4h (COMP-002)

### Mois 1 (Haute priorite)
9. Refactorer dashboard queries avec aggregation SQL (SCALE-001)
10. Middleware CSRF (SEC-002)
11. emailVerificationToken unique (SEC-006)
12. Endpoint suppression donnees PIPEDA (COMP-001)

### Mois 2 (Moyenne priorite)
13. Standardiser format reponse API (API-002)
14. Error handling consistent (SVC-003)
15. Connection pool DB (SCALE-002)
