# D3: Pack Financé NB v1.0 - Conditions Templates

**Date de validation:** 2026-01-31
**Validé par:** Sam (Product Owner) + Équipe BMAD (unanime)
**Statut:** GRAVÉ DANS LE MARBRE

---

## Règles d'activation du Pack

```json
{
  "is_financed": true
}
```

### Déclencheurs additionnels (Transaction Profile)

| Champ | Type | Description |
|-------|------|-------------|
| `is_financed` | boolean | Transaction financée (obligatoire, création) |
| `appraisal_required` | boolean | Évaluation requise par le prêteur (si financé) |

### Champs v1.1 (Post-launch)

Ces champs pourront être ajoutés après validation terrain:
- `financing_type` - Type de financement (`insured` | `conventional` | `private`)
- `lender_name` - Nom du prêteur

---

## Deal Gates Financé (Premium by Default)

Les conditions qui pilotent le workflow financé:

### Gate A — Avant "Ferme en attente" (Étape 4 → 5)

| Condition | Level | Notes |
|-----------|-------|-------|
| Mortgage Commitment reçu | **Blocking** | Document critique |
| Conditions prêteur satisfaites | **Blocking** | Final approval |
| Appraisal reçu et acceptable | **Blocking** | Si `appraisal_required: true` |
| Assurance habitation confirmée (bind) | **Blocking** | Requis par prêteur |

### Gate B — Avant "Jour de clôture" (Étape 6 → 7)

| Condition | Level | Notes |
|-----------|-------|-------|
| Instructions banque + montant final confirmé | **Blocking** | Bank draft / wire |
| Fonds disponibles confirmés | **Blocking** | Down payment + frais |

---

## Étape 3: Offre Acceptée

| Condition FR | Condition EN | Level | Source | applies_when |
|--------------|--------------|-------|--------|--------------|
| Demande documents financement envoyée (checklist prêteur) | Financing document request sent (lender checklist) | Required | industry | — |
| Lettre d'engagement / Mortgage Commitment reçu | Mortgage Commitment received | **Blocking** | industry | — |
| Preuve fonds / down payment (si requis) | Proof of funds / down payment (if required) | Required | industry | — |
| Appraisal commandé | Appraisal ordered | Required | industry | `appraisal_required: true` |
| Appraisal reçu et acceptable | Appraisal received and acceptable | **Blocking** | industry | `appraisal_required: true` |
| Emploi / revenus vérifiés (si requis par prêteur) | Employment/income verified (if required by lender) | Required | industry | — |
| Vérification crédit complétée (si requis) | Credit verification completed (if required) | Required | industry | — |

---

## Étape 4: Période Conditionnelle

| Condition FR | Condition EN | Level | Source | applies_when |
|--------------|--------------|-------|--------|--------------|
| Conditions prêteur satisfaites (final approval) | Lender conditions satisfied (final approval) | **Blocking** | industry | — |
| Assurance habitation "pré-validation" complétée | Home insurance pre-validation completed | Required | industry | — |
| Instructions d'assurance prêtes (policy / binder) | Insurance binder/policy prepared | Required | industry | — |
| Conditions levées par écrit | Conditions waived in writing | **Blocking** | legal | — |

---

## Étape 5: Ferme en attente

| Condition FR | Condition EN | Level | Source | applies_when |
|--------------|--------------|-------|--------|--------------|
| Avocat confirmé + dossier ouvert | Lawyer confirmed + file opened | **Blocking** | legal | — |
| Title search lancé (par avocat) | Title search initiated (by lawyer) | Required | legal | — |
| Instruction banque ↔ avocat confirmée (closing coordination) | Bank ↔ lawyer closing coordination confirmed | Required | industry | — |
| Date de closing confirmée avec prêteur | Closing date confirmed with lender | Required | industry | — |

---

## Étape 6: Pré-clôture

