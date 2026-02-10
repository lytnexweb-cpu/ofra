---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-vision', 'step-04-pricing', 'step-05-ux', 'step-06-mockups', 'step-07-implementation', 'step-08-tests', 'step-09-roadmap']
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-ofra-2026-01-25.md
  - project-context.md
  - docs/pricing-strategy.md (PÉRIMÉ — remplacé par ce PRD)
  - docs/visual-strategy.md
  - docs/business-logic-calculations.md
  - docs/roadmap.md (PARTIELLEMENT PÉRIMÉ — sections pricing/epic 6-7 remplacées)
  - _bmad-output/session-2026-02-02-ux-refonte.md
workflowType: 'prd'
version: '2.0'
date: '2026-02-06'
author: 'Sam + Équipe BMAD (Party Mode)'
status: 'SOURCE DE VÉRITÉ'
supersedes:
  - docs/pricing-strategy.md (pricing)
  - docs/roadmap.md (sections pricing, Epic 6, Epic 7, programme fondateur)
  - project-context.md (section SaaS Pricing — mis à jour)
---

# PRD v2 — Ofra : Copilote de l'Agent Immobilier NB

> **⚠️ CE DOCUMENT EST LA SOURCE DE VÉRITÉ UNIQUE**
> Tout conflit avec un autre document se résout en faveur de ce PRD.
> Dernière mise à jour : 2026-02-06
> Auteur : Sam + Équipe BMAD (Party Mode)

---

## 1. Vision & Proposition de Valeur

### 1.1 Vision

> **"Ofra est le copilote de l'agent immobilier au Nouveau-Brunswick. Il protège ses commissions en s'assurant qu'aucune deadline n'est ratée, qu'aucune condition n'est oubliée. L'agent dort tranquille."**

### 1.2 Proposition de Valeur

**Avant :** "Un assistant intelligent qui suggère les bonnes conditions" (feature)
**Maintenant :** **"Ne ratez plus jamais une deadline, dormez tranquille"** (émotion)

Ofra ne vend pas de la gestion de données. Ofra vend de la **réduction d'anxiété** et de la **protection de commissions**.

### 1.3 Différenciateur Fondamental

| Ce qu'Ofra EST | Ce qu'Ofra N'EST PAS |
|----------------|---------------------|
| Copilote post-signature | CRM de prospection |
| Assurance anti-oubli | Outil de gestion de données |
| Spécialiste NB | Solution US adaptée |
| Simple et focalisé | ERP complexe |

### 1.4 Moat Compétitif (Avantage Défendable)

| Avantage | Pourquoi c'est défendable |
|----------|--------------------------|
| **Règles NBREC** | Aucun SaaS US/ontarien ne va investir pour 1 500 agents au NB |
| **Bilingue FR/EN natif** | Obligatoire légalement dans beaucoup de transactions NB |
| **Contexte rural NB** | Puits, fosse septique, droit de passage — conditions uniques |
| **Communauté petite et connectée** | 5 agents convaincus = tout le monde le sait en 2 mois |
| **Canadian-built** | Tendance "Buy Canadian", FINTRAC-ready, prix en CAD |

### 1.5 Jobs-to-Be-Done (JTBD)

| Job | Contexte | Résultat |
|-----|----------|----------|
| **"Ne rien oublier"** | 8+ transactions actives, deadlines qui se chevauchent | Zéro commission perdue par oubli |
| **"Savoir en 5 secondes"** | Client appelle pour un update, agent est en visite | Réponse instantanée, perception pro |
| **"Dormir tranquille"** | Dimanche soir, l'agent vérifie mentalement ses dossiers | Dashboard urgences = tranquillité |
| **"Prouver ma diligence"** | Broker demande un update, litige potentiel | Audit trail complet |
| **"Onboarder vite"** | Offre acceptée, avalanche de conditions | < 5 min avec suggestions assistées |

---

## 2. Pricing (Source de Vérité)

### 2.1 Structure des Plans

| Plan | Mensuel | Annuel (−17%) | TX actives | Stockage | Historique |
|------|---------|--------------|-----------|----------|------------|
| **Starter** | 29$/mois | 290$/an (~24$/mo) | 5 | 1 Go | 6 mois |
| **Solo** | 49$/mois | 490$/an (~41$/mo) | 12 | 3 Go | 12 mois |
| **Pro** | 79$/mois | 790$/an (~66$/mo) | 25 | 10 Go | Illimité |
| **Agence** | 149$/mois | 1 490$/an (~124$/mo) | Illimité | 25 Go | Illimité |

**Note :** Tous les prix sont en dollars canadiens (CAD). Le plan Agence est **Phase 2** — grisé/pointillés au lancement avec un bouton "Me notifier".

### 2.2 Identité des Plans

| Plan | Persona | Phrase d'identification |
|------|---------|----------------------|
| Starter | Agent temps partiel, débutant | "Je fais ça à côté" |
| Solo | Agent débutant actif, en croissance | "Je lance ma pratique" |
| Pro | Agent établi, pipeline chargé | "J'ai un pipeline chargé" |
| Agence | Petite équipe (Phase 2) | "On travaille en équipe" |

### 2.3 Programme Fondateur (25 places)

| Règle | Détail |
|-------|--------|
| Places | 25 maximum |
| 1er mois | **Gratuit** |
| Rabais mensuel | **−20% à vie** sur le plan choisi |
| Rabais annuel fondateur | **−30% à vie** (meilleur rabais, pas de cumul 20%+17%) |
| Applicable à | **TOUT plan** (Starter, Solo, Pro) |
| Le rabais suit l'upgrade | ✅ Oui — le statut fondateur est un flag, pas un plan |
| Badge visible | ✅ "Membre Fondateur #X/25" dans l'app |
| Engagement | 15 minutes de feedback par mois |
| Annulation | **Perd le statut fondateur définitivement** |
| Changement de plan sans annuler | **Garde le statut fondateur** |

#### Grille Fondateur Complète

| Plan | Normal mensuel | Fondateur mensuel (−20%) | Fondateur annuel (−30%) |
|------|---------------|-------------------------|------------------------|
| Starter | 29$/mois | **23$/mois** | **244$/an (~20$/mo)** |
| Solo | 49$/mois | **39$/mois** | **412$/an (~34$/mo)** |
| Pro | 79$/mois | **63$/mois** | **664$/an (~55$/mo)** |

