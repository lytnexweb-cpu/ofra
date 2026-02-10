# ⚠️ PÉRIMÉ — Voir PRD v2 comme source de vérité
# ⚠️ Fichier : `_bmad-output/planning-artifacts/prd.md`
# ⚠️ Les plans, prix, limites et programme fondateur ont changé (2026-02-06)

---

# Stratégie de Tarification - Ofra (ARCHIVE)

> Document de référence pour la tarification SaaS d'Ofra
> Dernière mise à jour: 2026-01-29
> **⚠️ PÉRIMÉ depuis 2026-02-06 — Remplacé par le PRD v2**

## Positionnement

**Ofra n'est PAS un CRM.** C'est un **Transaction Manager** pour agents immobiliers.

| Ce qu'on N'EST PAS | Ce qu'on EST |
|-------------------|--------------|
| Gestion de leads | Suivi des transactions en cours |
| Nurturing prospects | Workflows offre → closing |
| Marketing automation | Conditions, délais, documents |
| Concurrent de Follow Up Boss | **Complémentaire** aux CRM |

### Proposition de valeur unique

```
OFRA - Transaction Management 100% Canadien

✓ 100% Canadien (prix en CAD, hébergement Canada)
✓ Bilingue FR/EN natif (avantage NB/Maritimes)
✓ Pour agents indépendants, pas juste courtages
✓ Workflows spécifiques marché canadien
✓ Simple - pas une usine à gaz
```

## Analyse concurrentielle

### Solutions canadiennes

| Solution | Prix | Positionnement | vs Ofra |
|----------|------|----------------|---------|
| NexOne | Sur demande | Courtages, MLS intégré | Trop enterprise, pas agents solo |
| Loft47 | Sur demande | Back-office, commissions | Focus comptabilité, pas workflow |

### Solutions US (servant le Canada)

| Solution | Prix USD | Positionnement | vs Ofra |
|----------|----------|----------------|---------|
| SkySlope | ~25$/mois | Leader marché | USD, formulaires US-centric |
| Dotloop | ~32$/mois | Collaboration, e-sign | Zillow-owned, USD |
| Paperless Pipeline | ~60$/mois | Simple | Cher, basique |
| Lone Wolf | Via courtage | Standard industrie | Complexe, pas direct |

**Opportunité:** Aucune solution 100% canadienne pour agents indépendants.

## Structure de tarification

### Les 3 tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    OFRA - Tarification                                  │
│                    Transaction Management 100% Canadien                 │
│                                                                         │
├───────────────────┬─────────────────────┬───────────────────────────────┤
│                   │                     │                               │
│    ESSENTIEL      │      PRO ⭐          │         AGENCE                │
│    29$ CAD/mois   │    49$ CAD/mois     │       99$ CAD/mois            │
│                   │     RECOMMANDÉ      │                               │
│                   │                     │                               │
├───────────────────┼─────────────────────┼───────────────────────────────┤
│                   │                     │                               │
│  • 1 utilisateur  │  • 3 utilisateurs   │  • 10 utilisateurs            │
│  • Transactions ∞ │  • Transactions ∞   │  • Transactions ∞             │
│  • Workflows base │  • Workflows custom │  • Workflows custom           │
│  • Emails auto    │  • Emails auto      │  • Emails auto                │
│  • Support email  │  • Support priorité │  • Support téléphone          │
│                   │  • Import CSV       │  • Import CSV                 │
│  • 500 MB storage │  • 2 GB storage     │  • 10 GB storage              │
│  • 5 MB/fichier   │  • 15 MB/fichier    │  • 25 MB/fichier              │
│                   │  • Rapports         │  • Rapports avancés           │
│                   │                     │  • API access                 │
│                   │                     │  • Onboarding dédié           │
│                   │                     │                               │
└───────────────────┴─────────────────────┴───────────────────────────────┘
```

### Pourquoi 3 tiers?

Stratégie SaaS classique pour maximiser le MRR:

- **Essentiel (29$):** Entrée de gamme, convertit les hésitants
- **Pro (49$):** Sweet spot - 60-70% des conversions attendues
- **Agence (99$):** Ancrage prix haut, fait paraître Pro raisonnable

### Limites de stockage fichiers

| Tier | Stockage total | Taille max/fichier | Cas d'usage |
|------|----------------|-------------------|-------------|
| Essentiel | 500 MB | 5 MB | PDFs contrats, photos individuelles |
| Pro | 2 GB | 15 MB | + Rapports inspection standard |
| Agence | 10 GB | 25 MB | + Tout document, scans HD |

**Types de fichiers acceptés:** PDF, JPG, PNG, HEIC, DOC, DOCX

**Logique:** Le rapport d'inspection (souvent 10-20 MB) nécessite le tier Pro minimum = upsell naturel.

## Programme Fondateur

### Objectif

Recruter des early adopters qui fourniront du feedback en échange d'un accès privilégié.

### Conditions

```
PROGRAMME FONDATEUR OFRA

