# Phase 1 — Audit Code Quality
## Auditrice : Amelia (Senior Dev) — 20 fev 2026

---

## Resume

| Categorie | CRITIQUE | HAUTE | MOYENNE | BASSE | Total |
|-----------|----------|-------|---------|-------|-------|
| TypeScript Strictness | 0 | 0 | 0 | 3 | 3 |
| Dead Code | 0 | 1 | 1 | 1 | 3 |
| Code Smells | 1 | 3 | 1 | 0 | 5 |
| React Issues | 0 | 2 | 2 | 0 | 4 |
| Backend Issues | 0 | 3 | 1 | 0 | 4 |
| Naming | 0 | 0 | 0 | 3 | 3 |
| Autres | 0 | 0 | 1 | 1 | 2 |
| **TOTAL** | **1** | **9** | **6** | **8** | **24** |

---

## Points Positifs

- Pas de `@ts-ignore` ou `as any` detectes
- Imports bien organises, pas de dependances circulaires
- Key props sur les listes consistants
- useEffect dependency arrays generalement corrects
- Bonne separation API layer / hooks / components
- Patterns TanStack Query coherents
- Naming PascalCase pour composants respecte partout

---

## 1. TypeScript Strictness

### TS-001 : BASSE — Type implicite dans ValidateStepModal
**Fichier :** `frontend/src/components/transaction/ValidateStepModal.tsx:205`
Parametre de fonction assume des property access sans defensive checks.

### TS-002 : BASSE — Return type manquant sur callbacks
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:255`
`useCallback` sans type de retour explicite.

### TS-003 : BASSE — Typing loose sur detection langue
**Fichier :** `frontend/src/components/transaction/ValidateStepModal.tsx:206`
`i18n.language?.substring(0, 2)` — le resultat n'est pas valide comme type `Language`.

---

## 2. Dead Code

### DC-001 : HAUTE — Parametre inutilise dans CreateSidebar
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:899`
Le prop `t` est passe mais potentiellement inutilise — risque d'erreur runtime.

### DC-002 : MOYENNE — console.warn en production
**Fichier :** `backend/app/services/offer_service.ts:369`
```ts
console.warn('[OfferService] Auto-advance failed...')
```
Devrait utiliser le logger structure.

### DC-003 : BASSE — Interface vide
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:74`
`interface OriginalData extends FormData {}` — inutile, utiliser FormData directement.

---

## 3. Code Smells

### CS-001 : CRITIQUE — Pattern copier-coller radio buttons
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:1056-1082`
Markup identique duplique pour buyer/seller radio selection.
**Fix :** Extraire un composant `<RadioOption />`.

### CS-002 : HAUTE — Client lookup repete dans le render
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:704`
```tsx
{clients.find(c => c.id === form.clientId)?.firstName}
{clients.find(c => c.id === form.clientId)?.lastName}
```
Meme `.find()` appele 2 fois — stocker dans une variable.

### CS-003 : HAUTE — Ternaires imbriquees 3 niveaux
**Fichier :** `frontend/src/pages/AccountPage.tsx:654-659`
```tsx
used > max ? 'bg-red-500' : used >= max * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
```
**Fix :** Extraire en helper `getStorageColor()`.

### CS-004 : HAUTE — EditTransactionPage trop long (1358 lignes)
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx`
5 sous-composants definis dans le meme fichier.
**Fix :** Extraire PropertyTab, PartiesTab, DatesTab, ChangesSidebar, CreateSidebar dans `components/EditTransaction/`.

### CS-005 : MOYENNE — Magic numbers
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:63`
`Math.min(100, Math.max(1, parseInt(...) || 50))` — limites hardcodees sans constantes.

---

## 4. React Issues

### RX-001 : HAUTE — Composant trop large a splitter
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx`
> 1000 lignes avec concerns melangees. Voir CS-004.

### RX-002 : HAUTE — Prop drilling 9 props
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx` → PropertyTab
Props passes : `form`, `original`, `updateField`, `validationErrors`, `t`, `isLocked`, `isCreateMode`, `clients`, `onCreateClient`.
**Fix :** Creer un `EditFormContext` avec React.createContext.

### RX-003 : MOYENNE — State derivable memoize
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:264-267`
`changes` via useMemo est acceptable ici mais pourrait etre simplifie.

### RX-004 : MOYENNE — Prop drilling general
Meme pattern dans d'autres composants transaction — a surveiller.

---

## 5. Backend Issues

### BE-001 : HAUTE — Transaction DB manquante dans workflow engine
**Fichier :** `backend/app/services/workflow_engine_service.ts:112-124`
```ts
for (const wfStep of template.steps) {
  const txStep = await TransactionStep.create({...})
}
```
Multiples writes sans wrapper `Database.transaction()`. Si un echoue, etat inconsistant.

### BE-002 : HAUTE — Methode service > 150 lignes
**Fichier :** `backend/app/services/workflow_engine_service.ts`
`createTransactionFromTemplate` depasse largement 50 lignes.
**Fix :** Splitter en `createTransactionRecord()`, `instantiateSteps()`, `activateFirstStep()`, etc.

### BE-003 : HAUTE — Chargements sequentiels sans error handling
**Fichier :** `backend/app/controllers/transactions_controller.ts:132-145`
```ts
await transaction.load('client')
await transaction.load('conditions')
```
Multiples `.load()` sequentiels — utiliser un seul preload compound ou `Promise.all`.

### BE-004 : MOYENNE — Serialisation inconsistante
**Fichier :** `backend/app/controllers/transactions_controller.ts:69-80`
Certaines reponses retournent des resultats pagines, d'autres des arrays bruts.

---

## 6. Naming

### NM-001 : BASSE — Nom trompeur `formatPrice`
**Fichier :** `frontend/src/pages/EditTransactionPage.tsx:176`
La fonction ne fait que retirer les non-digits — devrait s'appeler `removeNonNumericChars`.

### NM-002 : BASSE — Abbreviation `t` non documentee
Usage de `t` pour i18n partout mais pas documente dans les fichiers.

### NM-003 : BASSE — Conventions de nommage fichiers
Backend snake_case, frontend PascalCase — coherent dans chaque contexte.

---

## Issues Pre-existantes (NON de nos changements)

- `admin_metrics_service.ts` — erreurs TS pre-existantes
- `transactions_controller.ts:405` — erreur TS pre-existante
- Commandes cleanup — issues TS pre-existantes
- Fichiers test — issues TS pre-existantes

A adresser dans un ticket de nettoyage separe.

---

## Priorites

### Immediat
1. **CS-002** : Double `.find()` dans EditTransactionPage (perf + lisibilite)
2. **BE-001** : Ajouter `Database.transaction()` dans workflow engine (integrite donnees)
3. **DC-001** : Verifier/fixer le prop `t` dans CreateSidebar

### Sprint suivant
4. **CS-004/RX-001** : Splitter EditTransactionPage en sous-composants
5. **BE-002** : Refactorer `createTransactionFromTemplate`
6. **BE-003** : Compound preloads
7. **RX-002** : EditFormContext pour eviter prop drilling

### Backlog
8. **CS-001** : Extraire RadioOption
9. **CS-003** : Helper `getStorageColor()`
10. **DC-002** : Remplacer console.warn par logger
