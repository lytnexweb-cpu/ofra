# D2: Pack Condo NB v1.0 - Conditions Templates

**Date de validation:** 2026-01-31
**Validé par:** Sam (Product Owner) + Équipe BMAD (unanime)
**Statut:** GRAVÉ DANS LE MARBRE

---

> **Note terminologique NB:** Au Nouveau-Brunswick, on utilise 'Estoppel Certificate' plus souvent que 'Status Certificate' (terme Ontario). Les deux termes sont inclus pour clarté.

---

## Règles d'activation du Pack

```json
{
  "property_type": "condo"
}
```

### Déclencheurs additionnels (Transaction Profile)

| Champ | Type | Description |
|-------|------|-------------|
| `is_financed` | boolean | Transaction financée (impacte plusieurs conditions) |
| `condo_docs_required` | boolean | Documents condo requis (default: true) |

### Champs v1.1 (Post-launch)

Ces champs pourront être ajoutés après validation terrain:
- `condo_fee_amount` - Montant frais condo mensuels
- `condo_locker_parking` - Casier/stationnement inclus
- `special_assessment_risk` - Risque cotisation spéciale identifié

---

## Deal Gates Condo (Premium by Default)

Les conditions qui pilotent le workflow:

### Étape 3 → 4 (Offre acceptée → Conditionnelle)

| Condition | Level | Trigger |
|-----------|-------|---------|
| Certificat Estoppel / Status Certificate reçu | **Blocking** si financé, Required sinon | `is_financed` |
| Analyse documents condo complétée | **Blocking** | Toujours |
| Approbation acheteur des docs condo (écrit) | **Blocking** | Toujours |

### Étape 5 → 6 (Ferme → Pré-clôture)

| Condition | Level | Trigger |
|-----------|-------|---------|
| Assurance unité confirmée | **Blocking** si financé | `is_financed` |
| Prêteur satisfait des docs condo | **Blocking** si financé | `is_financed` |

---

## Étape 3: Offre Acceptée

### Documents Condo

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Demande documents condo envoyée | Condo documents request sent | Required | industry |
| Déclaration / By-laws / Rules reçus | Declaration / By-laws / Rules received | Required | industry |
| Budget + états financiers reçus | Budget + financial statements received | Required | industry |
| Procès-verbaux (12–24 mois) reçus | Minutes (12–24 months) received | Required | industry |
| Certificat Estoppel / Status Certificate reçu | Estoppel Certificate / Status Certificate received | **Blocking** si financé, Required sinon | legal |

### Vérifications Condo

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Règlements location (Airbnb / short-term) vérifiés | Rental rules (short-term/Airbnb) verified | Required | industry |
| Frais condo confirmés (mensuels + inclusions) | Condo fees confirmed (monthly + inclusions) | Required | industry |
| Assurance immeuble (condo corp) — preuve reçue | Building insurance (condo corp) proof received | Required | industry |
| Fonds de réserve / plan de maintien — vérifié | Reserve fund / capital plan reviewed | Required | industry |
| Litiges / poursuites / sinistres majeurs — vérifiés | Litigation / major claims / losses checked | Required | industry |
| Avis de cotisation spéciale (special assessment) — vérifié | Special assessment notices checked | Required | industry |

### Optionnels

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Stationnement / casier : titre + restrictions confirmés | Parking/locker: title + restrictions confirmed | Recommended | industry |
| Inspection unité (si incluse) complétée | Unit inspection (if included) completed | Recommended | best_practice |

### Approbation

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Approbation acheteur des docs condo (écrit) | Buyer approval of condo docs (in writing) | **Blocking** | legal |

---

## Étape 4: Période Conditionnelle

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Analyse documents condo complétée (checklist) | Condo document review completed (checklist) | **Blocking** | best_practice |
| Risques identifiés communiqués (note au client) | Identified risks communicated (client note) | Required | best_practice |
| Conditions levées par écrit | Conditions waived in writing | **Blocking** | legal |

---

