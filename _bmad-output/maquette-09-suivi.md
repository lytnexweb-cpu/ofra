# Maquette 09 — Créer/Éditer Transaction — Suivi d'implémentation

## Décisions d'équipe (validées par Sam)

### Décisions architecturales
1. **Page unifiée Create + Edit** — un seul formulaire, deux modes (create = champs vides, edit = pré-remplis + change tracking)
2. **3 onglets** (Bien, Parties, Dates) — ~~Params~~ supprimé (notes/tags/langue gérés ailleurs)
3. **Routes** : `/transactions/new` (create) + `/transactions/:id/edit` (edit)

### Décisions fonctionnelles
4. **MLS retiré** — pas utilisé au NB, champ supprimé (pas de remplacement PID pour l'instant)
5. **Province = NB fixe** — une seule option pour l'instant
6. **Ville = dropdown villes NB** — ~60 villes principales du Nouveau-Brunswick
7. **Profil propriété intégré dans l'onglet Bien** — fusionné avec localisation (type bien, contexte, financé, puits, fosse septique)
8. **Parties dès la création** — l'onglet Parties réutilise le PartiesModal existant (571 lignes, CRUD complet, 7 rôles)
9. **PropertyProfileCard** sur page detail reste en lecture seule — pas de page dédiée

### Décisions Documents (M08 refactor)
10. **DocumentStatusBar** — compteurs compacts dans la page detail (validées/attente/manquantes)
11. **Compteurs = conditions uniquement** — les documents généraux ne comptent PAS dans les badges
12. **DocumentsDrawer** — clic sur un compteur ouvre un Sheet latéral pré-filtré sur cette catégorie
13. **Documents généraux** (offre, identité, etc.) visibles dans le drawer mais pas dans les compteurs
14. **Documents-preuves** liés à une condition → comptés dans les badges, servent de preuve

### Ce qui ne change PAS
- PartiesCard + PartiesModal existants (M13) restent intacts
- PropertyProfileCard sur page detail reste en lecture seule
- NotesSection sur page detail gère les notes
- CreateTransactionModal existant sera remplacé par navigation vers `/transactions/new`

## Source
- Maquette HTML : `maquettes/09-editer-transaction.html`
- 5 états : A (Formulaire), B (Confirmation modal), C (Succès), D (Erreurs validation), E (Verrouillée)
- **ARCHITECTURE** : Page complète (pas une modale) avec 3 onglets + sidebar

## Backend existant
- **Transaction Model** : `backend/app/models/transaction.ts`
- **Property Model** : `backend/app/models/property.ts` — address, city, postalCode, province, ~~mlsNumber~~ (à retirer)
- **Controller** : `backend/app/controllers/transactions_controller.ts` — update (property fields inline déjà ajouté)
- **Validator** : `backend/app/validators/transaction_validator.ts` — updateTransactionValidator (property fields déjà ajouté)
- **TransactionProfile** : `backend/app/models/transaction_profile.ts` — propertyType, propertyContext, isFinanced
- **PartiesModal** : `frontend/src/components/transaction/PartiesModal.tsx` (571 lignes, réutilisé tel quel)

## Plan d'implémentation

### PHASE A : Refactor Documents (M08 → StatusBar + Drawer)

#### Étape A1 : DocumentStatusBar ✅
**Fichier** : `frontend/src/components/transaction/DocumentStatusBar.tsx` (nouveau)
**Contenu** :
- Card compact 1 ligne avec 3 badges cliquables : 🟢 Validées, 🟡 En attente, 🔴 Manquantes
- Query conditions pour compter les statuts de preuves
- Compteurs = conditions uniquement (pas les documents généraux)
- onClick par badge → ouvre drawer pré-filtré
**Status** : ✅ Commit 2693e12

#### Étape A2 : DocumentsDrawer ✅
**Fichier** : `frontend/src/components/transaction/DocumentsDrawer.tsx` (nouveau)
**Contenu** :
- Sheet latéral (pattern MembersPanel)
- Props : isOpen, onClose, filter (validated/pending/missing/all), transactionId
- Réutilise DocumentsSection existant à l'intérieur (compact mode)
- Upload/Proof/Version modales fonctionnent depuis le drawer
**Status** : ✅ Commit 2693e12

#### Étape A3 : Câblage page detail ✅
**Fichier** : `frontend/src/pages/TransactionDetailPage.tsx` (modifié)
**Contenu** :
- DocumentsSection retirée du scroll principal
- DocumentStatusBar ajouté sous PropertyProfileCard
- DocumentsDrawer câblé (ouvert via StatusBar badges)
- State : docsDrawerOpen + docsDrawerFilter
- DocumentsSection: props initialFilter + compact pour mode drawer
**Status** : ✅ Commit 2693e12

### PHASE B : Page Create/Edit Transaction (M09)

#### Étape B1 : Backend — Retirer MLS ✅
**Status** : ✅ Commit 8078e18
- Migration drop mls_number, model, validator, controller, API, i18n nettoyés

#### Étape B2-B8 : Page edit complète ✅
**Status** : ✅ Commit 0c6ea8e
- 3 onglets (Bien, Parties, Dates), sidebar, barre mobile
- Profil propriété intégré (type/contexte/financé/puits/septique)
- Ville NB dropdown (64 villes), Province NB fixe
- 5 états : formulaire, confirmation, succès, erreurs, verrouillée
- Change tracking temps réel, route /transactions/:id/edit

#### Étape B9 : i18n + nettoyage ✅
**Status** : ✅ Commit 2c267ea
- 100+ clés editTransaction FR/EN
- TypeScript compile ✅

## Villes du NB (dropdown)
Moncton, Fredericton, Saint John, Dieppe, Riverview, Miramichi, Bathurst, Edmundston, Campbellton, Oromocto, Shediac, Tracadie, Woodstock, Sussex, Sackville, Caraquet, Grand Falls, Dalhousie, Rothesay, Quispamsis, Hampton, Petitcodiac, Neguac, Bouctouche, Richibucto, Saint Andrews, St. Stephen, Hartland, Florenceville-Bristol, Perth-Andover, Shippagan, Lamèque, Beresford, Nigadoo, Petit-Rocher, Bertrand, Saint-Quentin, Kedgwick, Atholville, Tide Head, Rexton, Saint-Louis de Kent, Rogersville, Blackville, Doaktown, Grand Bay-Westfield, McAdam, Plaster Rock, Chipman, Norton, Hillsborough, Salisbury, Cap-Pelé, Memramcook, Cocagne, Grande-Anse, Paquetville, Saint-Léonard, Drummond, Clair, Baker Brook, Saint-François-de-Madawaska

## Commits
| # | Hash | Description |
|---|------|-------------|
| A1-A3 | 2693e12 | Phase A : StatusBar + Drawer + câblage page detail |
| B1 | 8078e18 | Backend : retirer MLS |
| B2-B8 | 0c6ea8e | Page edit complète — 3 onglets + sidebar + 5 états |
| B9 | 2c267ea | i18n FR/EN complet |

### PHASE C : UX Overhaul (validé Sally — hybride Murat)

**Problème identifié** : Les Sheet latéraux droits (DocumentsDrawer, MembersPanel, ExportSharePanel) combinés au menu vertical gauche créent un effet « deux barres verticales » étouffant sur desktop.

**Décision validée** :
- ❌ **Zéro Sheet côté droit** sur desktop
- ✅ **Documents** → section inline collapsible dans la page (compteurs toujours visibles, détails extensibles)
- ✅ **Members** → Dialog centré large (max-w-2xl)
- ✅ **Export** → Dialog centré compact (max-w-md)
- ✅ **Profil propriété (edit page)** → cartes cliquables avec icônes (au lieu de dropdowns)
- ✅ **CreateTransactionModal** → supprimé, navigation vers `/transactions/new`
- ✅ **autoConditionsEnabled** → toggle ajouté dans la page create/edit

#### Étape C1 : Documents inline collapsible ✅
**Fichiers** : `TransactionDetailPage.tsx` (modifié), `DocumentsDrawer.tsx` (supprimé)
- DocumentStatusBar déplacé après OffersPanel
- Clic badge → expand/collapse section inline avec filtre correspondant
- DocumentsSection réutilisé en mode compact à l'intérieur
- Clic même badge = collapse, clic autre badge = change filtre
**Status** : ✅ Fait

#### Étape C2 : MembersPanel → Dialog centré ✅
**Fichier** : `MembersPanel.tsx` (modifié)
- Sheet → Dialog (max-w-2xl), contenu identique
- Suppression useMediaQuery + logique side
**Status** : ✅ Fait

#### Étape C3 : ExportSharePanel → Dialog centré ✅
**Fichier** : `ExportSharePanel.tsx` (modifié)
- Sheet → Dialog (max-w-md), contenu identique
- Suppression useMediaQuery + logique side
**Status** : ✅ Fait

#### Étape C4 : Profil propriété en cartes icônes ✅
**Fichier** : `EditTransactionPage.tsx` (modifié)
- propertyType : Maison (Home), Condo (Building2), Terrain (TreePine) → cartes cliquables
- propertyContext : Urbain (Building), Banlieue (Home), Rural (Mountain) → cartes cliquables
- Style : border-2, selected = primary/5, modified = amber bg
**Status** : ✅ Fait

#### Étape C5 : Supprimer CreateTransactionModal ✅
**Fichiers** : `CreateTransactionModal.tsx` (supprimé), `TransactionsPage.tsx` (modifié), `router.tsx` (modifié), `EditTransactionPage.tsx` (modifié)
- Bouton « Nouvelle transaction » → `navigate('/transactions/new')`
- Route `/transactions/new` → EditTransactionPage (mode create)
- Mode create : sélection client, champs vides, workflow auto-select, profil complet, confirmation modal
- Mode edit : change tracking conservé tel quel
**Status** : ✅ Fait

#### Étape C6 : Toggle autoConditionsEnabled ✅
**Fichier** : `EditTransactionPage.tsx` (modifié)
- Toggle dans CreateSidebar (visible en mode create, sidebar desktop)
- autoConditionsEnabled fait partie du FormData, envoyé dans CreateTransactionRequest
- Default = user.preferAutoConditions (from onboarding)
**Status** : ✅ Fait

## Design tokens (cohérence)
- Primary : `#1e3a5f`
- Accent : `#e07a2f`
- Modified field : `bg-[#fffbeb]` (amber tint), dot `bg-amber-400`, note `text-amber-600`
- Error field : `border-2 border-red-300 bg-red-50/30`, label `text-red-600`
- Locked : `opacity-60 pointer-events-none`, banner `bg-stone-100 border-stone-300`
- Tab active : `border-b-2 border-[#1e3a5f] text-[#1e3a5f]`
- Tab inactive : `text-stone-500 hover:text-stone-700`
- StatusBar badges : 🟢 `bg-emerald-100 text-emerald-700` · 🟡 `bg-amber-100 text-amber-700` · 🔴 `bg-red-100 text-red-700`
