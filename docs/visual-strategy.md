# Stratégie Visuelle Ofra

> Document de référence pour transformer Ofra d'un prototype en SaaS premium à 49$/mois
> Dernière mise à jour: 2026-01-29

## 1. Problème Actuel

### Constat brutal
Le design actuel ressemble à un **template Tailwind gratuit**. Aucun agent immobilier ne paierait 49$/mois pour quelque chose qui a l'air amateur.

### Impact business
| Perception | Prix acceptable | Notre cible |
|------------|-----------------|-------------|
| Amateur | 0-10$/mois | ❌ |
| Correct | 20-30$/mois | ❌ |
| **Premium** | **50-100$/mois** | ✅ 49$ |

**Objectif:** Créer une perception de valeur qui justifie le prix.

---

## 2. Identité de Marque

### Personnalité Ofra
```
OFRA EST:                       OFRA N'EST PAS:
✓ Professionnel                 ✗ Corporate froid
✓ Chaleureux                    ✗ Startup "cool"
✓ Digne de confiance            ✗ Cheap/Amateur
✓ Efficace                      ✗ Compliqué
✓ Canadien, local               ✗ Américain générique
✓ Partenaire de l'agent         ✗ Outil impersonnel
```

### Proposition de valeur visuelle
> "Ofra donne l'impression d'un assistant personnel dédié, pas d'un logiciel de plus."

### Ton de voix
- **Vouvoiement** (professionnel mais respectueux)
- **Confiant** sans être arrogant
- **Clair** sans être simpliste
- **Encourageant** aux moments clés
- **Bilingue** avec la même qualité FR/EN

---

## 3. Palette de Couleurs

### Couleurs principales

```css
:root {
  /* Primaire - Bleu Ofra (confiance, professionnel) */
  --color-primary-50: #EEF2F7;
  --color-primary-100: #D4DDE8;
  --color-primary-200: #A9BBCF;
  --color-primary-300: #7E99B6;
  --color-primary-400: #53779D;
  --color-primary-500: #1E3A5F;  /* Principal */
  --color-primary-600: #172E4D;
  --color-primary-700: #12233A;
  --color-primary-800: #0C1827;
  --color-primary-900: #060C14;

  /* Accent - Doré/Ambre (chaleur, premium, succès) */
  --color-accent-50: #FFFBEB;
  --color-accent-100: #FEF3C7;
  --color-accent-200: #FDE68A;
  --color-accent-300: #FCD34D;
  --color-accent-400: #FBBF24;
  --color-accent-500: #D97706;  /* Principal */
  --color-accent-600: #B45309;

  /* Feedback */
  --color-success: #059669;  /* Vert émeraude */
  --color-warning: #D97706;  /* Ambre */
  --color-error: #DC2626;    /* Rouge */
  --color-info: #0284C7;     /* Bleu ciel */

  /* Neutres chauds (PAS de gris froids!) */
  --color-warm-50: #FAFAF9;   /* Background principal */
  --color-warm-100: #F5F5F4;  /* Cards */
  --color-warm-200: #E7E5E4;  /* Borders */
  --color-warm-300: #D6D3D1;
  --color-warm-400: #A8A29E;
  --color-warm-500: #78716C;
  --color-warm-600: #57534E;
  --color-warm-700: #44403C;
  --color-warm-800: #292524;
  --color-warm-900: #1C1917;  /* Texte principal */
}
```

### Utilisation des couleurs

| Élément | Couleur | Raison |
|---------|---------|--------|
| CTA principaux | `primary-500` | Action principale |
| CTA secondaires | `accent-500` | Attire l'attention |
| Texte principal | `warm-900` | Lisible, pas noir pur |
| Texte secondaire | `warm-500` | Hiérarchie |
| Background | `warm-50` | Doux, pas blanc clinique |
| Cards | `white` avec ombre | Élévation |
| Succès/Complété | `success` | Positif |
| Alertes | `warning` ou `error` | Attention |

---

## 4. Typographie

### Fonts

```css
:root {
  /* Titres - Outfit (moderne, géométrique, amical) */
  --font-heading: 'Outfit', system-ui, sans-serif;

  /* Corps - Inter (lisible, professionnel) */
  --font-body: 'Inter', system-ui, sans-serif;

  /* Mono - Pour données/chiffres */
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Échelle typographique

```css
/* Titres */
.text-display { font-size: 3rem; font-weight: 700; }    /* 48px - Hero */
.text-h1 { font-size: 2.25rem; font-weight: 700; }      /* 36px - Page titles */
.text-h2 { font-size: 1.875rem; font-weight: 600; }     /* 30px - Sections */
.text-h3 { font-size: 1.5rem; font-weight: 600; }       /* 24px - Cards */
.text-h4 { font-size: 1.25rem; font-weight: 600; }      /* 20px - Subsections */

