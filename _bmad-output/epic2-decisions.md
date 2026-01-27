# OFRA — Epic 2 : Décisions de pré-lancement

**Projet** : OFRA — Transaction Management System
**Epic** : Epic 2 — Refonte UI Transaction
**Date** : 26 janvier 2026
**Décidé par** : Sam (Product Owner) + Équipe BMAD (réunion de revue)
**Statut** : Décisions validées — Prêt pour exécution

---

## 1. Assignation des agents

| Agent | Rôle | Responsabilité |
|-------|------|----------------|
| 🎨 **Sally** (UX Designer) | **Lead design** | Wireframes mobile-first, flux utilisateur, validation UX |
| 💻 **Amelia** (Dev) | **Implémentation** | Code React/TypeScript, split composants, i18n |
| 🧪 **Murat** (Test Architect) | **Qualité** | Tests composants, tests d'intégration, coverage 80%+ |
| 📋 **John** (PM) | **Cadrage** | Stories, acceptance criteria, scope control |

---

## 2. Séquence de travail

1. Sally produit les wireframes (Excalidraw) — mobile-first
2. Sam valide les wireframes
3. John écrit les stories avec acceptance criteria
4. Amelia implémente story par story
5. Murat teste en parallèle
6. Réunion de revue avant Epic 3

---

## 3. Décisions techniques validées

### 3.1 Mobile-first

**Décision** : Wireframes et design MOBILE en premier, adaptation desktop ensuite.

**Justification** : Marc-André fait ses updates entre deux visites (Android). Marie-Claude check sur iPhone. Le terrain est mobile.

**Implication** : Le stepper horizontal de 8 étapes devra avoir un pattern adapté mobile (vertical ou swipeable sur écran < 375px).

### 3.2 Système d'onglets : State-based (Option A)

**Décision** : Onglets gérés par React state, pas par le router.

**Justification** : Simple, tout chargé en une seule requête. Migration possible vers route-based plus tard si nécessaire (deep linking, partage URL).

**Onglets prévus** : Conditions, Offres, Documents, Timeline, Notes

### 3.3 TransactionsPage dans le scope

**Décision** : La page listing (`TransactionsPage.tsx`) fait partie de l'Epic 2.

**Justification** : Le listing doit montrer le step actuel, les conditions bloquantes en retard, et permettre le filtrage par step. C'est indissociable de la refonte UI transaction.

### 3.4 OffersSection : garder et intégrer

**Décision** : Le composant `OffersSection.tsx` existant est conservé et intégré dans l'onglet Offres.

**Justification** : Le composant fonctionne déjà correctement. Pas de rewrite inutile — wrap et intégration dans le système d'onglets.

---

## 4. Critères UX clés

| Critère | Cible | Source |
|---------|-------|--------|
| "Où est mon dossier ?" | Réponse en **< 10 secondes** | Product Brief — Marie-Claude |
| Création de transaction | **< 5 minutes** | Product Brief — Activation |
| Session moyenne | **3-5 minutes** (efficace, pas long) | Product Brief — KPIs |
| Surcharge cognitive | **Zéro** — info hiérarchisée, pas tout d'un coup | Problème #3 identifié dans decisions doc |

---

## 5. Structure de composants cible

```
TransactionDetailPage/
├── TransactionHeader.tsx        (client, propriété, stepper)
├── StepProgressBar.tsx          (stepper horizontal dynamique)
├── ActionZone.tsx               (conditions bloquantes, boutons advance/skip)
├── tabs/
│   ├── ConditionsTab.tsx        (checklist par step, visuellement distinctes)
│   ├── OffersTab.tsx            (OffersSection wrappé)
│   ├── DocumentsTab.tsx         (liens documents par condition)
│   ├── TimelineTab.tsx          (activity feed unifié)
│   └── NotesTab.tsx             (notes par transaction)
└── TransactionDetailPage.tsx    (orchestrateur, < 200 lignes)
```

---

## 6. Scope Epic 2

### IN scope
- Refonte `TransactionDetailPage` (split en sous-composants)
- Refonte `TransactionsPage` (listing avec step actuel, filtrage)
- Stepper horizontal dynamique basé sur le template
- Zone d'action (conditions bloquantes, deadlines)
- Onglets (Conditions, Offres, Documents, Timeline, Notes)
- Application i18n sur tous les composants Epic 2
- Tests frontend (Vitest + Testing Library)
- Mobile-first responsive

