# Pack Rural NB v1.0 - Conditions Templates

**Date de validation:** 2026-01-31
**Validé par:** Sam (Product Owner)
**Statut:** GRAVÉ DANS LE MARBRE

---

> **Note importante:** Certains items sont des best practices (premium) et peuvent varier selon la municipalité, le prêteur, le type de propriété et les clauses du contrat. Le champ `source_type` indique la nature de chaque condition.

---

## Règles d'activation du Pack

```json
{
  "property_context": "rural"
}
```

### Déclencheurs additionnels (Transaction Profile)

| Champ | Type | Description |
|-------|------|-------------|
| `has_well` | boolean | Propriété avec puits privé |
| `has_septic` | boolean | Propriété avec fosse septique |
| `heating_type` | enum | `electric` \| `oil` \| `wood` \| `propane` \| `gas` |
| `is_waterfront` | boolean | Propriété en bordure d'eau |
| `access_type` | enum | `public` \| `private` \| `right_of_way` |
| `property_type` | enum | `house` \| `condo` \| `land` \| `commercial` |
| `is_financed` | boolean | Transaction financée (vs cash) |

---

## Étape 3: Offre Acceptée

### Eau / Puits (si `has_well: true`)

| Condition FR | Condition EN | Niveau | Responsable | Source |
|--------------|--------------|--------|-------------|--------|
| Test bactériologique (coliformes/E. coli) complété | Bacteriological water test completed | **Required** | Acheteur | government |
| Test chimique / qualité de l'eau complété | Chemical water quality test completed | Recommended | Acheteur | industry |
| Débit / récupération du puits acceptable | Well yield/recovery acceptable | Recommended | Acheteur | industry |

### Fosse Septique (si `has_septic: true`)

| Condition FR | Condition EN | Niveau | Responsable | Source |
|--------------|--------------|--------|-------------|--------|
| Inspection fosse septique / champ d'épuration | Septic tank & field inspection | **Required** | Acheteur | industry |
| Vidange septique (preuve) | Septic pump-out (proof) | Recommended | Vendeur | best_practice |

### Accès / Servitudes

| Condition FR | Condition EN | Niveau | Responsable | Source | applies_when |
|--------------|--------------|--------|-------------|--------|--------------|
| Confirmation accès légal (chemin/entrée) | Legal access confirmed (road/driveway) | **Blocking** si ROW, sinon Required | Agent | legal | `access_type: right_of_way` |
| Servitudes / droits de passage vérifiés | Easements/right-of-way verified | **Required** | Agent | legal | `access_type: right_of_way` |
| Vérification usages permis / restrictions (zonage + covenants) | Permitted use / restrictions verified (zoning + covenants) | **Required** | Agent | government |

### Terrain / Limites

| Condition FR | Condition EN | Niveau | Responsable | Source |
|--------------|--------------|--------|-------------|--------|
| Certificat de localisation / Arpentage (Survey) | Survey / Location certificate (if available) | Recommended | Vendeur | government |
| Limites / empiètements vérifiés (clôtures/cabanons) | Encroachments checked (fences/sheds/driveway) | Recommended | Agent | best_practice |

### Chauffage & Sécurité

| Condition FR | Condition EN | Niveau | Responsable | Source | applies_when |
|--------------|--------------|--------|-------------|--------|--------------|
| Inspection système chauffage principal | Primary heating system inspection | Recommended | Acheteur | best_practice | `heating_type_in: [oil, wood, propane]` |
| Inspection cheminée / poêle à bois | Chimney/wood stove inspection | **Required** | Acheteur | industry | `heating_type: wood` |

### Risques Spécifiques

| Condition FR | Condition EN | Niveau | Responsable | Source | applies_when |
|--------------|--------------|--------|-------------|--------|--------------|
| Vérification zone inondable / érosion | Flood/erosion risk check | **Required** | Agent | government | `is_waterfront: true` |
| Test radon (long terme recommandé ~3 mois) | Radon test (long-term ~3 months recommended) | Recommended | Acheteur | government |

### Inspection Générale

| Condition FR | Condition EN | Niveau | Responsable | Source |
|--------------|--------------|--------|-------------|--------|
| Inspection générale complétée | General home inspection completed | **Required** | Acheteur | industry |

---

## Étape 4: Période Conditionnelle