| Condition FR | Condition EN | Level | Source | applies_when |
|--------------|--------------|-------|--------|--------------|
| Assurance habitation confirmée (bind) | Home insurance bound/confirmed | **Blocking** | industry | — |
| Montant final + instructions banque confirmés (bank draft / wire) | Final amount + bank instructions confirmed (draft/wire) | **Blocking** | industry | — |
| Fonds disponibles confirmés (down payment + frais) | Funds available confirmed (down payment + costs) | **Blocking** | industry | — |
| Statement of adjustments prêt | Statement of adjustments ready | Required | legal | — |
| Visite pré-fermeture complétée | Pre-closing walkthrough completed | Recommended | best_practice | — |

---

## Étape 7: Jour de clôture

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Signatures complétées | Signatures completed | **Blocking** | legal |
| Fonds transférés / déboursés | Funds transferred/disbursed | **Blocking** | legal |
| Remise des clés | Keys delivered | **Blocking** | industry |

---

## Étape 8: Post-clôture

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Confirmation client: paiements hypothèque en place | Client confirmation: mortgage payments set up | Recommended | best_practice |
| Suivi 7 jours + 30 jours | 7-day + 30-day follow-up | Recommended | best_practice |

---

## Top 10 "Premium by Default"

Les 10 conditions incontournables du Pack Financé NB:

1. **Mortgage Commitment reçu** (Blocking) - industry
2. **Conditions prêteur satisfaites** (Blocking) - industry
3. **Appraisal reçu et acceptable** (Blocking si requis) - industry
4. **Assurance habitation confirmée (bind)** (Blocking) - industry
5. **Montant final + instructions banque** (Blocking) - industry
6. **Fonds disponibles confirmés** (Blocking) - industry
7. **Title search lancé** (Required) - legal
8. **Statement of adjustments** (Required) - legal
9. **Conditions levées par écrit** (Blocking) - legal
10. **Signatures + Fonds + Clés** (Blocking) - legal/industry

---

## UX: Progressive Disclosure

### Création de transaction (si `is_financed === true`)

**Financing Quick Setup** - Mini-wizard:

```
┌─────────────────────────────────────────┐
│  Configuration Financement              │
│                                         │
│  Évaluation requise par le prêteur?     │
│                                         │
│  [Oui, appraisal requis]                │
│  [Non, pas requis]                      │
│  [Je ne sais pas encore]                │
│                                         │
└─────────────────────────────────────────┘
```

| Choix | Résultat |
|-------|----------|
| Oui | `appraisal_required: true` |
| Non | `appraisal_required: false` |
| Je ne sais pas | `appraisal_required: null` + bandeau reminder |

### Bandeau "Profil incomplet"

Si `appraisal_required === null`:
> "Profil financement incomplet — Appraisal requis? [Configurer]"

---

## Chevauchement avec autres Packs

Certaines conditions apparaissent dans plusieurs packs (Rural, Condo, Financé). C'est **normal** - elles s'appliquent quand `is_financed === true`.

| Condition | Rural | Condo | Financé |
|-----------|:-----:|:-----:|:-------:|
| Avocat confirmé | ✅ | ✅ | ✅ |
| Assurance confirmée | ✅ | ✅ | ✅ |
| Signatures | ✅ | ✅ | ✅ |
| Fonds transférés | ✅ | ✅ | ✅ |

**Note technique:** Le système doit dédupliquer à l'affichage - une condition n'apparaît qu'une fois même si activée par plusieurs packs.

---

## Statistiques

| Métrique | Valeur |
|----------|--------|
| Total conditions | 21 |
| Blocking | 10 |
| Required | 9 |
| Recommended | 2 |
| Étapes couvertes | 6 (3 à 8) |

---

## Historique

| Date | Action | Par |
|------|--------|-----|
| 2026-01-31 | Création Pack Financé NB v1.0 | Sam + BMAD unanime |
| 2026-01-31 | Ajout `appraisal_required` au Transaction Profile | Winston |
| 2026-01-31 | Validation UX Financing Quick Setup | Sally |

---

**Document gravé. Toute modification requiert validation Product Owner.**