### OUT of scope (Epic 3+)
- Emails automatiques (BullMQ)
- Notifications in-app / push
- FINTRAC compliance
- Import Excel
- Formulaire onboarding client

---

## 7. Décisions issues du Party Mode (core experience)

### 7.1 Core loop utilisateur

**Décision** : Le core loop est `notification → ouvrir → cocher → fermer`, pas `ouvrir → scanner → agir → fermer`.

**Implication** : Le deep link `notification → condition spécifique` doit être le chemin le plus court. Route : `/transactions/:id?tab=conditions&highlight=:conditionId`

### 7.2 Stepper mobile : pill compacte + bottom sheet

**Décision** : Sur mobile (< 640px), le stepper est une pill compacte ("Étape 4/8 — Conditionnel" + barre de progression). Tap → bottom sheet avec stepper complet.

**Justification** : Plus élégant qu'un carousel, compact, zéro ambiguïté.

### 7.3 Blocking : modal première fois, inline ensuite

**Décision** : Le blocking check affiche une modal explicite la PREMIÈRE fois (avec message pédagogique d'onboarding). Les fois suivantes : banner inline persistant avec badge rouge.

**Justification** : Évite la "fatigue modale" pour les agents expérimentés. Le message pédagogique aide les ex-Dotloop/SkySlope à comprendre que le blocage est voulu.

### 7.4 Onboarding du concept blocking

**Décision** : Premier blocage → message spécial : "OFRA a bloqué l'avancement parce que X conditions critiques ne sont pas complétées. C'est voulu — le système vous protège contre les oublis coûteux." + option "Ne plus afficher".

---

## 8. Charte graphique

### 8.1 Icônes : Lucide Icons (MVP) → Hugeicons Pro (post-validation)

**Décision MVP** : Utiliser **Lucide Icons** (gratuit, open source) pour le MVP et la phase de validation produit.

**Décision post-validation** : Migrer vers **Hugeicons Pro** ($99, 46,000+ icônes, 10 styles, package React natif `@hugeicons/react`) une fois le concept validé avec les premiers utilisateurs.

**Justification** : Pas d'investissement avant validation du product-market fit. Lucide est suffisant pour le MVP. Hugeicons Pro apportera le polish visuel distinctif pour la phase croissance.

**Site** : https://hugeicons.com

### 8.2 Palette de couleurs

| Rôle | Light mode | Dark mode | Usage |
|------|-----------|-----------|-------|
| Primaire | `#1E3A5F` (bleu marine) | `#60A5FA` | Navigation, headers, boutons principaux |
| Accent | `#F59E0B` (ambre/or) | `#FBBF24` | CTAs, badges importants, stepper actif |
| Succès | `#10B981` (vert émeraude) | `#34D399` | Conditions complétées, étapes terminées |
| Danger | `#EF4444` (rouge) | `#F87171` | Blocking, overdue, erreurs |
| Warning | `#F97316` (orange) | `#FB923C` | Deadlines proches |
| Fond | `#F8FAFC` | `#0F172A` | Background principal |
| Carte | `#FFFFFF` | `#1E293B` | Cards, modals |
| Texte principal | `#0F172A` | `#F1F5F9` | Corps de texte |
| Texte secondaire | `#64748B` | `#94A3B8` | Labels, descriptions |

### 8.3 Typographie

- **Principale** : Inter (Google Fonts, gratuit, accents FR supportés)
- **Monospace** : JetBrains Mono (données, montants)
- Échelle : 12 / 13 / 14 / 16 / 20 / 24 / 32px

### 8.4 Design tokens

- Border radius : cards 12px, boutons 8px, badges full
- Shadows : cards `shadow-sm`, modals `shadow-xl`
- Spacing : système ×4 (4, 8, 12, 16, 20, 24, 32, 48px)
- Touch target minimum : 44px × 44px
- Transitions : 150ms ease-in-out

### 8.5 Ton visuel : Pro-warm

Professionnel mais pas froid. Coins arrondis, ombres subtiles, couleurs saturées sans être criantes, espacement généreux, animations subtiles (Framer Motion).

### 8.6 Thème Light + Dark

- Les deux supportés (déjà en place, à vérifier/fixer)
- Défaut : **Auto** (suit les préférences OS via `prefers-color-scheme`)
- Toggle manuel dans settings
- Tailwind `darkMode` à configurer en mode `'media'` pour auto

---

*Document généré lors de la réunion de revue BMAD du 26 janvier 2026*
*Mis à jour avec les décisions Party Mode et charte graphique*
*Toutes les décisions validées par Sam (Product Owner)*