#### Pitch Fondateur

> "25 places fondateurs — 1 mois gratuit, puis −20% à vie sur N'IMPORTE quel plan. Votre rabais vous suit quand vous grandissez. Vous construisez Ofra avec nous."

### 2.4 Modèle de Données Pricing

```typescript
// Table: plans (lue depuis la DB, modifiable via admin)
interface Plan {
  id: number
  name: string                    // 'Starter', 'Solo', 'Pro', 'Agence'
  slug: string                    // 'starter', 'solo', 'pro', 'agency'
  monthly_price: number           // en cents CAD
  annual_price: number            // en cents CAD
  max_transactions: number | null // null = illimité
  max_storage_mb: number
  history_months: number | null   // null = illimité
  max_users: number               // 1 pour Starter/Solo/Pro, 3 pour Agence
  is_active: boolean
  display_order: number
  created_at: DateTime
  updated_at: DateTime
}

// Sur le User
interface UserPlanFields {
  plan_id: number                 // FK vers plans
  is_founder: boolean             // flag indépendant du plan
  billing_cycle: 'monthly' | 'annual'
  plan_locked_price: number       // prix au moment de la souscription
  grace_period_start: DateTime | null  // début soft limit si dépassement
}
```

---

## 3. Règles Billing

### 3.1 Soft Limit (7 jours de grâce)

| Événement | Comportement |
|-----------|-------------|
| Agent atteint la limite TX | Création **autorisée** + bandeau d'avertissement |
| Bandeau | "Vous avez dépassé votre limite. Passez au plan supérieur ou archivez une transaction dans les 7 jours." |
| Après 7 jours | Nouvelles créations **bloquées** (transactions existantes intactes) |
| Agent revient sous la limite | `grace_period_start` reset à null |
| Upgrade depuis le bandeau | **Instantané**, en 3 clics maximum |

### 3.2 Upgrade

- Instantané, self-service
- Le bouton d'upgrade apparaît **là où la limite est atteinte** (bandeau, pas dans les settings)
- Le coupon fondateur s'applique automatiquement au nouveau prix

### 3.3 Downgrade

- **Bloqué** si `active_transactions > new_plan.max_transactions`
- Modal explicative : "Presque ! Archivez X transactions d'abord"
- Le calcul est fait pour l'agent (18 actives − 12 limite = 6 à archiver)
- Bouton "Voir mes transactions actives" filtre par ancienneté

### 3.4 Prix Lockés

- Changement de prix dans l'admin = **nouveaux abonnés seulement**
- Abonnés existants conservent leur prix (`plan_locked_price`)
- Action manuelle "Appliquer aux existants" avec confirmation obligatoire

### 3.5 Pas de Plan Gratuit

- Aucun free trial
- **Garantie satisfait ou remboursé 30 jours** à la place
- L'agent qui paie dès le jour 1 essaie pour vrai

### 3.6 Facturation Annuelle

- Rabais standard : **−17%** (équivalent 2 mois gratuits)
- Fondateur annuel : **−30%** (meilleur rabais unique, pas de cumul)
- Toggle mensuel/annuel sur la page pricing
- Prix barrés visibles (ex: ~~348$/an~~ 290$/an)

---

## 4. Refonte UX — Décisions Validées

### 4.1 Index des Décisions

| ID | Décision | Statut | Source |
|----|----------|--------|--------|
| D32 | Timeline verticale interactive (fin des onglets) | ✅ Partiellement codé | Session 2026-02-02 |
| D33 | Documents = preuves de conditions | ✅ Fusionné dans D41 | Session 2026-02-02 |
| D34 | Offres → résumé dans header post-acceptation | ✅ Validé | Session 2026-02-02 |
| D35 | Historique → drawer, Notes → secondaire | ✅ Validé | Session 2026-02-02 |
| D36 | Archivage automatique transactions terminées | ✅ Validé | Session 2026-02-02 |
| D37 | Deadlines relatives dans templates | ✅ Codé | Session 2026-02-02 |
| D38 | Conditions éditables (deadline + note) | ✅ Codé | Session 2026-02-02 |
| D39 | Pack conditions optionnel (opt-in) | ✅ Codé | Session 2026-02-02 |
| D40 | Onboarding personnalisé 5 étapes | ✅ Codé | Session 2026-02-03 |
| D41 | Garde-fous validation 3 niveaux + preuves | ✅ Codé | Session 2026-02-03 |
| **D42** | **Dashboard urgences (🔴🟡🟢) comme home** | **📋 À coder** | Brainstorm 2026-02-06 |
| **D43** | **Bloc "Valeur protégée" (commissions sauvées)** | **📋 Phase 2** | Brainstorm 2026-02-06 |
| **D44** | **Mode assisté (remplace auto/manuel binaire)** | **📋 À coder** | Brainstorm 2026-02-06 |
| **D45** | **Admin dashboard pricing (modifier sans code)** | **📋 À coder** | Brainstorm 2026-02-06 |
| **D46** | **4 forfaits (Starter/Solo/Pro/Agence)** | **📋 À coder** | Brainstorm 2026-02-06 |
| **D47** | **Facturation annuelle (−17%)** | **📋 À coder** | Brainstorm 2026-02-06 |
| **D48** | **Fondateur = flag sur user, pas plan spécial** | **📋 À coder** | Brainstorm 2026-02-06 |
| **D49** | **Soft limit 7 jours de grâce** | **📋 À coder** | Brainstorm 2026-02-06 |
| **D50** | **Email du lundi "Votre semaine"** | **📋 Phase 2** | Brainstorm 2026-02-06 |
| **D51** | **Alertes push/SMS deadlines critiques** | **📋 Phase 2** | Brainstorm 2026-02-06 |

### 4.2 Principes UX

```
1. "5 SECONDES" — L'agent sait où il en est sans cliquer
2. "CE QUI BRÛLE D'ABORD" — Urgences en premier, toujours
3. "UN SEUL CHEMIN" — Pas de choix superflu, un flow linéaire
4. "LE MOBILE DANS L'AUTO" — Tout fonctionne avec un pouce
5. "PROUVER LA VALEUR" — Ofra montre ce qu'il a protégé
```

### 4.3 Règles Responsive

