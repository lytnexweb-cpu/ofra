# Maquette 08 — Documents & Preuves — Suivi d'implémentation

## Source
- Maquette HTML : `maquettes/08-documents-preuves.html`
- 5 états : A (Liste), B (Upload modal), C (Preuve condition), D (Versioning), E (Erreurs)

## Backend existant (COMPLET — rien à modifier)
- **Model** : `backend/app/models/transaction_document.ts` — id, transactionId, conditionId, category, name, fileUrl, fileSize, mimeType, status (missing/uploaded/validated/rejected), version, parentDocumentId, tags, rejectionReason, validatedBy/At, uploadedBy
- **Controller** : `backend/app/controllers/transaction_documents_controller.ts` — 7 endpoints (index, store, show, update, validate, reject, destroy)
- **Routes** : `backend/start/routes.ts` lignes 155-162
- **Validators** : `backend/app/validators/transaction_document_validator.ts` — createDocumentValidator, updateDocumentValidator, rejectDocumentValidator
- **API frontend** : `frontend/src/api/documents.api.ts` — documentsApi avec list, get, create, update, validate, reject, delete
- **Evidence API** : `frontend/src/api/conditions.api.ts` — uploadEvidence, getEvidence, addEvidence, removeEvidence

## Frontend existant (à RÉÉCRIRE/CRÉER)
- `frontend/src/components/transaction/DocumentsSection.tsx` — CRUD basique, NE suit PAS la maquette → **RÉÉCRIRE** pour État A
- `frontend/src/components/transaction/DocumentsTab.tsx` — Affichage simple des docs par condition → **GARDER** (usage différent)
- `frontend/src/components/transaction/EvidenceUploader.tsx` — Drag-and-drop upload → **RÉUTILISER** dans État B
- `frontend/src/components/transaction/EvidenceBadge.tsx` — Badge preuve → **GARDER**

## Plan d'implémentation par étape

### Étape 1 : État A — Liste documents par catégorie ✅
**Fichier** : `frontend/src/components/transaction/DocumentsSection.tsx` (réécriture)
**Contenu** :
- Header avec titre + bouton "Ajouter un document"
- 4 compteurs : Total, Valides (emerald), En attente (amber), Manquants (red)
- Catégories : Offre, Inspection, Financement, Identité, Autres
- Cards document : icône 9x9, nom tronqué, badge status, métadonnées, bouton download
- Cards manquant : border-dashed red, badge "Manquant" + "Bloquante", bouton "Uploader"
- Badge "Preuve jointe" (indigo) quand lié à condition
- Badge version (stone) quand version > 1
**Status** : ✅ Commit 973c53c

### Étape 2 : État B + E — Modal upload + erreurs ✅
**Fichier** : `frontend/src/components/transaction/UploadDocumentModal.tsx` (nouveau)
**Contenu** :
- Bottom-sheet pattern (comme toutes les modales)
- Header : icône cloud-upload primary/10
- Drop zone : border dashed, hover/drag-over states
- Fichier sélectionné : card emerald avec remove
- Champs : catégorie (select required), nom document (input), association condition (select), tags (chips + ajout)
- Hint ambre si condition bloquante sélectionnée
- Erreurs intégrées : tooLarge (red), badFormat (red), network (amber + retry)
- Footer : Annuler + Enregistrer (primary)
**Status** : ✅ Commit a399d56

### Étape 3 : État C — Modal preuve condition ✅
**Fichier** : `frontend/src/components/transaction/DocumentProofModal.tsx` (nouveau)
**Contenu** :
- Header : icône shield red-100, titre "Preuve — {condition}", subtitle level badge
- Info card condition : badge level (emerald/amber/red), titre, "Preuve requise : OUI"
- Cycle de vie vertical : 3 étapes (Manquant done, Uploadé active, Validé/Refusé future)
- Document actuel : card primary/5 avec preview/download
- Textarea commentaire validation
- Footer 3 boutons : Fermer, Refuser (red border), Valider (emerald)
**Status** : ✅ Commit 6de69f2

### Étape 4 : État D — Modal versioning ✅
**Fichier** : `frontend/src/components/transaction/DocumentVersionModal.tsx` (nouveau)
**Contenu** :
- Header : icône RefreshCw indigo-100, titre "Historique versions", subtitle nom fichier
- Version actuelle : card emerald avec badges "vN — Active" + status, Eye/Download
- Versions précédentes : cards stone opacity-70, badge "vN — Remplacée" + status
- Journal d'activité : timeline verticale (validated=emerald, uploaded=primary, rejected=red, added=stone)
- Footer : Fermer + "Remplacer (uploader vN)" primary
**Status** : ✅ Commit bd874b9

### Étape 5+6 : Câblage + i18n ✅
**Fichier** : `frontend/src/pages/TransactionDetailPage.tsx` (modifié)
**Contenu** :
- Import DocumentsSection, UploadDocumentModal, DocumentProofModal, DocumentVersionModal
- States : uploadOpen, proofDoc, versionDoc
- Documents query pour alimenter previousVersions du version modal
- DocumentsSection câblé avec callbacks onUpload/onViewProof/onViewVersions
- 3 modales câblées avec open/close logic
- "Remplacer" ferme version modal et ouvre upload modal
- TypeScript compile ✅
- Clés i18n logValidated/logUploaded/logRejected/logAdded corrigées dans FR+EN
**Status** : ✅ Commit (pending)

## Commits
| # | Hash | Description |
|---|------|-------------|
| 0 | 02b91e3 | feat: maquette 05 + fixes UX (commit pré-M08) |
| 1 | 973c53c | Étape 1 : État A — Liste documents |
| 2 | a399d56 | Étape 2 : État B+E — Modal upload + erreurs |
| 3 | 6de69f2 | Étape 3 : État C — Modal preuve |
| 4 | bd874b9 | Étape 4 : État D — Modal versioning |
| 5 | — | Étape 5+6 : Câblage final |

## Design tokens (cohérence)
- Primary : `#1e3a5f`
- Accent : `#e07a2f`
- Bottom-sheet mobile : `items-end sm:items-center`, `rounded-t-2xl sm:rounded-2xl`
- Labels : `text-xs font-semibold text-stone-600 uppercase tracking-wide`
- Inputs : `rounded-lg border border-stone-200 focus:ring-2 focus:ring-[#1e3a5f]/20`
- CTA disabled : `bg-stone-300 text-stone-500 cursor-not-allowed`
- Badge status : rounded-full text-[10px] font-medium
