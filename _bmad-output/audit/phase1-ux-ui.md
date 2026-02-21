# Phase 1 — Audit UX/UI
## Auditrice : Sally (UX Designer) — 20 fev 2026

---

## Resume

| Severite | Nombre |
|----------|--------|
| CRITIQUE | 1 |
| HAUTE | 10 |
| MOYENNE | 5 |
| BASSE | 2 |
| **Total** | **18** |

---

## 1. Internationalisation (i18n)

### I18N-001 : CRITIQUE — Strings hardcodees dans ChangeEmailForm

**Fichier :** `frontend/src/components/ChangeEmailForm.tsx`

Lignes 28, 33, 45, 50, 62, 81, 93, 109, 120, 130

Tout le composant est en anglais hardcode :
- `"Change Email"`, `"Current Email"`, `"New Email"`, `"Current Password"`
- `"Required to confirm your identity"`, `"Updating Email..." / "Update Email"`
- Messages d'erreur : `'Failed to update email'`, `'Network error...'`, etc.

**Impact :** Les utilisateurs francophones voient du texte anglais dans une feature critique.

**Fix :** Ajouter `useTranslation()` et creer les cles dans `common.json` FR/EN.

---

### I18N-002 : HAUTE — Fallback francais dans LoginPage

**Fichier :** `frontend/src/pages/LoginPage.tsx` (lignes 37, 127, 130)

```tsx
t('auth.invalidCredentials', 'Courriel ou mot de passe invalide.')
t('register.heroTagline', 'Le premier gestionnaire transactionnel du Nouveau-Brunswick')
```

**Impact :** Si les cles manquent, les users anglais voient du francais.

---

### I18N-003 : HAUTE — i18n manquant dans ConfirmDialog

**Fichier :** `frontend/src/components/ConfirmDialog.tsx` (lignes 20, 21, 71)

- `confirmLabel = 'Confirm'` et `cancelLabel = 'Cancel'` en defaut
- `'Loading...'` hardcode

---

## 2. Accessibilite (a11y)

### A11Y-001 : HAUTE — Role manquant sur ConfirmDialog overlay

**Fichier :** `frontend/src/components/ConfirmDialog.tsx` (lignes 35-40)

Le `<div>` custom manque `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.

---

### A11Y-002 : HAUTE — aria-label manquant sur SVG icons

**Fichiers :** Layout.tsx, DashboardPage.tsx, TransactionCard.tsx (multiples)

Les SVG decoratifs n'ont ni `aria-hidden="true"` ni `aria-label`.

---

### A11Y-003 : HAUTE — Tabs non navigables au clavier

**Fichier :** `frontend/src/pages/AccountPage.tsx` (lignes 270-290)

Pas de `role="tablist"`, `role="tab"`, `aria-selected`, ni navigation fleches.

---

### A11Y-004 : HAUTE — Association label/input manquante

**Fichier :** `frontend/src/components/ChangeEmailForm.tsx` (lignes 92, 108)

Certains labels n'ont pas de `htmlFor` correspondant.

---

### A11Y-005 : MOYENNE — alt manquant sur SVGs dashboard

**Fichier :** `frontend/src/components/dashboard/DashboardUrgencies.tsx` (ligne 156)

---

## 3. Responsive Design

### RD-001 : HAUTE — Largeur fixe dans AdminGensPage modal

**Fichier :** `frontend/src/pages/admin/AdminGensPage.tsx` (ligne 420)

`width: 420` hardcode — deborde sur mobile < 420px.

**Fix :** `maxWidth: 'min(calc(100% - 2rem), 420px)'`

---

### RD-002 : HAUTE — Gap non responsive dans Layout header mobile

**Fichier :** `frontend/src/components/Layout.tsx` (ligne 110)

`gap-2` sans `gap-1 sm:gap-2` — scroll horizontal possible sur 320px.

---

### RD-003 : MOYENNE — Classes responsive inconsistantes

**Fichier :** `frontend/src/pages/TransactionsPage.tsx` (lignes 120-158)

Select avec `sm:w-56` mais sans `w-full` en mobile.

---

## 4. Consistance UI

### UC-001 : HAUTE — Labels hardcodes dans ConditionCard

**Fichier :** `frontend/src/components/transaction/ConditionCard.tsx` (lignes 59-74)

```tsx
const SOURCE_LABELS = { legal: 'Legal', government: 'Government', ... }
const PACK_LABELS = { universal: 'Universal', rural_nb: 'Rural NB', ... }
```

Toujours en anglais, jamais traduit.

---

### UC-002 : HAUTE — Style d'erreur inconsistant

- LoginPage : `border-red-200` arrondi
- AccountPage : `border-l-4 border-red-500` barre laterale

**Fix :** Creer un composant `<ErrorAlert />` standardise.

---

### UC-003 : MOYENNE — Tailles de boutons inconsistantes

Mix de `h-10`, `h-11`, `py-2.5`, `py-3` selon les pages.

---

## 5. Problemes UX

### UX-001 : HAUTE — window.confirm() pour actions destructives

**Fichier :** `frontend/src/pages/AccountPage.tsx` (lignes 723-738)

Cancel subscription et logout-all utilisent `window.confirm()` natif du navigateur.

**Fix :** Utiliser le `ConfirmDialog` existant avec style app.

---

### UX-002 : HAUTE — Pas d'indicateur de chargement dans ChangeEmailForm

**Fichier :** `frontend/src/components/ChangeEmailForm.tsx` (lignes 102, 118, 128)

Les inputs sont disabled mais aucun spinner visible.

---

### UX-003 : MOYENNE — Pas de bouton retour sur VerifyEmailPage

**Fichier :** `frontend/src/pages/VerifyEmailPage.tsx`

Dead-end potentiel si l'utilisateur arrive par erreur.

---

## 6. Conformite Maquettes

### MC-001 : MOYENNE — Audit formel requis

M08-M11 : 100% conforme (audite).
M01-M07, M13 : implemente, **pas audite formellement**.
M05, M12 : a verifier.

---

## Priorites recommandees

### Immediat (Sprint courant)
1. Fix ChangeEmailForm i18n (I18N-001) — bloque FR
2. Traduire labels ConditionCard (UC-001) — bloque FR
3. Semantique dialog proper (A11Y-001)
4. aria-labels sur SVGs (A11Y-002)

### Haute priorite (Semaine 2)
5. Fix responsive modal AdminGensPage (RD-001)
6. Navigation clavier tabs (A11Y-003)
7. Standardiser alerte erreur (UC-002)
8. Remplacer window.confirm (UX-001)

### Moyenne priorite (Semaine 3)
9. Loading indicators formulaires (UX-002)
10. Standardiser tailles boutons (UC-003)
11. Associations label/input (A11Y-004)
12. Audit conformite maquettes restantes (MC-001)