| Breakpoint | Device | Navigation | Layout |
|-----------|--------|------------|--------|
| < 640px | Mobile | Bottom nav (Home/TX/Clients/⚙️) + hamburger | 1 colonne, cards full-width |
| 640-1024px | Tablette | Comme mobile mais plus large | 1-2 colonnes, modals max-width 600px |
| > 1024px | Desktop | Top nav horizontal | 2+ colonnes, sidebar possible |

---

## 5. Maquettes Validées (15 écrans)

### 5.1 A1 — Dashboard Urgences (avec urgences)

**Endpoint :** `GET /api/dashboard/urgencies`
**Query :** Conditions pending avec due_date, triées par urgence, groupées par criticité

**Desktop (>1024px) :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra ▸ Home  Transactions  Clients          (FR/EN)  Sam ▾  🔔  ☾      │
├──────────────────────────────────────────────────────────────────────────┤
│ Bonjour Sam 👋  |  3 urgences aujourd'hui              [+ Nouvelle TX]  │
│                                                                          │
│ ┌───────────────────────────────┐  ┌────────────────────────────────────┐│
│ │ 🛡️ VALEUR PROTÉGÉE (ce mois)  │  │ 📊 CE MOIS-CI                     ││
│ │ • 2 deadlines rattrapées      │  │ 12 actives · 3 nouvelles          ││
│ │ • 1 oubli détecté             │  │ 1 closing prévu · Taux: 48%      ││
│ │ ≈ 12 000$ commissions         │  │                                   ││
│ └───────────────────────────────┘  └────────────────────────────────────┘│
│                                                                          │
│ ⚡ CE QUI BRÛLE                                                          │
│ ────────────────────────────────────────────────────────────────────     │
│ 🔴 EN RETARD                                                             │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Financement hypothécaire (🔴 Blocking)  2j en retard            │     │
│ │ TX: Tremblay · 123 rue Principale · Étape 4     [Ouvrir →]     │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 🔴 URGENT (48h)                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Inspection résidentielle (🟡 Required)  Demain                  │     │
│ │ TX: Dupont · 456 av. Érables · Étape 4           [Ouvrir →]    │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Dépôt initial (🔴 Blocking)              2 jours                │     │
│ │ TX: Cormier · 789 boul. Central · Étape 3        [Ouvrir →]    │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 🟡 CETTE SEMAINE                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Test qualité de l'eau (🟡 Required)     5 jours                 │     │
│ │ TX: Leblanc · 12 ch. Roy · Étape 4               [Ouvrir →]    │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 🟢 TOUT ROULE (8 transactions)  Prochaine deadline dans 12 jours        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile (<640px) :**

```
┌─────────────────────────────────────┐
│ Ofra  Home                  🔔  ☾  │
├─────────────────────────────────────┤
│ Bonjour Sam 👋                      │
│ 3 urgences aujourd'hui              │
│ ┌─────────────────────────────────┐ │
│ │ 🛡️ ~12 000$ protégés · ce mois  │ │
│ │ 2 deadlines · 1 oubli           │ │
│ └─────────────────────────────────┘ │
│ ⚡ CE QUI BRÛLE                     │
│ ────────────────────────────────── │
│ 🔴 Financement (Blocking)          │
│ 2j en retard · Tremblay · Étape 4  │
│ [Ouvrir →]                          │
│ ────────────────────────────────── │
│ 🔴 Inspection (Required)           │
│ Demain · Dupont · Étape 4           │
│ [Ouvrir →]                          │
│ ────────────────────────────────── │
│ 🔴 Dépôt initial (Blocking)        │
│ 2 jours · Cormier · Étape 3        │
│ [Ouvrir →]                          │
│ ────────────────────────────────── │
│ 🟡 Test eau (Required)             │
│ 5 jours · Leblanc · Étape 4        │
│ [Ouvrir →]                          │
│                                     │
│ 🟢 8 TX OK · Prochaine: 12 jours   │
│ [+ Nouvelle TX]                     │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️     │
└─────────────────────────────────────┘
```

**Critères d'acceptance (Murat) :**
- [ ] L'agent identifie l'urgence #1 en < 3 secondes
- [ ] Tri : 🔴 en retard → 🔴 48h → 🟡 semaine → 🟢 OK
- [ ] Chaque card urgence montre : condition, niveau, deadline, client, adresse, étape
- [ ] Clic "Ouvrir →" navigue directement à la transaction
- [ ] Si 0 urgences → affiche A2 (tout va bien)
- [ ] Si 0 transactions → affiche A3 (vide)
- [ ] Si > 10 urgences → affiche top 10 + lien "Voir les X autres"
- [ ] Mobile : tout visible en 1 scroll
- [ ] Bloc "Valeur protégée" : données réelles (count alertes envoyées + conditions complétées après alerte)
- [ ] WCAG 2.1 AA (contraste, aria-labels)

### 5.2 A2 — Dashboard Tout Va Bien

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra ▸ Home                                              [+ Nouvelle TX]│
├──────────────────────────────────────────────────────────────────────────┤
│ Bonjour Sam 👋  |  🟢 Tout roule. Prochaine deadline dans 12 jours.    │
│                                                                          │
│ ┌───────────────────────────────┐  ┌────────────────────────────────────┐│
│ │ 🛡️ VALEUR PROTÉGÉE (ce mois)  │  │ 📌 PROCHAINS ÉVÉNEMENTS           ││
│ │ • 0 deadline rattrapée        │  │ • Closing: 15 mars — Tremblay     ││
│ │ • 0 oubli détecté             │  │ • Inspection: 18 mars — Leblanc   ││
│ │ ≈ 0$                          │  │                                   ││
│ └───────────────────────────────┘  └────────────────────────────────────┘│
│                                                                          │
│ 🟢 Aucune urgence. [Voir toutes les transactions]                        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Ofra  Home                  🔔  ☾  │
├─────────────────────────────────────┤
│ Bonjour Sam 👋                      │
│ 🟢 Tout roule                       │
│ Prochaine deadline: 12 jours        │
│ [Voir mes transactions →]           │
│ [+ Nouvelle TX]                     │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️     │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Message positif visible immédiatement
- [ ] Prochains événements (max 5, triés par date)
- [ ] CTA vers liste de transactions