/* Corps */
.text-body-lg { font-size: 1.125rem; }                  /* 18px - Lead */
.text-body { font-size: 1rem; }                         /* 16px - Default */
.text-body-sm { font-size: 0.875rem; }                  /* 14px - Secondary */
.text-caption { font-size: 0.75rem; }                   /* 12px - Labels */
```

---

## 5. Logo

### Concept
Combinaison subtile de:
- **Feuille d'érable** (Canada)
- **Toit de maison** (immobilier)
- **Lettre O** (Ofra)

### Variations
```
1. Logo complet: Icône + "OFRA"
2. Logo compact: Icône seule (favicon, mobile)
3. Logo texte: "OFRA" stylisé (quand l'espace est limité)
```

### Couleurs logo
- Principal: `primary-500` (bleu)
- Accent: `accent-500` (doré) pour détail feuille d'érable
- Sur fond sombre: Blanc

### À créer
- [ ] Logo SVG vectoriel
- [ ] Favicon 32x32, 180x180
- [ ] OG Image 1200x630
- [ ] Logo loading animation (optionnel)

---

## 6. Composants UI

### Boutons

```
PRIMARY (Actions principales)
├── Background: primary-500
├── Hover: primary-600
├── Text: white
├── Border-radius: 8px
├── Padding: 12px 24px
├── Shadow: sm
└── Transition: all 150ms

SECONDARY (Actions secondaires)
├── Background: white
├── Border: 1px warm-200
├── Hover: warm-50
└── Text: warm-900

ACCENT (CTA spéciaux)
├── Background: accent-500
├── Hover: accent-600
└── Text: white

GHOST (Actions tertiaires)
├── Background: transparent
├── Hover: warm-100
└── Text: primary-500
```

### Cards

```
DEFAULT CARD
├── Background: white
├── Border: none (ombre suffit)
├── Border-radius: 12px
├── Shadow: 0 1px 3px rgba(0,0,0,0.1)
├── Hover: shadow-md + translateY(-2px)
└── Padding: 24px

ELEVATED CARD (important)
├── Shadow: 0 4px 6px rgba(0,0,0,0.1)
└── Border-left: 4px primary-500
```

### Inputs

```
TEXT INPUT
├── Border: 1px warm-200
├── Border-radius: 8px
├── Focus: ring-2 primary-500
├── Padding: 12px 16px
├── Background: white
└── Placeholder: warm-400
```

### Tables

```
TABLE
├── Header: warm-50 background, warm-700 text, font-medium
├── Rows: white background
├── Hover row: warm-50
├── Border: warm-200 (subtle)
└── Padding cells: 16px
```

---

## 7. États et Feedback

### Empty States

```
STRUCTURE
┌─────────────────────────────────────┐
│                                     │
│         [Illustration]              │
│                                     │
│      Titre engageant               │
│      Description utile              │
│                                     │
│      [CTA Principal]               │
│                                     │
└─────────────────────────────────────┘

EXEMPLES DE COPY
├── Transactions: "Votre première transaction vous attend"
├── Clients: "Ajoutez vos premiers clients pour commencer"
├── Documents: "Glissez vos documents ici"
└── Recherche vide: "Aucun résultat pour '{{query}}'"
```

### Loading States

```
SKELETON
├── Background: warm-100
├── Animation: pulse (shimmer)
├── Border-radius: same as element
└── Height: match content

SPINNER
├── Color: primary-500
├── Size: 24px (default)
└── Label: "Chargement..." (accessibilité)
```

### Notifications/Toasts

```
SUCCESS
├── Background: success-50
├── Border-left: 4px success
├── Icon: CheckCircle
└── "Sauvegardé avec succès"

ERROR
├── Background: error-50
├── Border-left: 4px error
├── Icon: XCircle
└── Message clair + action si possible

INFO
├── Background: info-50
├── Border-left: 4px info
└── Icon: Info
```

---

## 8. Pages à Redesigner

### Priorité 1 - Première impression

| Page | État actuel | Objectif |
|------|-------------|----------|
| Login | Template générique | Branded, accueillant |
| Register | Template générique | Même identité que login |
| Dashboard | Froid, basique | Accueillant, informatif |

### Priorité 2 - Usage quotidien

| Page | État actuel | Objectif |
|------|-------------|----------|
| Transactions list | Table basique | Cards ou table élégante |
| Transaction detail | Fonctionnel | Workflow visuel engageant |
| Clients list | Plat, ennuyeux | Avatars, warmth |

### Priorité 3 - Conversion

| Page | État actuel | Objectif |
|------|-------------|----------|
| Landing | N'existe pas | Hero + features + pricing |
| Pricing | N'existe pas | 3 colonnes, CTA clair |
| Settings/Billing | N'existe pas | Gérer son compte |

---

## 9. Micro-interactions

### Hover Effects
```css
/* Cards */
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  transition: all 150ms ease;
}

