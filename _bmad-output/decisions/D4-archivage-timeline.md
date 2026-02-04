# D4: Archivage des Conditions dans la Timeline

**Date de validation:** 2026-02-01
**Validé par:** Sam (Product Owner) + Équipe BMAD + ChatGPT (unanime)
**Statut:** GRAVÉ DANS LE MARBRE

---

## Décision

Quand une transaction avance d'étape, les conditions de l'étape précédente sont **archivées** (verrouillées en lecture seule) et groupées visuellement dans la Timeline sous leur étape d'origine.

---

## Règle d'Or

> **Quand la transaction avance d'étape, les conditions de l'étape précédente deviennent ARCHIVÉES.**

### Comportement par niveau

| Niveau | Condition pending à l'avancement | Comportement |
|--------|----------------------------------|--------------|
| **Blocking** | 🛑 IMPOSSIBLE d'avancer | Mur. L'avancement est bloqué tant que non résolue. |
| **Required** | ⚠️ Résolution explicite obligatoire | Popup avec choix + raison obligatoire |
| **Recommended** | ➡️ Auto-résolution | `not_applicable` par système |

---

## Règles Détaillées

### Blocking (Bloquant)

- **Comportement:** L'avancement est **physiquement impossible** tant qu'une condition Blocking est pending
- **Conséquence:** Une condition Blocking ne sera JAMAIS archivée non-résolue
- **Constraint DB:** `blocking` ne peut PAS avoir `resolution_type = 'skipped_with_risk'`

### Required (Requis)

L'agent peut avancer **uniquement** en choisissant une résolution explicite:

| Resolution Type | Description | Note obligatoire? |
|-----------------|-------------|-------------------|
| `completed` | Condition complétée normalement | Non |
| `waived` | Renoncé volontairement | **OUI** |
| `not_applicable` | Ne s'applique pas à cette transaction | **OUI** |
| `skipped_with_risk` | Sauté malgré le risque | **OUI** |

**Résultat:** Audit trail indélébile avec `resolved_by`, `resolved_at`, `resolution_note`.

### Recommended (Recommandé)

- **Comportement:** Peut être laissé pending sans friction
- **À l'archivage:** Auto-résolution par le système
  - `resolution_type = 'not_applicable'`
  - `resolution_note = 'Auto-archived on step change'`
  - `resolved_by = 'system'`
  - `resolved_at = NOW()`

---

## Types de Résolution

```typescript
type ResolutionType =
  | 'completed'           // Fait normalement ✅
  | 'waived'              // Renoncé volontairement
  | 'not_applicable'      // Ne s'applique pas
  | 'skipped_with_risk'   // Sauté malgré le warning ⚠️
```

### Règles de `resolution_note`

| Cas | `resolution_note` |
|-----|-------------------|
| `completed` | Optionnel |
| `waived` + Required | **OBLIGATOIRE** |
| `not_applicable` + Required | **OBLIGATOIRE** |
| `skipped_with_risk` + Required | **OBLIGATOIRE** |
| Auto-archive Recommended | Généré par système |

---

## Champs d'Audit

Chaque condition archivée porte:

| Champ | Description | Obligatoire |
|-------|-------------|-------------|
| `resolved_at` | Timestamp de résolution | Si résolu |
| `resolved_by` | User ID ou `'system'` | Si résolu |
| `resolution_note` | Raison/commentaire | Selon règles ci-dessus |
| `archived` | Boolean lecture seule | Toujours |
| `archived_at` | Timestamp du verrouillage | Si archivé |
| `archived_step` | Étape vers laquelle on a avancé (trigger) | Si archivé |
| `step_when_created` | Étape où la condition est apparue | Toujours |
| `step_when_resolved` | Étape au moment de résolution | Si résolu |

### Audit Trail Béton (4 champs clés)

1. **`created_at`** - Quand la condition a été créée
2. **`resolved_at`** - Quand elle a été résolue
3. **`archived_at`** - Quand l'étape a été franchie (verrouillage)
4. **`archived_step`** - Vers quelle étape on a avancé (simplifie les queries Timeline)

---

## Affichage Timeline (UX)

### Groupage par Étape

```
Étape 4 — Période conditionnelle
  ✅ Inspection générale — completed (Marie, 2026-01-31)
  ⚠️ Test puits — skipped_with_risk (Marie, 2026-01-31) — "Client a refusé délai"
  ✅ Financement approuvé — completed (Marie, 2026-01-30)

Étape 3 — Offre acceptée
  ✅ Documents reçus — completed (Marie, 2026-01-28)
  ✅ Dépôt confirmé — completed (Marie, 2026-01-28)
```

### Indicateurs Visuels

| Icône | Signification |
|-------|---------------|
| ✅ | `completed` |
| ⚠️ | `skipped_with_risk` (reste visible permanentement) |
| ➖ | `waived` ou `not_applicable` |

### Interactions

- **Archive = lecture seule** (non éditable)
- On peut toujours:
  - Voir les preuves (evidence)
  - Voir la raison (`resolution_note`)
  - Exporter/partager (futur)

---

## Popup Résolution Required (UX)

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Résolution requise avant d'avancer                 │
│                                                         │
│  Les conditions suivantes doivent être résolues:        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔶 Test de puits                                │   │
│  │                                                  │   │
│  │ Comment résoudre cette condition?               │   │
│  │ ○ Complété ✅                                   │   │
│  │ ○ Renoncé (waived)                              │   │
│  │ ○ Non applicable                                │   │
│  │ ○ Sauté avec risque ⚠️                         │   │
│  │                                                  │   │
│  │ Raison: [________________________]              │   │
│  │         (obligatoire si ≠ complété)             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│              [Annuler]    [Confirmer et avancer]       │
└─────────────────────────────────────────────────────────┘
```

---

## Cas Limites

### Condition résolue avant changement d'étape

Si une condition "Étape 4" est résolue pendant l'étape 4:
- `step_when_created = 4`
- `step_when_resolved = 4`
- `archived_at` = moment du passage vers étape 5

### Condition ajoutée manuellement

Les conditions custom (non-template) suivent les mêmes règles d'archivage.

### Retour en arrière d'étape

**Non supporté en v1.** Une transaction ne peut qu'avancer. Si besoin de "revenir", créer une nouvelle transaction.

---

## Historique

| Date | Action | Par |
|------|--------|-----|
| 2026-02-01 | Création et validation D4 | Sam + BMAD + ChatGPT unanime |

---

**Document gravé. Toute modification requiert validation Product Owner.**