### 5.3 A3 — Dashboard Vide (Nouvel Utilisateur)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra ▸ Home                                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ 👋 Bienvenue !                                                           │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Votre tableau "Urgences" apparaîtra ici dès votre 1ère          │     │
│ │ transaction.                                                     │     │
│ │                                                                  │     │
│ │ 1) Créez une transaction (2 min)                                 │     │
│ │ 2) Ajoutez/validez vos conditions                                │     │
│ │ 3) Ofra vous alerte avant les deadlines                          │     │
│ │                                                                  │     │
│ │ [+ Créer ma première transaction]                                │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ✅ Astuce: import CSV clients disponible (optionnel)                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Ofra  Home                          │
├─────────────────────────────────────┤
│ 👋 Bienvenue !                      │
│ Votre tableau "Urgences" apparaîtra │
│ après votre 1ère transaction.       │
│ [Créer ma première transaction]     │
│ Astuce: import clients plus tard    │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️     │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] CTA "Créer ma première transaction" bien visible et proéminent
- [ ] Time-to-value communiqué ("2 min")
- [ ] Pas de surcharge d'information

### 5.4 B1 — Transaction Timeline (Étape Courante, Conditions Pending)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Retour   Tremblay · 123 rue Principale           [🕘 Hist.] [📝] [⋯]│
├──────────────────────────────────────────────────────────────────────────┤
│ Achat · 285 000$ · Closing 15 mars · Acceptée 1 fév                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ 1. Consultation           28 jan                                     │
│  ✅ 2. Offre soumise          30 jan                                     │
│  ✅ 3. Offre acceptée         1 fév                                      │
│                                                                          │
│  ●━━ 4. PÉRIODE CONDITIONNELLE ━━━━━━━━━━━━━━━━━━━━ depuis 5 jours ━━   │
│  │                                                                       │
│  │  🔴 BLOQUANTES                                                        │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Financement hypothécaire              🔴 2j en retard     │     │
│  │  │   "Attente confirm. RBC"                    [✏️] [Valider ✓]│     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Dépôt initial                    3 fév · 📎 1 preuve      │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟡 REQUISES                                                          │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Inspection résidentielle              🔴 Demain           │     │
│  │  │                                             [✏️] [Valider ✓]│     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Révision RPDS                         5 jours             │     │
│  │  │                                             [✏️] [Valider ✓]│     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟢 RECOMMANDÉES                                                      │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Vérification zonage                   12 jours            │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  📎 DOCUMENTS (1)                                                     │
│  │  · recu-depot.pdf → lié à "Dépôt initial"                            │
│  │                                                                       │
│  │  📝 NOTES (1)                                                         │
│  │  · "Client nerveux, rassurer financement" — 3 fév                    │
│  │  [+ Ajouter une note]                                                 │
│  │                                                                       │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ⚠️ 1 BLOQUANTE en attente · Impossible d'avancer            │     │
│  │  │ [Avancer à l'étape suivante] (désactivé, grisé)             │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  ○  5. Ferme en attente                                                  │
│  ○  6. Pré-clôture                                                       │
│  ○  7. Jour de clôture                                                   │
│  ○  8. Suivi post-clôture                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ ← Tremblay · 123 rue Princ.   [⋯] │
├─────────────────────────────────────┤
│ Achat · 285 000$ · Closing 15 mars │
│                                     │
│ ✅ 1. Consultation                  │
│ ✅ 2. Offre soumise                 │
│ ✅ 3. Offre acceptée                │
│                                     │
│ ● 4. PÉRIODE COND.  (5 jours)      │
│                                     │
│ 🔴 BLOQUANTES                      │
│ ┌─────────────────────────────────┐ │
│ │ ○ Financement hyp.             │ │
│ │   🔴 2j en retard               │ │
│ │   "Attente RBC"                │ │
│ │   [✏️] [Valider ✓]             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Dépôt initial  📎 preuve     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🟡 REQUISES                        │
│ ┌─────────────────────────────────┐ │
│ │ ○ Inspection rés. 🔴 Demain    │ │
│ │   [✏️] [Valider ✓]             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ○ Révision RPDS    5 jours     │ │
│ │   [✏️] [Valider ✓]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🟢 ○ Vérif. zonage   12 jours     │
│                                     │
│ 📎 Docs (1) · 📝 Notes (1)        │
│                                     │
│ ⚠️ 1 bloquante · Avancer (grisé)  │
│                                     │
│ ○ 5-8. (à venir)                   │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️    │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Étapes passées compressées (✅ + date sur 1 ligne)
- [ ] Étape courante expanded (conditions + docs + notes)
- [ ] Conditions groupées par niveau (🔴 → 🟡 → 🟢)
- [ ] Chaque condition montre : titre, niveau, deadline/countdown, note, boutons action
- [ ] Bouton "Avancer" désactivé si bloquante pending + message explicatif
- [ ] Étapes futures grisées
- [ ] Accès historique via 🕘 (drawer)
- [ ] Accès notes globales via 📝
- [ ] Mobile : tout visible en scroll vertical

### 5.5 B2 — Transaction Timeline (Étape Passée Cliquée)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Retour   Tremblay · 123 rue Principale           [🕘 Hist.] [📝] [⋯]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ 1. Consultation           28 jan                                     │
│  ✅ 2. Offre soumise          30 jan                                     │
│                                                                          │
│  ✅━━ 3. OFFRE ACCEPTÉE ━━━━━━━━━━━━━━━━━━━━━━━━━ complété 1 fév ━━     │
│  │                                                                       │
│  │  🔒 CONDITIONS (archivées — lecture seule)                            │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Signature acte d'achat       🔒  Complété 1 fév · 📎     │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Dépôt initial confirmé       🔒  Complété 1 fév          │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  Pas de boutons [✏️] ni [Valider] — tout est verrouillé              │
│  │                                                                       │
│  ●━━ 4. PÉRIODE CONDITIONNELLE ━━━━━━━━━━━━━━━━━━ (étape courante)      │
│  │  ...                                                                  │
│  ○  5. Ferme en attente                                                  │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Conditions archivées avec icône 🔒
- [ ] Aucun bouton d'action (pas de ✏️, pas de Valider)
- [ ] Pas de bouton "Avancer" sur les étapes passées
- [ ] L'agent peut cliquer pour consulter, pas pour modifier

### 5.6 B3 — Transaction Timeline (Tout OK, Avancer Actif)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Retour   Tremblay · 123 rue Principale           [🕘 Hist.] [📝] [⋯]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ 1-3. (compressés)                                                    │
│                                                                          │
│  ●━━ 4. PÉRIODE CONDITIONNELLE ━━━━━━━━━━━━━━━━━━ depuis 12 jours ━━    │
│  │                                                                       │
│  │  🔴 BLOQUANTES                                                        │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Financement hypothécaire     11 fév · 📎 preuve          │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Dépôt initial               3 fév · 📎 preuve            │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟡 REQUISES                                                          │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Inspection résidentielle    8 fév · 📎 rapport           │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Révision RPDS              10 fév                        │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟢 RECOMMANDÉES                                                      │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Vérification zonage         (non complété — OK)           │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Tout est prêt ! Bloquantes et requises complétées.       │     │
│  │  │                                                              │     │
│  │  │ [▸ Avancer à l'étape 5 — Ferme en attente]  (ACTIF, bleu)   │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  ○  5. Ferme en attente                                                  │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Bouton "Avancer" ACTIF (bleu, primary) quand toutes bloquantes complétées
- [ ] Message positif "Tout est prêt !" au-dessus du bouton
- [ ] Conditions recommandées non complétées = OK (pas de blocage)
- [ ] Clic "Avancer" → confirmation → avancement réel

### 5.7 C1 — Mode Assisté (Panneau Suggestions)

**Desktop (slide-in à droite) :**

```
┌───────────────────────────────────────────────────────┬─────────────────┐
│ TRANSACTION (timeline visible)                        │ 💡 SUGGESTIONS  │
│                                                       │                 │
│                                                       │ Basé sur:       │
│                                                       │ Achat NB rural  │
│                                                       │ financé         │
│                                                       │                 │
│                                                       │ ☑ Financement   │
│                                                       │   🔴 Block +10j │
│                                                       │ ☑ Inspection    │
│                                                       │   🟡 Req. +7j   │
│                                                       │ ☑ Test puits    │
│                                                       │   🔴 Block +10j │
│                                                       │ ☐ Vérif. zonage │
│                                                       │   🟢 Reco +14j  │
│                                                       │ ─────────────── │
│                                                       │ 3 sélectionnées │
│                                                       │ [Ajouter (3)]   │
│                                                       │ [✕ Fermer]      │
└───────────────────────────────────────────────────────┴─────────────────┘
```

**Mobile (bottom sheet) :**

```
┌─────────────────────────────────────┐
│ (Transaction visible derrière)      │
├─────────────────────────────────────┤
│  ▔▔▔▔▔ (drag handle)               │
│ 💡 Suggestions — Étape 4            │
│ ☑ Financement hyp.  🔴 +10j        │
│ ☑ Inspection rés.   🟡 +7j         │
│ ☑ Test puits        🔴 +10j        │
│ ☐ Vérif. zonage     🟢 +14j        │
│ 3 sélectionnées                     │
│ [Ajouter (3)]                       │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Suggestions basées sur le profil transaction (rural/urbain/condo + financé)
- [ ] Chaque suggestion montre : nom, niveau, deadline relative
- [ ] Toutes pré-cochées par défaut SAUF recommended
- [ ] Agent peut décocher/cocher librement
- [ ] Bouton "Ajouter (N)" avec compteur dynamique
- [ ] Après ajout : conditions créées avec deadlines calculées (D37)
- [ ] Panel ne bloque pas la vue transaction (slide-in, pas modal)

### 5.8 E1 — Modal Création Transaction (Simplifié)

**Desktop :**

```
┌───────────────────────────────────────────────────────────┐
│ + Nouvelle transaction                                     │
├───────────────────────────────────────────────────────────┤
│ Client:  [Rechercher ou créer ▾]                           │
│ Adresse: [___________________________________]             │
│ Type:    [Achat ▾]    Prix: [________]                     │
│ Date de closing prévue: [📅 ___________]                   │
│                                                           │
│ ☑ Me proposer des suggestions de conditions                │
│   (je valide avant création)                               │
│                                                           │
│ [Annuler]                           [Créer transaction]    │
└───────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ + Nouvelle transaction              │
├─────────────────────────────────────┤
│ Client: [Rechercher ▾]             │
│ Adresse: [________________]        │
│ Type: [Achat ▾]                    │
│ Prix: [________]                   │
│ Closing: [📅 _______]              │
│                                    │
│ ☑ Suggestions de conditions        │
│                                    │
│ [Créer]                            │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Formulaire simple : client, adresse, type, prix, closing
- [ ] Toggle suggestions (activé par défaut si profil onboarding = "guidez-moi")
- [ ] Pas de re-paramétrage profil pratique (déjà fait à l'onboarding)
- [ ] Création < 2 minutes
- [ ] Si suggestions activées → C1 s'ouvre après création

### 5.9 G2 — Admin Dashboard (Gestion Plans/Pricing)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Admin Ofra ▸ Plans & Pricing                               Sam (Admin)  │
├──────────────────────────────────────────────────────────────────────────┤
│ Rabais: Annuel [−17%]  Fondateur mensuel [−20%]  Fondateur annuel [−30%]│
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ STARTER  [Actif ✅]                Abonnés: 12 (2 fondateurs)   │     │
│ │ Mensuel: [29.00]$  Annuel: [290.00]$                            │     │
│ │ TX max: [5]  Stockage: [1] Go  Historique: [6] mois             │     │
│ │ [Sauvegarder]                                                   │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ SOLO  [Actif ✅]                   Abonnés: 18 (5 fondateurs)   │     │
│ │ Mensuel: [49.00]$  Annuel: [490.00]$                            │     │
│ │ TX max: [12]  Stockage: [3] Go  Historique: [12] mois           │     │
│ │ [Sauvegarder]                                                   │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ PRO  [Actif ✅]                    Abonnés: 10 (4 fondateurs)   │     │
│ │ Mensuel: [79.00]$  Annuel: [790.00]$                            │     │
│ │ TX max: [25]  Stockage: [10] Go  Historique: [∞]                │     │
│ │ [Sauvegarder]                                                   │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ AGENCE  [Inactif ⏸️]  Phase 2     Emails collectés: 7          │     │
│ │ Mensuel: [149.00]$  Annuel: [1490.00]$  Users: [3]             │     │
│ │ TX max: [∞]  Stockage: [25] Go  Historique: [∞]                │     │
│ │ [Activer]  [Sauvegarder]                                       │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 📜 HISTORIQUE DES CHANGEMENTS                                            │
│ 6 fév 14:32 · Sam · Pro mensuel: 69→79$ · "Brainstorm pricing v2"      │
│ 5 fév 09:15 · Sam · Starter créé: 29$ · "Ajout plan d'entrée"          │
│                                                                          │
│ ⚠️ Changements = nouveaux abonnés. [Appliquer aux existants...]         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile (lecture seule) :**

```
┌─────────────────────────────────────┐
│ Admin · Plans                       │
├─────────────────────────────────────┤
│ STARTER: 29$/mo · 5 TX · 1 Go      │
│ SOLO:    49$/mo · 12 TX · 3 Go     │
│ PRO:     79$/mo · 25 TX · 10 Go    │
│ AGENCE:  Inactif (Phase 2)         │
│ (Édition complète: Desktop)         │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Tous les champs éditables (prix, limites, stockage, historique)
- [ ] Sauvegarder par plan (pas tout d'un coup)
- [ ] Historique des changements avec date, admin, champ, ancien→nouveau, raison
- [ ] Raison obligatoire avant sauvegarde
- [ ] Avertissement : nouveaux abonnés seulement
- [ ] Bouton "Appliquer aux existants" avec confirmation (2 étapes)
- [ ] Mobile = lecture seule (édition desktop recommandée)
- [ ] Middleware `adminOnly` (is_admin boolean sur user)

### 5.10 H1 — Page Pricing Publique (Mensuel)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra  Fonctionnalités  Pricing  Connexion                   [Commencer] │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ 🏗️ FONDATEUR — 19/25 places restantes                           │     │
│ │ 1 mois gratuit + −20% à vie (−30% si annuel)                   │     │
│ │ [Devenir fondateur →]                                           │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│              [● Mensuel]    [Annuel — Économisez 17%]                    │
│                                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │ STARTER      │ │ SOLO         │ │ PRO ⭐         │ │ ÉQUIPE         │ │
│ │ 29$/mois     │ │ 49$/mois     │ │ 79$/mois      │ │ 149$/mois      │ │
│ │              │ │              │ │ Populaire     │ │                │ │
│ │ "Je fais ça  │ │ "Je lance ma │ │ "Pipeline     │ │ Bientôt        │ │
│ │  à côté"     │ │  pratique"   │ │  chargé"      │ │                │ │
│ │              │ │              │ │               │ │ Illimité       │ │
│ │ 5 TX actives │ │ 12 TX        │ │ 25 TX         │ │ 3 users        │ │
│ │ 1 Go         │ │ 3 Go         │ │ 10 Go         │ │ 25 Go          │ │
│ │ Hist. 6 mois │ │ Hist. 12 mois│ │ Hist. ∞       │ │                │ │
│ │              │ │              │ │               │ │                │ │
│ │ [Commencer]  │ │ [Commencer]  │ │ [Commencer ⭐] │ │ [Me notifier]  │ │
│ └──────────────┘ └──────────────┘ └───────────────┘ └ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                                          │
│ Garantie 30j remboursé · 100% Canada 🍁 · FR/EN · Sans contrat          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Pricing                             │
├─────────────────────────────────────┤
│ 🏗️ Fondateur 19/25                  │
│ 1 mois + −20% à vie                │
│ [Devenir fondateur →]               │
│                                     │
│ [● Mensuel] [Annuel −17%]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ STARTER  29$/mo                 │ │
│ │ 5 TX · 1 Go · Hist. 6 mois     │ │
│ │ [Commencer]                     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ SOLO  49$/mo                    │ │
│ │ 12 TX · 3 Go · Hist. 12 mois   │ │
│ │ + Packs auto + Suggestions      │ │
│ │ [Commencer]                     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ PRO ⭐  79$/mo  Populaire       │ │
│ │ 25 TX · 10 Go · Hist. ∞        │ │
│ │ + Deadlines auto + Support prio │ │
│ │ [Commencer ⭐]                   │ │
│ └─────────────────────────────────┘ │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │ ÉQUIPE 149$/mo (Bientôt)       │ │
│ │ [Me notifier]                  │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                     │
│ 🍁 100% canadien · Remboursé 30j   │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Toggle mensuel/annuel fonctionnel
- [ ] Prix lus depuis la DB (endpoint public `GET /api/plans`)
- [ ] Plan Pro marqué "Populaire" / ⭐
- [ ] Agence en pointillés avec "Me notifier" (collecte email)
- [ ] Bannière fondateur au-dessus avec compteur temps réel
- [ ] Si 25/25 fondateurs → "Programme Fondateur — Complet. [Liste d'attente]"

### 5.11 H2 — Page Pricing (Annuel Toggle)

Même layout que H1 avec :
- Toggle "Annuel" activé
- Prix barrés : ~~348$/an~~ **290$/an** (≈24$/mo)
- Chaque plan montre l'économie annuelle

### 5.12 H3 — Bannière Fondateur

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🏗️ OFFRE FONDATEUR — 19/25 places restantes                             │
│ 1 mois gratuit + −20% à vie (tous plans) · −30% si annuel              │
│ "Vous construisez Ofra avec nous."   [Devenir fondateur →] [Détails]   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ 🏗️ Fondateur — 19/25                │
│ 1 mois + −20% à vie (−30% annuel)  │
│ [Devenir fondateur →]               │
└─────────────────────────────────────┘
```

### 5.13 K2 — Paramètres Abonnement

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Paramètres ▸ Abonnement                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ 🏗️ Membre Fondateur #14/25 — Rabais −20% à vie                          │
│                                                                          │
│ Plan actuel: PRO (63$/mo fondateur)     Statut: Actif ✅                 │
│ Renouvellement: 12 mars 2026            Cycle: Mensuel                   │
│                                                                          │
│ Utilisation:                                                             │
│ TX actives: 12/25  ████████████░░░░░  48%                                │
│ Stockage:  3.2/10 Go  ███░░░░░░░░░░  32%                                │
│                                                                          │
│ Paiement: Visa **** 4242   [Mettre à jour]                               │
│                                                                          │
│ Changer de plan:                                                         │
│ [Starter 23$/mo] [Solo 39$/mo] [● Pro 63$/mo] [Agence — Phase 2]       │
│ (prix fondateur appliqués)                                               │
│                                                                          │
│ [Passer en annuel (−30% fondateur → 664$/an)]                            │
│                                                                          │
│ [Annuler l'abonnement]                                                   │
│ ⚠️ L'annulation fait perdre votre statut Fondateur définitivement.       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Abonnement                          │
├─────────────────────────────────────┤
│ 🏗️ Fondateur #14/25 · −20%         │
│ Plan: PRO 63$/mo · Actif ✅         │
│ TX: 12/25 · Stock: 3.2/10 Go       │
│ [Passer en annuel −30%]            │
│ [Changer de plan]                   │
│ ⚠️ Annulation = perte fondateur    │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Badge fondateur visible si is_founder = true
- [ ] Prix affichés = prix fondateur (pas le prix normal)
- [ ] Barres de progression TX et stockage
- [ ] Changement de plan : prix fondateur appliqués automatiquement
- [ ] Avertissement explicite sur perte fondateur en cas d'annulation
- [ ] Downgrade → vérifie TX actives → modal "Presque !" si dépassement

### 5.14 Écran 14 — Soft Limit (Bandeau)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Limite atteinte: 25/25 transactions actives (Plan Pro)                │
│ 7 jours de grâce. Après: création bloquée.                              │
│ [Upgrade maintenant]   [Voir mes transactions]                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ ⚠️ Limite atteinte (Pro)            │
│ 7 jours de grâce                    │
│ [Upgrade]  [Voir TX]                │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Bandeau affiché en haut de toutes les pages quand `grace_period_start` != null
- [ ] Countdown jours restants
- [ ] Bouton upgrade → page pricing avec plan supérieur pré-sélectionné
- [ ] Transactions existantes **jamais** supprimées

### 5.15 Écran 15 — Downgrade Bloqué

**Desktop :**

```
┌───────────────────────────────────────────────────────────────┐
│ Presque ! Quelques transactions à archiver d'abord            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Vous souhaitez passer au plan Solo (12 TX actives max).      │
│                                                               │
│  Actives actuellement :  18                                   │
│  Limite Solo :           12                                   │
│  ─────────────────────────                                    │
│  À archiver/terminer :   6                                    │
│                                                               │
│  [Voir mes transactions actives →]              [Compris]     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Presque !                           │
├─────────────────────────────────────┤
│ Actives: 18 · Limite Solo: 12      │
│ Archivez 6 transactions d'abord.   │
│ [Voir actives →]   [Compris]       │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Titre bienveillant ("Presque !"), pas agressif
- [ ] Calcul fait pour l'agent (18 − 12 = 6)
- [ ] "Voir actives" filtre par ancienneté (les plus vieilles en premier)
- [ ] Modal bloquante — impossible de downgrader tant que la condition n'est pas remplie

---

## 6. Spécifications Comportementales (sans maquette)

### 6.1 D1-D5 — Validation Conditions (déjà codé D41)

| Niveau | Comportement | Modal | Preuve | Escape |
|--------|-------------|-------|--------|--------|
| 🔴 Blocking | Modal complète | Oui | Demandée | Raison + checkbox + phrase "je confirme sans preuve" |
| 🟡 Required | Modal simple | Oui | Optionnelle | Direct |
| 🟢 Recommended | Toggle direct | Non | — | — |

### 6.2 États ConditionCard (déjà codé)

| État | Affichage |
|------|-----------|
| Pending + deadline OK | ○ titre · X jours · [✏️] [Valider ✓] |
| Pending + overdue | ○ titre · 🔴 Xj en retard · ⚠️ message · [✏️] [Valider ✓] |
| Complété + preuve | ✅ titre · date · 📎 preuve · 🔒 |
| Complété sans preuve (escape) | ⚠️ titre · "Complété sans preuve" · raison visible · 🔒 |

### 6.3 B4 — Transaction Complétée

- Toutes les étapes ✅
- Message : "Transaction complétée le [date]. Félicitations !"
- Aucun bouton d'action
- Archivage automatique après X jours (D36)

### 6.4 B5 — Transaction Annulée

- Bandeau rouge : "Transaction annulée le [date]"
- Lecture seule
- Pas de bouton d'action

### 6.5 Auth (I1-I4) — Existant, pas de changement

Login, inscription, forgot/reset password — fonctionnels et testés.

### 6.6 Clients (F1-F4) — Existant, pas de changement

CRUD clients + import CSV — fonctionnels et testés.

### 6.7 Loading/Error/Empty States (L1-L4) — Design system existant

Skeletons, spinners, toasts, 404, 500 — fonctionnels avec le design system visual-strategy.md.

---

## 7. Plan d'Implémentation (10 jours)

### 7.1 Timeline

| Jour | Tâche | Écrans | Backend | Frontend | Tests |
|------|-------|--------|---------|----------|-------|
| **1** | Dashboard urgences | A1, A2, A3 | Endpoint `/dashboard/urgencies` | Nouveau composant DashboardUrgencies | Tests endpoint + composant |
| **2** | Timeline verticale (partie 1) | B1 | — (données existantes) | Refactor tabs → timeline, étape courante expanded | Tests composant |
| **3** | Timeline verticale (partie 2) | B2, B3 | — | Étapes passées 🔒, bouton Avancer conditionnel | Tests états |
| **4** | Suggestions + Création | C1, E1 | — (API existe) | Slide-in panel + bottom sheet + modal simplifiée | Tests flow |
| **5** | Admin plans (migration) | G2 | Migration `plans` + CRUD API + admin middleware | — | Tests API |
| **6** | Admin plans (frontend) | G2 | — | Page admin avec formulaires éditables + logs | Tests composant |
| **7** | Page pricing publique | H1, H2, H3 | Endpoint public `GET /plans` | Page pricing + toggle + bannière | Tests composant |
| **8** | Abonnement + Soft limit | K2, #14, #15 | Middleware plan check + grace period | Page settings + bandeau + modal downgrade | Tests middleware |
| **9** | Polish | Tous | — | Responsive, animations, edge cases | — |
| **10** | Tests + validation | — | — | — | Tests E2E, tests manuels avec 2-3 agents |

### 7.2 Endpoints Nouveaux

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/dashboard/urgencies` | Conditions urgentes triées | User |
| GET | `/api/plans` | Plans actifs (public) | Public |
| GET | `/api/admin/plans` | Tous les plans (admin) | Admin |
| PUT | `/api/admin/plans/:id` | Modifier un plan | Admin |
| POST | `/api/admin/plans` | Créer un plan | Admin |
| GET | `/api/admin/plan-changes` | Historique des changements | Admin |
| GET | `/api/me/subscription` | Plan actuel + utilisation | User |
| POST | `/api/me/subscription/change` | Changer de plan | User |

### 7.3 Migrations Nouvelles

| # | Migration | Tables/Colonnes |
|---|-----------|----------------|
| 1 | `create_plans_table` | plans (id, name, slug, monthly_price, annual_price, max_transactions, max_storage_mb, history_months, max_users, is_active, display_order) |
| 2 | `add_plan_fields_to_users` | users + plan_id, is_founder, billing_cycle, plan_locked_price, grace_period_start |
| 3 | `create_plan_changes_table` | plan_changes (id, plan_id, admin_user_id, field, old_value, new_value, reason, created_at) |

---

## 8. Tests Utilisateur

### 8.1 Tests "Trouve l'urgence en <5 secondes"

| # | Écran | Consigne | Succès |
|---|-------|----------|--------|
| 1 | A1 | "Quelle est votre urgence #1 ?" | Pointe le 🔴 en retard en <3 sec |
| 2 | B1 | "Pourquoi ne pouvez-vous pas avancer ?" | Identifie la bloquante en <5 sec |
| 3 | B3 | "Pouvez-vous avancer ?" | Voit le bouton actif en <3 sec |
| 4 | C1 | "Ajoutez les suggestions" | Coche + Ajouter en <10 sec |
| 5 | A3 | "Créez votre première transaction" | Trouve le CTA en <3 sec |

### 8.2 Edge Cases

| Cas | Comportement attendu |
|-----|---------------------|
| 50+ urgences | Top 10 + "Voir les X autres" |
| 0 transactions | Dashboard A3 (vide) |
| 0 conditions sur une étape | Message "Aucune condition pour cette étape" + bouton suggestions |
| Fondateur 25/25 complet | Bannière "Complet. [Liste d'attente]" |
| Soft limit + downgrade simultané | Grace period s'applique, downgrade bloqué indépendamment |
| Agent en grâce qui archive et repasse sous la limite | `grace_period_start` reset, bandeau disparaît |
| Changement prix admin pendant checkout Stripe | Prix locké au moment de création session Stripe |

---

## 9. Roadmap Phases

### Phase 1 — Lancement Fondateurs (2 semaines)

| Feature | Écran | Décision |
|---------|-------|----------|
| Dashboard urgences | A1-A3 | D42 |
| Timeline verticale | B1-B3 | D32 |
| Mode assisté | C1 | D44 |
| Admin plans | G2 | D45 |
| Page pricing | H1-H3 | D46 |
| Stripe minimal | K2, #14, #15 | D47-D49 |

### Phase 2 — Valeur Perçue (post-lancement, mois 2-3)

| Feature | Décision |
|---------|----------|
| Compteur "Valeur protégée" (données réelles) | D43 |
| Email du lundi "Votre semaine" | D50 |
| Alertes proactives 48h (push/SMS) | D51 |
| Onboarding simplifié "1ère transaction en 2 min" | D40 amélioré |
| Plan Agence activé | D46 |

### Phase 3 — Copilote Proactif (6 mois)

| Feature |
|---------|
| SMS/emails automatiques aux avocats, clients, inspecteurs |
| Contacts liés par transaction (avocat, courtier, inspecteur) |
| Rappels automatiques aux parties prenantes |
| Intégration calendrier (Google Calendar / Outlook) |
| Historique communications |

### Phase 4 — Intelligence Augmentée (12-24 mois)

| Feature |
|---------|
| Analyse de documents par IA |
| Détection de risques automatique |
| Suggestions d'offres basées sur le marché |
| Gestion d'agenda intégrée |
| Templates partagés (données anonymisées entre agents) |

### Expansion Géographique

```
Année 1 : Nouveau-Brunswick (Moncton → provincial)
Année 2 : Nouvelle-Écosse + IPE → Maritimes complètes + Québec rural
Année 3 : Québec + Ontario
```

L'architecture supporte l'expansion via `province` sur les templates de conditions.

---

## 10. Métriques de Succès

### Launch Fondateurs (Mois 1-3)

| Métrique | Cible | Signal STOP |
|----------|-------|-------------|
| Fondateurs inscrits | 25/25 | < 10 |
| Activation (1ère TX < 5 min) | 80% | < 50% |
| Rétention M1 | 70% | < 40% |
| NPS | > 30 | < 0 |
| Test "5 secondes" | 4/5 réussis | < 2/5 |

### Post-Launch (Mois 4-12)

| Métrique | Cible M6 | Cible M12 |
|----------|----------|-----------|
| Utilisateurs payants | 30-50 | 80-150 |
| MRR | 1 500-2 500$ | 4 000-8 000$ |
| Churn mensuel | < 8% | < 5% |
| % signups par référence | 20% | 40% |
| Couverture | NB complet | NB + NS + PEI |

---

## 11. Annexes

### A. Documents périmés

| Document | Statut | Ce qui est périmé |
|----------|--------|-------------------|
| `docs/pricing-strategy.md` | ⚠️ PÉRIMÉ | Tout (3 plans → 4, prix, limites, fondateurs) |
| `docs/roadmap.md` | ⚠️ PARTIELLEMENT PÉRIMÉ | Sections pricing, Epic 6, Epic 7 |
| `project-context.md` section 10 | ✅ MIS À JOUR | Pricing corrigé, renvoi vers ce PRD |

### B. Documents toujours valides

| Document | Contenu |
|----------|---------|
| `docs/visual-strategy.md` | Palette, typo, composants — toujours valide |
| `docs/business-logic-calculations.md` | Calculs métier — toujours valide |
| `project-context.md` (hors pricing) | Architecture, stack, API — toujours valide |
| `_bmad-output/session-2026-02-02-ux-refonte.md` | Décisions D32-D41 — toujours valide |
| `_bmad-output/planning-artifacts/product-brief-ofra-2026-01-25.md` | Personas, JTBD, vision 3 ans — toujours valide (sauf pricing) |

### C. Décisions complètes D32-D51

Référence croisée : voir section 4.1 de ce document.

---

_PRD rédigé par l'équipe BMAD en Party Mode — 2026-02-06_
_Validé par : Sam (Product Owner)_
_Source de vérité unique pour Ofra v2_