/* Boutons */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* Liens */
.link:hover {
  color: var(--color-primary-600);
  text-decoration: underline;
}
```

### Transitions importantes
```css
/* Navigation */
.nav-item {
  transition: background-color 150ms, color 150ms;
}

/* Modals */
.modal-enter {
  animation: fadeIn 200ms ease, slideUp 200ms ease;
}

/* Toasts */
.toast-enter {
  animation: slideInRight 300ms ease;
}
```

### Feedback actions
```
Bouton cliqué → slight scale down (active:scale-95)
Form soumis → spinner dans le bouton
Sauvegarde → toast confirmation
Erreur → shake animation + message
```

---

## 10. Responsive Design

### Breakpoints
```css
/* Mobile first */
sm: 640px   /* Petit écran */
md: 768px   /* Tablette */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Principes mobile
- Touch targets: minimum 44x44px
- Pas de hover-only interactions
- Navigation: hamburger menu
- Cards: full width
- Tables: scroll horizontal ou cards

---

## 11. Checklist d'Implémentation

### Phase 1: Fondations (2-3 jours)
- [ ] Configurer Tailwind avec palette custom
- [ ] Ajouter fonts (Outfit, Inter)
- [ ] Créer/intégrer logo
- [ ] Mettre à jour couleurs existantes
- [ ] Créer composants Button variants
- [ ] Créer composant Card standard

### Phase 2: Pages Auth (1-2 jours)
- [ ] Redesign LoginPage
- [ ] Redesign RegisterPage
- [ ] Redesign ForgotPasswordPage
- [ ] Ajouter logo sur auth pages
- [ ] Background subtil ou illustration

### Phase 3: Dashboard (2-3 jours)
- [ ] Layout avec sidebar colorée
- [ ] Cards KPI avec icônes
- [ ] Message d'accueil personnalisé
- [ ] Empty state engageant
- [ ] Quick actions visibles

### Phase 4: Listes (2-3 jours)
- [ ] Transactions list redesign
- [ ] Clients list avec avatars/initiales
- [ ] Search bar stylée
- [ ] Filtres élégants
- [ ] Pagination moderne

### Phase 5: Détails (3-4 jours)
- [ ] Transaction detail stepper amélioré
- [ ] Onglets stylés
- [ ] Timeline visuelle
- [ ] Conditions avec progress
- [ ] Actions flottantes ou sticky

### Phase 6: Polish (ongoing)
- [ ] Loading skeletons partout
- [ ] Micro-interactions
- [ ] Thème sombre cohérent
- [ ] Animations Framer Motion
- [ ] Tests perception utilisateur

---

## 12. Métriques de Succès

### Tests à effectuer
1. **5-second test**: Montrer la landing 5 secondes
   - Objectif: 80% comprennent "gestion transactions immobilier"

2. **Willingness to pay**: "Combien paieriez-vous?"
   - Objectif: Moyenne > 35$/mois

3. **Trust score**: "Donneriez-vous vos données?"
   - Objectif: > 4/5

4. **Comparison test**: Montrer vs SkySlope
   - Objectif: "Aussi bien ou mieux"

### KPIs business
- Taux de conversion landing → signup: > 5%
- Taux de conversion trial → paid: > 30%
- NPS: > 40
- Churn: < 5%/mois

---

## 13. Ressources

### Inspiration
- [Stripe](https://stripe.com) - Clean, trustworthy
- [Linear](https://linear.app) - Modern, efficient
- [Notion](https://notion.so) - Simple, powerful
- [Intercom](https://intercom.com) - Friendly, professional

### Outils
- [Figma](https://figma.com) - Design mockups
- [Coolors](https://coolors.co) - Palette generator
- [Heroicons](https://heroicons.com) - Icônes
- [unDraw](https://undraw.co) - Illustrations gratuites
- [Framer Motion](https://framer.com/motion) - Animations React

### Fonts
- [Outfit](https://fonts.google.com/specimen/Outfit) - Titres
- [Inter](https://fonts.google.com/specimen/Inter) - Corps

---

_Ce document est la source de vérité pour toutes les décisions visuelles d'Ofra._
_Toute déviation doit être discutée et approuvée._