## Étape 5: Ferme en attente

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Avocat confirmé + dossier ouvert | Lawyer confirmed + file opened | **Blocking** | legal |
| Condo corp : contact établi (si requis par avocat) | Condo corp contact established (if required) | Required | industry |
| Ajustements frais condo / prépaiements confirmés | Condo fee adjustments / prepayments confirmed | Required | industry |

---

## Étape 6: Pré-clôture

| Condition FR | Condition EN | Level | Source | applies_when |
|--------------|--------------|-------|--------|--------------|
| Assurance unité (contents/liability) confirmée | Unit insurance (contents/liability) confirmed | **Blocking** si financé, Required sinon | industry | `is_financed` |
| Prêteur satisfait des docs condo | Lender satisfied with condo docs | **Blocking** | industry | `is_financed: true` |
| Fonds confirmés + instructions banque | Funds confirmed + bank instructions | **Blocking** | industry | — |
| Visite pré-fermeture unité complétée | Pre-closing walkthrough completed | Recommended | best_practice | — |
| Statement of adjustments prêt | Statement of adjustments ready | Required | legal | — |

---

## Étape 7: Jour de clôture

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Signatures complétées | Signatures completed | **Blocking** | legal |
| Fonds transférés | Funds transferred | **Blocking** | legal |
| Remise des clés / fobs / accès | Keys / fobs / access delivered | **Blocking** | industry |
| Stationnement / casier : remise (si applicable) | Parking/locker handover (if applicable) | Required | industry |

---

## Étape 8: Post-clôture

| Condition FR | Condition EN | Level | Source |
|--------------|--------------|-------|--------|
| Transfert services (hydro/internet) + adresse | Utilities + address updates | Recommended | best_practice |
| Remise package "Condo Living" (règles, contacts) | "Condo Living" handover pack (rules, contacts) | Recommended | best_practice |
| Suivi 7 jours + 30 jours | 7-day + 30-day follow-up | Recommended | best_practice |

---

## Top 10 "Premium by Default"

Les 10 conditions incontournables du Pack Condo NB:

1. **Certificat Estoppel / Status Certificate reçu** (Blocking si financé) - legal
2. **Analyse documents condo complétée** (Blocking) - best_practice
3. **Approbation acheteur des docs condo (écrit)** (Blocking) - legal
4. **Prêteur satisfait des docs condo** (Blocking si financé) - industry
5. **Frais condo confirmés** (Required) - industry
6. **Fonds de réserve / plan de maintien vérifié** (Required) - industry
7. **Procès-verbaux (12–24 mois) reçus** (Required) - industry
8. **Avis de cotisation spéciale vérifié** (Required) - industry
9. **Assurance unité confirmée** (Blocking si financé) - industry
10. **Remise des clés / fobs / accès** (Blocking) - industry

---

## UX: Progressive Disclosure

### Création de transaction (si `property_type === 'condo'`)

L'agent voit:
1. `property_type` = Condo (déjà sélectionné)
2. `property_context` (Urbain/Banlieue) - pas Rural pour condo
3. `is_financed` (Oui/Non)
4. `condo_docs_required` (Oui/Non) - default: Oui

### Détails condo (post-création, optionnel)

Formulaire séparé avec:
- `condo_fee_amount` - Frais mensuels
- `condo_locker_parking` - Casier/stationnement inclus
- Notes libres

---

## Statistiques

| Métrique | Valeur |
|----------|--------|
| Total conditions | 27 |
| Blocking | 8 |
| Required | 14 |
| Recommended | 5 |
| Étapes couvertes | 6 (3 à 8) |

---

## Historique

| Date | Action | Par |
|------|--------|-----|
| 2026-01-31 | Création Pack Condo NB v1.0 | Sam + BMAD unanime |
| 2026-01-31 | Ajustement terminologie Estoppel (NB-friendly) | Mary |
| 2026-01-31 | Validation UX progressive disclosure | Sally |

---

**Document gravé. Toute modification requiert validation Product Owner.**
