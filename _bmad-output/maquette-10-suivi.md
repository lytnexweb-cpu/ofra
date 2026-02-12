# Maquette 10 — Exporter & Partager — Suivi d'implémentation

## Décisions d'équipe (validées par Sam)

### Décisions architecturales
1. **Page dédiée** — `/transactions/:id/export` (pas un Dialog)
2. **Grille 3 colonnes desktop** — PDF, Lien partageable, Email récap
3. **Réutilisation backend existant** — PDF export, share links CRUD déjà fonctionnels
4. **Fix bugs existants** avant reshaping UI

### Bugs corrigés
- ✅ Route email ajoutée (POST /api/transactions/:id/export/email)
- ✅ Controller email() implémenté (stub avec activity log)
- ✅ Type mismatch fixé : `password` → `hasPassword` (boolean) + `role` ajouté à l'interface

## Source
- Maquette HTML : `maquettes/10-exporter-partager.html`
- 6 états : A (Normal), B (PDF en cours), C (PDF prêt), D (Lien créé), E (Email envoyé), F (Erreurs)

## Plan d'implémentation

### Étape 1 : Fix backend — route email + bug hasPassword ✅
**Status** : ✅ Commit 8c6cf3d
- Route POST /api/transactions/:id/export/email ajoutée
- ExportController.email() avec validator (recipients array, subject, message)
- TransactionShareLink interface : password → hasPassword + role ajouté
- ExportSharePanel.tsx fixé
- export.api.ts : sendEmail accepte recipients[] + subject + message

### Étape 2 : Page layout + routing ✅
**Status** : ✅ Commit 8c6cf3d
- ExportSharePage.tsx créé (600+ lignes)
- Route /transactions/:id/export dans router.tsx
- Header breadcrumb, titre, bouton Retour
- Grille lg:grid-cols-3, skeleton loading

### Étape 3 : Carte PDF ✅
**Status** : ✅ Commit 8c6cf3d
- Checkboxes (offre, conditions N actives, documents N fichiers, historique)
- Toggle watermark custom (pas checkbox)
- Select langue FR/EN
- Aperçu miniature ~N pages (dynamique selon sections cochées)
- Bouton "Générer PDF" primary

### Étape 4 : Carte Lien partageable ✅
**Status** : ✅ Commit 8c6cf3d
- Toggle "Lien actif" (options désactivées quand off)
- Radio cards : Lecture seule (Eye) / Commentaire (MessageCircle)
- Grille expiration 4 boutons : 24h, 7j, 30j, Custom
- Input mot de passe optionnel
- Bouton "Créer le lien" blue-600 (disabled quand toggle off)

### Étape 5 : Carte Email récap ✅
**Status** : ✅ Commit 8c6cf3d
- Chips destinataires (Enter pour ajouter, X pour supprimer)
- Input objet pré-rempli
- Textarea message optionnel
- Bouton "Envoyer le récap" emerald-600 (disabled sans destinataire)

### Étape 6 : Modales B-E ✅
**Status** : ✅ Commit 8c6cf3d
- État B : Modal génération — icône pulse, barre progression animée, étapes textuelles
- État C : Modal PDF prêt — check emerald, file preview card, Télécharger + Ouvrir
- État D : Modal lien créé — URL copiable (Copier/Copié!), infos 4 lignes, Fermer + Révoquer
- État E : Modal email envoyé — check emerald, liste destinataires ✓, objet info card

### Étape 7 : État F — Erreurs ✅
**Status** : ✅ Commit 8c6cf3d
- Modal erreur avec icône contextuelle (PDF/Email/Permission)
- Bouton Réessayer + Fermer
- Couleur adaptée (red pour erreur, amber pour permission)

### Étape 8 : i18n + nettoyage + TS ✅
**Status** : ✅ Commit 8c6cf3d
- 70+ clés exportPage.* FR/EN
- ExportSharePanel Dialog retiré de TransactionDetailPage
- Navigation vers /export au lieu d'ouvrir Dialog
- TypeScript compile ✅

## Commits
| # | Hash | Description |
|---|------|-------------|
| 1 | 8c6cf3d | Étapes 1-8 : page complète + fix bugs + i18n |

## Status final : MAQUETTE 10 — IMPLÉMENTÉE ✅

## Design tokens
- Primary : `#1e3a5f`
- Accent : `#e07a2f`
- PDF card icon : `bg-red-50 text-red-500`
- Link card icon : `bg-blue-50 text-blue-500`
- Email card icon : `bg-emerald-50 text-emerald-500`
- Toggle ON : `bg-[#1e3a5f]`, OFF : `bg-stone-300`
- Radio selected : `border-2 border-primary bg-primary/5`
- Error card : `border-red-200`, Warning card : `border-amber-200`
- Progress bar : `bg-primary h-2 rounded-full`
