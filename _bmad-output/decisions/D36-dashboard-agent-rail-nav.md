# D36 — Dashboard Agent "Mon espace" + Rail Navigation Droit

**Date**: 2026-02-17
**Statut**: EN COURS — Décisions validées, maquette à refaire
**Participants**: Sam, John, Sally, Winston (Party Mode)

---

## Contexte

Le dashboard actuel (`DashboardPage.tsx`) affiche uniquement les urgences/conditions. La maquette v2 validée (`maquettes/dashboard-v2-mockup.html`) enrichit ce dashboard avec KPIs, offres, urgences et pipeline — c'est le **dashboard Portefeuille**.

Sam souhaite un **deuxième dashboard** dédié à l'agent immobilier lui-même, accessible via un **rail de navigation vertical à droite** de l'écran.

---

## Décisions validées

### D36-01 : Deux dashboards distincts

| Dashboard | Nom | Focus | Maquette |
|-----------|-----|-------|----------|
| **D1** | Portefeuille | Transactions, offres, urgences, pipeline | `maquettes/dashboard-v2-mockup.html` ✅ validée |
| **D2** | Mon espace | L'agent : stats perso, performance, commissions, activité | `maquettes/dashboard-agent-mockup.html` ❌ à refaire |

**Raison** : Séparer "qu'est-ce que je dois faire aujourd'hui" (portefeuille) de "comment je performe" (agent).

### D36-02 : Rail de navigation vertical à droite

- Rail fixe collé au bord droit de l'écran, toujours visible quand connecté
- Deux icônes : 📁 Portefeuille (D1) / 👤 Mon espace (D2)
- Indicateur visuel sur l'icône active
- En mobile : se transforme en tabs horizontaux en haut

### D36-03 : Contenu du dashboard agent (validé par Sam)

**Zone 1 — En-tête agent**
- Avatar, nom, licence, agence, membre depuis, plan actif

**Zone 2 — KPI performances (4 cards)**
- Commissions ce mois
- Commissions YTD (année en cours)
- Closings réalisés cette année
- Taux de conversion (consultations → closings)

**Zone 3 — Revenus & Objectifs**
- Graphique commissions mensuelles (barres)
- Objectifs annuels avec barres de progression

**Zone 4 — Activité récente**
- Timeline verticale : offres, closings, FINTRAC, conditions
- Style compact avec timestamps relatifs

---

## Maquette — Statut

| Fichier | Statut | Notes |
|---------|--------|-------|
| `maquettes/dashboard-v2-mockup.html` | ✅ Validée | Dashboard Portefeuille — prêt à implémenter |
| `maquettes/dashboard-agent-mockup.html` | ❌ À refaire | Sam n'aime pas le résultat visuel — refaire avec lui demain |

**Feedback Sam sur la maquette agent** : "elle est éclatée" — la mise en page ne convient pas. Reprendre le design avec Sam en session interactive.

---

## Impact technique (notes Winston)

### Frontend
- `DashboardPage.tsx` → devient un conteneur avec switch D1/D2
- Nouveau composant : `DashboardAgent.tsx` (ou équivalent)
- Nouveau composant : `RightRail.tsx` — rail de navigation vertical
- `Layout.tsx` → intégrer le rail droit (margin-right sur le main content)

### Backend
- Nouvel endpoint probable : `GET /api/dashboard/agent-stats`
- Agrégation : commissions (mois/YTD), closings count, taux de conversion
- Activité récente : déjà partiellement couvert par les notifications

### Données nécessaires
- Commissions : à calculer depuis les transactions closées (prix × taux commission?)
- Closings : count de transactions à l'étape `post-closing` ou `closing-day`
- Taux de conversion : ratio consultation → closing
- Objectifs : nouveau concept — stockage côté user? Settings?

---

## Prochaines étapes

1. **Refaire la maquette** avec Sam (design interactif)
2. Valider le contenu exact et le layout
3. Spec technique (endpoint backend, composants frontend)
4. Implémenter

---

_Créé par Paige — 2026-02-17_