Places:        25 maximum
Durée:         3 mois gratuits
Plan inclus:   Pro (2 GB, 15 MB/fichier)
Engagement:    2 sessions feedback de 30 min

Après 3 mois:
- Conversion obligatoire ou fermeture compte
- Prix Fondateur: -25% à vie
  • Essentiel: 22$ CAD/mois (au lieu de 29$)
  • Pro:       37$ CAD/mois (au lieu de 49$)
  • Agence:    74$ CAD/mois (au lieu de 99$)

Bonus:
- Badge "Membre Fondateur" visible
- Accès prioritaire nouvelles features
- Influence sur la roadmap produit
```

### Pourquoi 25 places?

| Nombre | Risque | Bénéfice |
|--------|--------|----------|
| 10-15 | Très faible | Feedback limité |
| **20-25** | **Faible** | **Feedback diversifié, gérable** |
| 50+ | Moyen | Support intense |

**Coût réel des Fondateurs:** ~45$ total (25 × 3 mois × 0.60$/mois variable)

## Analyse des coûts

### Coûts fixes mensuels

| Élément | Coût estimé |
|---------|-------------|
| Hébergement (VPS/Cloud) | 20-50$ CAD |
| Redis (managed) | 15-30$ CAD |
| Base de données (managed) | 15-30$ CAD |
| Domaine + SSL | 2$ CAD |
| Monitoring | 0-26$ CAD |
| **TOTAL** | **~50-140$ CAD/mois** |

### Coûts variables

| Élément | Coût |
|---------|------|
| Emails transactionnels | ~0.001$/email |
| Stockage S3 | 0.023$/GB/mois |
| Transfer S3 | 0.09$/GB (après 100GB gratuit) |
| Stripe fees | 2.9% + 0.30$/transaction |

### Coût par client/mois

```
Emails (~100/mois):     0.10$
Stockage (~200MB):      0.005$
Redis/DB marginal:      0.50$
─────────────────────────────
TOTAL:                  ~0.60$/client/mois
```

### Marges par tier

| Tier | Prix | Stripe fees | Net | Marge |
|------|------|-------------|-----|-------|
| Essentiel | 29$ | 1.14$ | 27.86$ | 96% |
| Pro | 49$ | 1.72$ | 47.28$ | 96% |
| Agence | 99$ | 3.17$ | 95.83$ | 97% |

### Break-even

Avec coûts fixes de ~100$/mois:
- **3-4 clients payants** pour couvrir les coûts fixes

## Projections financières

### Scénario conservateur (100 clients à 12 mois)

| Tier | % clients | Nombre | Prix | MRR |
|------|-----------|--------|------|-----|
| Essentiel | 20% | 20 | 29$ | 580$ |
| Pro | 60% | 60 | 49$ | 2 940$ |
| Agence | 20% | 20 | 99$ | 1 980$ |
| **TOTAL** | | **100** | | **5 500$/mois** |

**ARR: 66 000$ CAD**

### Projection 12 mois

| Période | Users | MRR | Coûts | Profit |
|---------|-------|-----|-------|--------|
| Mois 1-3 | 25 (gratuit) | 0$ | 75$/mois | -225$ |
| Mois 4-6 | 12 payants | 450$ | 100$/mois | +1 050$ |
| Mois 7-12 | 50 payants | 2 000$ | 150$/mois | +11 100$ |
| **Année 1** | | ~18 000$ | ~1 500$ | **~16 500$** |

## Garde-fous techniques

### Limites dans le code

```javascript
const LIMITS = {
  essentiel: {
    users: 1,
    storageMB: 500,
    fileSizeMB: 5,
  },
  pro: {
    users: 3,
    storageMB: 2048,
    fileSizeMB: 15,
  },
  agence: {
    users: 10,
    storageMB: 10240,
    fileSizeMB: 25,
  },
  // Globaux
  emailsPerDay: 20,
  importCsvRows: 500,
  activityRetentionDays: 365,
}
```

### Protection anti-abus

- Rate limiting sur emails (20/jour/user)
- Rate limiting API (déjà en place)
- Quota storage vérifié avant upload
- AWS Budget alerts à 100$/mois

## Décisions clés

| Décision | Choix | Justification |
|----------|-------|---------------|
| Devise | CAD | Marché canadien, différenciation |
| Nombre de tiers | 3 | Standard SaaS, maximise MRR |
| Tier recommandé | Pro (49$) | Sweet spot valeur/prix |
| Limites transactions | Aucune | Pas de friction, différencier par features |
| Limites storage | Oui | Coût réel, upsell naturel |
| Fondateurs | 25 max | Gérable, feedback qualité |
| Durée trial Fondateur | 3 mois | Temps suffisant pour évaluer |
