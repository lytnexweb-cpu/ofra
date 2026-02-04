# Session 2026-02-01 - Log des Décisions

**Date:** 2026-02-01
**Participants:** Sam (PO) + Équipe BMAD (Party Mode)
**Objectif:** Tests Epic 8 + Validation architecture

---

## Décisions Prises

### D28: Timeline universelle pour tous les profils

**Date:** 2026-02-01
**Proposé par:** Sam (question de validation)
**Validé par:** Équipe BMAD (unanime)

**Décision:**
Les 8 étapes du workflow NB sont **universelles** et s'appliquent à tous les profils de propriété (house, condo, land).

**Détails:**
- Timeline = constante (8 étapes pour tous)
- Conditions = variables (selon profil via `appliesWhen`)
- Même squelette, conditions différentes

**Profils validés:**
| Profil | Compatible 8 étapes |
|--------|---------------------|
| Maison urbaine | ✅ |
| Maison rurale | ✅ |
| Condo | ✅ |
| Terrain | ✅ |

---

### D29: Conditions universelles + Empty State intelligent

**Date:** 2026-02-01
**Proposé par:** Sally (UX) + Équipe
**Validé par:** Sam (PO)
**Révisé par:** ChatGPT (recommandation niveau inspection)

**Décision:**
Implémenter **Option 1 + Option 2** pour résoudre le problème UX des étapes vides.

**Option 1 — Conditions Universelles (pack: 'universal'):**

| Étape | Condition | Niveau | Source | Justification |
|-------|-----------|--------|--------|---------------|
| 2 | Pré-qualification / pré-approbation vérifiée | required | industry | Standard |
| 2 | Motivation acheteur confirmée | recommended | best_practice | Nice-to-have |
| 3 | Inspection générale commandée | required | industry | Standard |
| 3 | Résultats inspection — acceptables | **required** | industry | ⚠️ Pas blocking car peut être N/A si pas d'inspection |
| 3 | Dépôt initial reçu | blocking | legal | Vrai mur légal |
| 4 | Toutes conditions contractuelles levées | blocking | legal | **LE** vrai mur |

**Micro-règle importante (ChatGPT):**
> Si une transaction est cash ou sans inspection, l'agent utilisera `not_applicable` (avec note) → audit OK.
> Donc "inspection results" en `required` est plus robuste qu'en `blocking`.

**Option 2 — Empty State Intelligent:**
Si aucune condition à une étape, afficher :
> "Aucune condition requise à cette étape. Vous pouvez ajouter des conditions personnalisées si nécessaire."

**Impact:**
- Meilleure première impression utilisateur
- Guidance claire même si vide
- Couvre le cas "maison simple"
- Respecte D4 (blocking/required/recommended + audit)

---

### D30: Skip Step — Validation Contextuelle

**Date:** 2026-02-01
**Proposé par:** Sam (PO)
**Validé par:** Équipe BMAD

**Décision:**
Implémenter une validation **contextuelle** pour "Passer l'étape" qui s'adapte au type de conditions présentes.

**Règles de validation:**
| Conditions présentes | Mode | UX |
|---------------------|------|-----|
| Blocking et/ou Required | **Strict** | Type-to-confirm + checkbox CGU |
| Seulement Recommended | **Simple** | Confirmation basique "Êtes-vous sûr?" |
| Aucune condition | **Simple** | Confirmation basique |

**Messages personnalisés selon le contexte:**
| Situation | Message FR |
|-----------|------------|
| Blocking seulement | "X condition(s) bloquante(s) non résolue(s)" |
| Required seulement | "X condition(s) requise(s) non résolue(s)" |
| Mix Blocking+Required | "X bloquante(s) et Y requise(s) non résolue(s)" |
| Recommended seulement | "Êtes-vous sûr?" + hint "X seront archivées" |

**Spécifications (mode strict):**
| Élément | Détail |
|---------|--------|
| Phrase FR | `je veux quand même passer cette étape` |
| Phrase EN | `I still want to skip this step` |
| Validation | Case-insensitive (trim + toLowerCase) |
| Checkbox | Acceptation des conditions d'utilisation obligatoire |
| Bouton | Désactivé jusqu'aux 2 conditions remplies |

