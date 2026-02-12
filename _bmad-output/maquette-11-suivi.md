# Maquette 11 — Permissions & Rôles — Suivi d'implémentation

## Décisions d'équipe (validées par Sam)

### Décisions architecturales
1. **D1 — Page dédiée** — `/transactions/:id/access` (pas un Dialog)
2. **D2 — Navigation Header** — bouton Permissions navigue vers `/access` au lieu d'ouvrir le Dialog MembersPanel
3. **D3 — Lien public** — Réutilise `shareLinksApi`, toggle + redirect vers `/export` pour configurer
4. **D4 — Matrice permissions** — Statique, pas d'API, tableau de référence visuel
5. **D5 — Journal des accès** — Endpoint `GET /api/transactions/:id/activity` existant, filtre client-side par types `member_*`

### Backend existant (zéro modification)
- ✅ Model `TransactionMember` (viewer/editor/admin + pending/active/revoked)
- ✅ Controller CRUD (index/store/update/destroy)
- ✅ Middleware `txPermission` avec hiérarchie viewer→editor→admin→owner
- ✅ Routes GET/POST/PATCH/DELETE pour members
- ✅ Validators (inviteMemberValidator, updateMemberRoleValidator)
- ✅ ActivityFeedService log `member_invited`, `member_role_changed`, `member_removed`
- ✅ Endpoint activité paginé `GET /transactions/:id/activity`

## Source
- Maquette HTML : `maquettes/11-permissions-roles.html`
- 6 états : A (Liste), B (Inviter), C (Invitation envoyée), D (Changement rôle), E (Retrait accès), F (Erreur permission)

## Plan d'implémentation

### Étape 1 : Vérification backend activity feed ✅
**Status** : ✅ Aucune modification nécessaire
- Endpoint `/api/transactions/:id/activity` déjà existant
- Frontend API client `transactionsApi.getActivity()` déjà typé
- Types `member_invited`, `member_role_changed`, `member_removed` déjà loggés

### Étape 2 : Page layout + routing ✅
**Status** : ✅
- `PermissionsPage.tsx` créé
- Route `/transactions/:id/access` dans router.tsx
- Header breadcrumb, titre avec Lock icon, badges (Active, N membres)
- Bouton "Inviter" primary dans le header

### Étape 3 : Liste des membres ✅
**Status** : ✅
- Owner row verrouillé (menu disabled + tooltip)
- Active members avec dropdown rôle + bouton delete
- Pending members avec badge amber, "Renvoyer" + X
- Avatar initiales avec couleurs alternées
- Highlight amber sur changement rôle (État D)

### Étape 4 : Section lien public + matrice permissions ✅
**Status** : ✅
- Toggle ON/OFF réutilisant shareLinksApi
- Info box quand inactif
- Matrice 7 actions × 4 rôles (checkmarks/X statiques)

### Étape 5 : Modal B (Inviter) + Modal C (Invitation envoyée) ✅
**Status** : ✅
- Modal invite : email + radio cards 3 rôles + message optionnel
- Gating : bouton disabled tant que email invalide
- Modal confirmation : icône emerald, détails, hint texte

### Étape 6 : État D (Toast + highlight + journal) ✅
**Status** : ✅
- Toast emerald en haut (auto-dismiss 4s)
- Row highlight bg-amber-50/50 + badge "était Admin"
- Journal des accès filtré par types member_*
- Time ago relatif (minutes/heures/jours)

### Étape 7 : Modal E (Retrait accès) + Modal F (Erreur permission) ✅
**Status** : ✅
- Modal remove : warning red, user card, checkbox confirmation, bouton gated
- Modal permission : warning amber, détails rôle/requis/owner, "Demander l'accès"

### Étape 8 : i18n + navigation Header → page ✅
**Status** : ✅
- 55+ clés `permissionsPage.*` FR/EN
- TransactionDetailPage : `onOpenMembers` → navigate `/access`
- Mobile bottom sheet (items-end, rounded-t-2xl, drag handle) sur 4 modales
- TypeScript compile ✅

## Commits
| # | Hash | Description |
|---|------|-------------|
| 1 | bfdeb2b | Étapes 1-8 : page complète + i18n + routing |

## Status final : MAQUETTE 11 — IMPLÉMENTÉE ✅

## Design tokens
- Primary : `#1e3a5f`
- Accent : `#e07a2f`
- Owner badge : `bg-[#1e3a5f]/10 text-[#1e3a5f]`
- Admin badge : `bg-amber-100 text-amber-700`
- Editor badge : `bg-blue-100 text-blue-700`
- Viewer badge : `bg-stone-100 text-stone-500`
- Toggle ON : `bg-[#1e3a5f]`, OFF : `bg-stone-300`
- Toast : `bg-emerald-600 text-white`
- Highlight row : `bg-amber-50/50`
- Error card : `border-red-200`, Warning card : `border-amber-200`
