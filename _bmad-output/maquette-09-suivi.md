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

#### Étape B1 : Backend — Retirer MLS ❌
**Fichiers** : migration, property model, validator, controller, API frontend, i18n
**Contenu** :
- Migration : drop colonne `mls_number`
- Model Property : retirer `mlsNumber`
- Validators : retirer champ
- Controller : retirer du destructuring
- API frontend : retirer de l'interface
- i18n FR/EN : retirer les clés MLS
**Status** : ❌ Non commencé

#### Étape B2 : Page layout + routing + onglets ❌
**Fichier** : `frontend/src/pages/EditTransactionPage.tsx` (réécriture complète)
**Contenu** :
- Routes : `/transactions/new` (create) + `/transactions/:id/edit` (edit)
- Header : breadcrumb, titre dynamique (Créer/Modifier), boutons Annuler/Enregistrer
- Navigation 3 onglets : Bien, Parties, Dates
- Sidebar résumé des changements (desktop) + barre mobile
- Skeleton loading
**Status** : ❌ Non commencé

#### Étape B3 : Onglet Bien (localisation + profil propriété) ❌
**Contenu** :
- **Section Localisation** : Adresse (full-width), Ville (dropdown NB), Code postal, Province (NB fixe)
- **Section Profil propriété** : Type bien (house/condo/land), Contexte (urban/suburban/rural), Financé (oui/non), Puits privé (si rural), Fosse septique (si rural)
- **Section Transaction** : Type (achat/vente), Prix ($)
- Change tracking : bg-amber-50, dot amber, "Modifié — était : X"
**Status** : ❌ Non commencé

#### Étape B4 : Onglet Parties ❌
**Contenu** :
- Affichage des parties existantes en cards résumé (lecture)
- Bouton "Gérer les parties" ouvre PartiesModal existant
- Bouton "Ajouter une partie" ouvre PartiesModal en mode ajout
- Refresh automatique après fermeture du modal
- En mode create : PartiesModal lié au transactionId une fois créé (ou flow en 2 temps)
**Status** : ❌ Non commencé

#### Étape B5 : Onglet Dates ❌
**Contenu** :
- Dates clés : closing (required), expiration offre, inspection, financement
- Change tracking comme onglet Bien
**Status** : ❌ Non commencé

#### Étape B6 : Sidebar résumé + barre mobile ❌
**Contenu** :
- Sidebar sticky desktop (w-72) : icône edit amber, "Résumé des changements", badge compteur, liste old→new
- Barre fixe mobile bottom : badge compteur + "champ(s) modifié(s)" + "Voir le résumé"
**Status** : ❌ Non commencé

#### Étape B7 : État B — Modal confirmation ❌
**Contenu** :
- Header warning amber, titre "Confirmer les modifications"
- Liste des changements (old → new)
- Checkbox confirmation + bouton gated
**Status** : ❌ Non commencé

#### Étape B8 : État C — Succès + État D — Erreurs + État E — Verrouillée ❌
**Contenu** :
- Succès : toast emerald + redirect vers detail
- Erreurs : banner rouge + liens vers champs + border-red inline
- Verrouillée : banner stone + tous champs disabled + icône lock
**Status** : ❌ Non commencé

#### Étape B9 : i18n + TypeScript + nettoyage ❌
**Contenu** :
- Clés i18n FR/EN pour tous les labels create/edit
- Dropdown villes NB dans constantes
- Supprimer/remplacer ancien EditTransactionModal
- Supprimer/remplacer ancien CreateTransactionModal par navigation
- TypeScript compile ✅
**Status** : ❌ Non commencé

## Villes du NB (dropdown)
Moncton, Fredericton, Saint John, Dieppe, Riverview, Miramichi, Bathurst, Edmundston, Campbellton, Oromocto, Shediac, Tracadie, Woodstock, Sussex, Sackville, Caraquet, Grand Falls, Dalhousie, Rothesay, Quispamsis, Hampton, Petitcodiac, Neguac, Bouctouche, Richibucto, Saint Andrews, St. Stephen, Hartland, Florenceville-Bristol, Perth-Andover, Shippagan, Lamèque, Beresford, Nigadoo, Petit-Rocher, Bertrand, Saint-Quentin, Kedgwick, Atholville, Tide Head, Rexton, Saint-Louis de Kent, Rogersville, Blackville, Doaktown, Grand Bay-Westfield, McAdam, Plaster Rock, Chipman, Norton, Hillsborough, Salisbury, Cap-Pelé, Memramcook, Cocagne, Grande-Anse, Paquetville, Saint-Léonard, Drummond, Clair, Baker Brook, Saint-François-de-Madawaska

## Commits
| # | Hash | Description |
|---|------|-------------|
| A1-A3 | 2693e12 | Phase A : StatusBar + Drawer + câblage page detail |

## Design tokens (cohérence)
- Primary : `#1e3a5f`
- Accent : `#e07a2f`
- Modified field : `bg-[#fffbeb]` (amber tint), dot `bg-amber-400`, note `text-amber-600`
- Error field : `border-2 border-red-300 bg-red-50/30`, label `text-red-600`
- Locked : `opacity-60 pointer-events-none`, banner `bg-stone-100 border-stone-300`
- Tab active : `border-b-2 border-[#1e3a5f] text-[#1e3a5f]`
- Tab inactive : `text-stone-500 hover:text-stone-700`
- StatusBar badges : 🟢 `bg-emerald-100 text-emerald-700` · 🟡 `bg-amber-100 text-amber-700` · 🔴 `bg-red-100 text-red-700`
