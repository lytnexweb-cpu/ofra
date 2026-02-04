# D1: Transaction Profile v1

**Date de validation:** 2026-01-31
**Validé par:** Sam (Product Owner) + Équipe BMAD (unanime)
**Statut:** GRAVÉ DANS LE MARBRE

---

## Décision

Le Transaction Profile v1 comprend **8 champs** qui permettent d'activer les suggestions intelligentes de conditions selon le contexte de la transaction.

---

## Champs v1

| Champ | Type | Obligatoire | Quand demandé | Description |
|-------|------|-------------|---------------|-------------|
| `property_type` | enum | ✅ Oui | Création | Type de propriété |
| `property_context` | enum | ✅ Oui | Création | Contexte géographique |
| `is_financed` | boolean | ✅ Oui | Création | Transaction financée ou cash |
| `has_well` | boolean | Conditionnel | Si rural | Propriété avec puits privé |
| `has_septic` | boolean | Conditionnel | Si rural | Propriété avec fosse septique |
| `access_type` | enum | Conditionnel | Si rural | Type d'accès à la propriété |
| `condo_docs_required` | boolean | Conditionnel | Si condo | Documents condo requis (default: true) |
| `appraisal_required` | boolean | Conditionnel | Si financé | Évaluation requise par le prêteur |

---

## Valeurs des enums

### property_type
```typescript
type PropertyType = 'house' | 'condo' | 'land'
```
- `house` - Maison unifamiliale
- `condo` - Condominium
- `land` - Terrain vacant

### property_context
```typescript
type PropertyContext = 'urban' | 'suburban' | 'rural'
```
- `urban` - Urbain (ville, services municipaux)
- `suburban` - Banlieue
- `rural` - Rural (hors zone urbaine)

### access_type
```typescript
type AccessType = 'public' | 'private' | 'right_of_way'
```
- `public` - Accès par voie publique
- `private` - Chemin privé
- `right_of_way` - Droit de passage / servitude

---

## UX: Progressive Disclosure

### Étape 1 - Création de transaction (tous les cas)
L'agent voit et remplit:
1. `property_type` (Maison / Condo / Terrain)
2. `property_context` (Urbain / Banlieue / Rural)
3. `is_financed` (Oui / Non)

### Étape 2a - Champs conditionnels Rural (si rural sélectionné)
Si `property_context === 'rural'`, l'agent voit apparaître:
4. `has_well` (Puits? Oui / Non)
5. `has_septic` (Fosse septique? Oui / Non)
6. `access_type` (Public / Privé / Droit de passage)

### Étape 2b - Champs conditionnels Condo (si condo sélectionné)
Si `property_type === 'condo'`, l'agent voit apparaître:
7. `condo_docs_required` (Documents condo requis? Oui / Non) - default: Oui

### Étape 2c - Champs conditionnels Financé (si financé sélectionné)
Si `is_financed === true`, l'agent voit le **Financing Quick Setup**:
8. `appraisal_required` (Évaluation requise? Oui / Non / Je ne sais pas)

### Règle UX
- Les agents urbain/condo ne voient **jamais** les champs ruraux
- Zéro friction inutile
- Champs conditionnels apparaissent dynamiquement

---

## Impact sur les Packs

| Pack | Activé par |
|------|------------|
| Pack Rural NB | `property_context === 'rural'` |
| Pack Condo NB | `property_type === 'condo'` |
| Pack Financé | `is_financed === true` |
| Conditions Puits | `has_well === true` |
| Conditions Septique | `has_septic === true` |
| Conditions Accès | `access_type === 'right_of_way'` |
| Conditions Docs Condo | `condo_docs_required === true` |
| Conditions Appraisal | `appraisal_required === true` |

---

## Modèle de données (Winston)

```typescript
interface TransactionProfile {
  // Obligatoires (création)
  property_type: 'house' | 'condo' | 'land'
  property_context: 'urban' | 'suburban' | 'rural'
  is_financed: boolean

  // Conditionnels (si rural)
  has_well?: boolean
  has_septic?: boolean
  access_type?: 'public' | 'private' | 'right_of_way'

  // Conditionnels (si condo)
  condo_docs_required?: boolean  // default: true

  // Conditionnels (si financé)
  appraisal_required?: boolean | null  // null = "je ne sais pas"
}
```

---

## Champs v1.1 (Post-launch)

Ces champs pourront être ajoutés après validation terrain:
- `heating_type` - Type de chauffage (électrique/huile/bois/propane)
- `is_waterfront` - Propriété en bordure d'eau
- `has_outbuildings` - Bâtiments secondaires (grange, etc.)

---

## Historique

| Date | Action | Par |
|------|--------|-----|
| 2026-01-31 | Création et validation v1 (6 champs) | Sam + BMAD unanime |
| 2026-01-31 | Ajout `condo_docs_required` (7 champs) | Sam + Pack Condo validation |
| 2026-01-31 | Ajout `appraisal_required` (8 champs) | Sam + Pack Financé validation |

---

**Document gravé. Toute modification requiert validation Product Owner.**