| Condition FR | Condition EN | Niveau | Responsable | Source | applies_when |
|--------------|--------------|--------|-------------|--------|--------------|
| Financement confirmé (Mortgage Commitment) | Financing confirmed (Mortgage Commitment) | **Blocking** | Acheteur | legal | `is_financed: true` |
| Conditions levées par écrit | Conditions waived/fulfilled in writing | **Blocking** | Agent | legal | — |
| Rapports reçus et archivés (inspection/eau/septic) | All reports received & filed | **Required** | Agent | best_practice | — |
| Renégociation/amendement signé (si applicable) | Renegotiation/amendment signed (if applicable) | **Required** | Agent | legal | `renegotiated: true` |
| Dépôt déposé en trust + preuve | Deposit placed in trust + proof | **Required** | Acheteur | legal | — |
| Assurance habitation pré-approuvée | Home insurance pre-approved | Recommended | Acheteur | best_practice | `is_financed: true` |

---

## Étape 5: Ferme en attente

| Condition FR | Condition EN | Niveau | Responsable | Source | applies_when |
|--------------|--------------|--------|-------------|--------|--------------|
| Avocat/notaire confirmé + dossier ouvert | Lawyer confirmed + file opened | **Blocking** | Acheteur | legal | — |
| Recherche de titre lancée | Title search initiated | **Required** | Avocat | legal | — |
| Taxes foncières : statut confirmé | Property taxes status confirmed | **Required** | Avocat | government | — |
| Servitudes / accès validés par avocat | Easements/access validated by lawyer | **Required** | Avocat | legal | `access_type: right_of_way` |
| Responsabilités d'entretien du chemin clarifiées | Road maintenance responsibilities clarified | **Required** si privé, Recommended sinon | Acheteur | best_practice | `access_type: private` |

---

## Étape 6: Pré-clôture

| Condition FR | Condition EN | Niveau | Responsable | Source | applies_when |
|--------------|--------------|--------|-------------|--------|--------------|
| Assurance habitation confirmée (bind) | Home insurance bound/confirmed | **Blocking** | Acheteur | legal | `is_financed: true` |
| Assurabilité confirmée (risques ruraux) | Insurability confirmed (rural risk factors) | **Blocking** si financé, Required sinon | Acheteur | best_practice | `is_financed: true` |
| Fonds disponibles confirmés (instructions banque) | Funds confirmed (bank instructions) | **Blocking** | Acheteur | legal | — |
| Statement of adjustments prêt | Statement of adjustments ready | **Required** | Avocat | legal | — |
| Visite pré-fermeture complétée | Pre-closing walkthrough completed | **Required** | Acheteur | industry | — |

---

## Étape 7: Jour de clôture

| Condition FR | Condition EN | Niveau | Responsable | Source |
|--------------|--------------|--------|-------------|--------|
| Signatures complétées | Signatures completed | **Blocking** | Tous | legal |
| Fonds transférés | Funds transferred | **Blocking** | Avocat | legal |
| Remise des clés | Keys delivered | **Blocking** | Vendeur | legal |

---

## Étape 8: Post-clôture

| Condition FR | Condition EN | Niveau | Responsable | Source |
|--------------|--------------|--------|-------------|--------|
| Transfert services (NB Power / eau / internet) | Utilities transferred (power/water/internet) | Recommended | Acheteur | best_practice |
| Suivi 7 jours | 7-day follow-up | Recommended | Agent | best_practice |
| Suivi 30 jours | 30-day follow-up | Recommended | Agent | best_practice |

---

## Mini-Pack Terrain (si `property_type: land`)

| Condition FR | Condition EN | Niveau | Responsable | Source |
|--------------|--------------|--------|-------------|--------|
| Accès légal confirmé | Legal access confirmed | **Required** | Agent | legal |
| Disponibilité services (hydro/internet) vérifiée | Utilities availability verified (hydro/internet) | **Required** | Agent | best_practice |
| Potentiel septique/puits confirmé | Septic/well potential confirmed | Recommended | Acheteur | best_practice |

---

## Les 10 Conditions "Premium by Default"

Ces conditions sont les incontournables du Pack Rural NB:

1. **Conditions levées par écrit** (Blocking) - legal
2. **Financement confirmé** (Blocking si financé) - legal
3. **Test eau/puits accepté** (Required) - government
4. **Test septique accepté** (Required) - industry
5. **Accès légal confirmé** (Required/Blocking si ROW) - legal
6. **Servitudes vérifiées** (Required) - legal
7. **Avocat confirmé** (Blocking) - legal
8. **Assurance confirmée** (Blocking si financé) - legal
9. **Fonds confirmés** (Blocking) - legal
10. **Visite pré-fermeture** (Required) - industry

---

## Historique des décisions

| Date | Décision | Validé par |
|------|----------|------------|
| 2026-01-31 | Création Pack Rural NB v1.0 | Sam |
| 2026-01-31 | Ajout source_type pour transparence | Sam |
| 2026-01-31 | Fusion propositions Mary + ChatGPT + ajouts Sam | Équipe BMAD |

---

**Document gravé. Toute modification requiert validation Product Owner.**