**Impact UX:**
- Protection renforcée pour actions critiques (blocking/required)
- Expérience fluide pour cas simples (recommended)
- Messages contextuels clairs
- Lien vers les CGU pour la transparence légale

**Fichiers modifiés:**
- `frontend/src/components/transaction/ActionZone.tsx` — Modal contextuel
- `frontend/src/components/ui/Button.tsx` — Ajout variante `warning`
- `frontend/src/i18n/locales/fr/common.json` — Clés `skipConfirmModal` enrichies
- `frontend/src/i18n/locales/en/common.json` — Idem

---

### D31: Annulation et Suppression de Transaction

**Date:** 2026-02-01
**Proposé par:** Sam (PO)
**Validé par:** Vote BMAD (5-4 pour Option D)

**Décision:**
Implémenter **deux actions distinctes** pour gérer les transactions non désirées.

**Annulation (Soft Delete) :**
| Élément | Détail |
|---------|--------|
| Accès | Bouton visible dans TransactionHeader |
| Confirmation | Modal simple avec dropdown "Raison" |
| Raisons | Offre refusée, Acheteur retiré, Financement refusé, Autre |
| Effet | `status = 'cancelled'`, données conservées |
| Audit | Event dans timeline |

**Suppression (Hard Delete) :**
| Élément | Détail |
|---------|--------|
| Accès | Menu "..." (caché) |
| Confirmation | Type-to-confirm + checkbox CGU |
| Phrase FR | `supprimer définitivement` |
| Phrase EN | `permanently delete` |
| Effet | DELETE en base, données effacées |
| Redirection | `/transactions` après succès |

**Filtre Liste :**
- Transactions annulées masquées par défaut
- Toggle pour afficher/masquer les annulées

**Fichiers à modifier :**
- Backend: `transactions_controller.ts` (PATCH cancel)
- Frontend: `TransactionHeader.tsx`, `TransactionsPage.tsx`
- Traductions: FR/EN

---

## Bugs Corrigés Cette Session

| # | Bug | Fichier | Fix |
|---|-----|---------|-----|
| 1 | `column "status" does not exist` | `reminder_service.ts` | Supprimé `.whereNotIn('status', ...)` |
| 2 | Modal ne ferme pas après création | `CreateTransactionModal.tsx` | Race condition React Query - appel direct `resetForm()` + `onClose()` dans `onSuccess` |
| 3 | 500 error sur /advance | `conditions_engine_service.ts` + `transactions_controller.ts` | Ajout codes d'erreur proper + handler E_REQUIRED_RESOLUTIONS_NEEDED |
| 4 | Message ActionZone pas réactif | `ConditionsTab.tsx` + `ActionZone.tsx` | Invalidation `advance-check` après toggle/advance |

---

## Bugs EN ATTENTE (À Corriger)

### BUG-5: Doublons de conditions à chaque étape ⚠️

**Statut:** Fix codé, transactions existantes à nettoyer

**Cause racine:**
- Legacy system: `createConditionsFromTemplate()` crée conditions depuis `workflow_step_conditions`
- Premium system: `createConditionsFromProfile()` crée conditions depuis `condition_templates`
- Les DEUX s'exécutaient → doublons

**Fix appliqué:** `workflow_engine_service.ts`
```
if (profile exists) → Premium conditions UNIQUEMENT
else → Legacy conditions UNIQUEMENT
```

**TODO:**
- [ ] Nettoyer les doublons sur transactions existantes (script ou manuel)
- [ ] Tester nouvelle transaction pour confirmer fix

---

## Idées Notées (Backlog)

| Idée | Priorité | Epic |
|------|----------|------|
| TTS Voices pour agents BMAD | Post-Epic 8 | Polish |
| Packs de conditions personnalisés (user) | À discuter | Futur |
| Workflow personnalisé (étapes custom) | À discuter | Futur |

---

## Tests Effectués

| Test | Résultat |
|------|----------|
| Advance step 3→4→5 | ✅ OK |
| Archivage conditions | ✅ OK (4 conditions) |
| Blocking system | ✅ OK |
| Pack conditions chargement | ✅ OK |

---

**Dernière mise à jour:** 2026-02-01
**Maintenu par:** Paige (Tech Writer)
