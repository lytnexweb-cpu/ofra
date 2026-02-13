# Maquette 12 — Ajouter une offre — Suivi d'implémentation

## Décisions d'équipe

### Architecture
1. **D1 — Réécriture complète** — Le CreateOfferModal existant (single-column, 3-step flow) est remplacé par une implémentation conforme maquette (two-column, direct submit)
2. **D2 — Custom modal** — createPortal au lieu de Radix Dialog pour contrôle total (bottom sheet mobile, two-column layout)
3. **D3 — Pack recommandé** — Déterminé automatiquement par le profil transaction (isFinanced→finance_nb, condo→condo_nb, rural→rural_nb, default→universal)
4. **D4 — Pack application** — Preview des templates en local, application via `packsApi.applyPack()` après création de l'offre
5. **D5 — Gating packs** — Déporté dans une conversation séparée (Starter=standard only, upgrades=more packs)

### Backend existant (zéro modification)
- ✅ OffersController (CRUD + accept/reject/withdraw)
- ✅ OfferPacksController (listPacks, getTemplates, applyPack)
- ✅ OfferService (create, addRevision, accept, reject, withdraw)
- ✅ Validators (createOfferValidator, addRevisionValidator)
- ✅ Routes complètes pour offers et condition-packs
- ✅ OfferRevision model avec tous les champs (deposit, closingDate, inspection, inclusions, message)

## Source
- Maquette HTML : `maquettes/12-ajouter-offre.html`
- 6 états : A (Form vide), B (Erreurs validation), C (Pack chargé), D (Succès), E (Permission error), F (Server error)

## Plan d'implémentation

### Étape 1 : Type update OfferRevision ✅
**Status** : ✅
- Ajout des champs manquants dans `transactions.api.ts`: depositDeadline, closingDate, inspectionRequired, inspectionDelay, inclusions, message

### Étape 2 : Réécriture CreateOfferModal ✅
**Status** : ✅
- ~1050 lignes, custom modal avec createPortal
- Two-column layout (form | packs)
- Mobile bottom sheet (rounded-t-2xl, drag handle, accordion)
- 6 états complets (A/B/C → form, D → success, E → perm-error, F → server-error)

### Étape 3 : Form fields complets ✅
**Status** : ✅
- Type segmented (Offre/Contre-offre)
- Montant offert + hint prix demandé
- Dépôt + Date limite dépôt (2-col grid)
- Date de clôture
- Expiration pills (24h/48h/7j/Custom)
- Financement toggle + champ conditionnel
- Inspection toggle + champ conditionnel
- Inclusions/Exclusions textarea
- Message optionnel textarea
- Summary card live (prix demandé vs offert, diff, expiration, conditions)

### Étape 4 : Right column — Packs ✅
**Status** : ✅
- Pack recommandé card (gift icon → "Charger")
- Pack loaded card (checkmark vert, success state)
- Pack chips (all packs from API)
- Conditions list (empty state + loaded templates with badges)
- "Gérer en détail" link

### Étape 5 : Validation State B ✅
**Status** : ✅
- Error banner top (count + message)
- Inline field errors (red border, bg-red-50)
- 5 validation rules: montant requis, dépôt > montant, date passée, expiration requise, financement requis

### Étape 6 : Success State D ✅
**Status** : ✅
- Small modal (400px), green checkmark
- Info card: type, montant, expiration, conditions, notification
- "Voir dans la timeline" + "Fermer"

### Étape 7 : Error States E + F ✅
**Status** : ✅
- State E: Lock icon amber, warning card, role info, "Demander l'accès"
- State F: AlertTriangle red, error card, code/timestamp, "Réessayer" + "Copier les détails"

### Étape 8 : i18n ✅
**Status** : ✅
- 78 clés `addOffer.*` FR/EN
- Namespace séparé de `transaction.createOffer` (legacy)

## Commits
| # | Hash | Description |
|---|------|-------------|
| 1 | 275cf25 | Étapes 1-8 + audit conformité 7/7 corrigé |

## Status final : MAQUETTE 12 — CONFORME 100% ✅
