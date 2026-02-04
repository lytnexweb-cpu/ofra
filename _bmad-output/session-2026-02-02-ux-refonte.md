# Session BMAD - Refonte UX Transaction Detail

**Date:** 2026-02-02
**Participant:** Sam
**Agents impliqués:** Sally (UX), Winston (Architect), John (PM), Mary (Analyst), Barry (Quick Flow), Murat (TEA), Paige (Tech Writer)
**Statut:** En pause - Reprendre demain

---

## Contexte de la session

### Travail effectué avant la discussion UX

1. **Correction langue FR/EN dans les modals**
   - `ActionZone.tsx` : `confirmPhrase` utilise maintenant `t('workflow.skipConfirmModal.confirmPhrase')`
   - `TransactionHeader.tsx` : `deleteConfirmPhrase` utilise maintenant `t('transaction.deleteModal.confirmPhrase')`

2. **Raison obligatoire pour Skip Step**
   - Ajout d'un champ `skipReason` obligatoire (minimum 10 caractères)
   - S'applique à TOUS les cas : bloquantes, requises, ET recommandées
   - Nouvelles traductions ajoutées : `reasonLabel`, `reasonPlaceholder`, `reasonMinLength`

---

## Problème UX identifié

### Diagnostic principal

> **L'interface est organisée par modules techniques, alors que l'utilisateur pense en étapes métier.**

Un courtier ne pense pas : "Offres", "Documents", "Historique"
Il pense : **"Où j'en suis, qu'est-ce qui bloque, qu'est-ce qu'il me manque pour avancer."**

### Mobile-first perdu

L'objectif initial était un SaaS mobile-first. Cet objectif a été perdu en cours de route, ce qui est problématique pour la suite.

---

## Analyse des onglets actuels

| Onglet | Verdict | Problème |
|--------|---------|----------|
| **Conditions** | ✅ Bon | Mais trop isolé, documents devraient vivre dedans |
| **Offres** | ❌ Problème | Pertinent seulement jusqu'à acceptation, bruit visuel après |
| **Documents** | ❌ Conceptuellement faux | Documents = preuves de conditions, pas un module séparé |
| **Historique** | ❓ Mal exposé | Utile pour audit/litige, inutile au quotidien |
| **Notes** | ⚠️ Trop visible | Fonction secondaire promue en principal |

### Timeline - Opportunité manquée

- Actuellement : décorative
- Problème : Ne montre pas ce qu'il y a dedans (conditions franchies, etc.)
- Objectif : Devenir le panneau de contrôle principal

### Transactions terminées

Question soulevée : Que faire des transactions terminées ?
- Réponse : **Archivage automatique**
- `completed` → visible X jours → `archived`
- Accessible via filtre "Afficher les archivées"

---

## Décisions UX validées (D32-D36)

### D32 - Navigation par étape
- Timeline interactive et cliquable
- Contenu chargé par étape sélectionnée
- **Statut:** Validé conceptuellement

### D33 - Documents = preuves de conditions
- Suppression de l'onglet Documents global
- Documents visibles DANS les conditions (via `condition_evidence`)
- **Statut:** Validé conceptuellement
- **Note Winston:** Modèle `condition_evidence` déjà prêt

### D34 - Offres reclassées
- L'offre devient un résumé figé/contextuel
- Pas d'onglet permanent post-acceptation
- Infos clés (prix, date, conditions initiales) dans le header
- **Statut:** Validé conceptuellement (Option A retenue)

### D35 - Historique & Notes dégradés
- Historique → drawer/panneau latéral (icône)
- Notes → secondaires, accessibles mais pas dominantes
- Notes à deux niveaux : globales (transaction) et par étape
- **Statut:** Validé conceptuellement

### D36 - Archivage automatique
- Nouveau statut `archived` distinct de `completed`
- Transition automatique après X jours
- Filtre pour afficher les archivées
- **Statut:** Validé conceptuellement

---

## Vision UX cible

### Nouvelle structure proposée

```
┌─────────────────────────────────────────────────┐
│ HEADER TRANSACTION                              │
│ - Nom du client                                 │
│ - Statut (Active/Annulée/Terminée/Archivée)    │
│ - Résumé offre (prix, date acceptation)        │
│ - CTA principal : Avancer l'étape              │
├─────────────────────────────────────────────────┤
│ TIMELINE INTERACTIVE (axe central)              │
│ [Étape 1] → [Étape 2] → [Étape 3*] → ...       │
│                            ↓                    │
│              Clic = charge le contenu           │
├─────────────────────────────────────────────────┤
│ VUE ÉTAPE SÉLECTIONNÉE                         │
│ ┌─────────────────────────────────────────────┐│
│ │ Conditions de cette étape                   ││
│ │ ├── Condition 1 (Blocking)                  ││
│ │ │   └── Preuves/Documents attachés          ││
│ │ ├── Condition 2 (Required)                  ││
│ │ │   └── Preuves/Documents attachés          ││
│ │ └── Condition 3 (Recommended)               ││
│ ├─────────────────────────────────────────────┤│
│ │ Notes locales à l'étape                     ││
│ │ Alertes / risques / décisions prises        ││
│ └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│ [🕘 Historique drawer] [📝 Notes globales]      │
└─────────────────────────────────────────────────┘
```

### Bénéfice mobile

Cette refonte rend le mobile PLUS simple :
- Moins d'onglets
- Plus de contexte
- Moins de navigation horizontale

---

## Plan d'implémentation proposé (Barry)

### Sprint 1 : Timeline cliquable
- Rendre chaque étape de la timeline cliquable
- Au clic → afficher les conditions de CETTE étape seulement
- Garder les onglets actuels (pas de breaking change)

### Sprint 2 : Preuves dans conditions
- Ajouter upload de fichiers sur les conditions
- Afficher les documents DANS la ConditionCard
- Utiliser le modèle `condition_evidence` existant

### Sprint 3 : Nettoyage
- Cacher/supprimer onglet Documents
- Offres → résumé dans header
- Notes → icône discrète
- Historique → drawer latéral

### Sprint 4 : Archivage
- Ajouter statut `archived` à Transaction
- Migration pour ajouter le champ
- Cron job ou trigger après X jours
- Filtre dans la liste des transactions

---

## Votes de l'équipe sur la priorité

| Agent | Vote |
|-------|------|
| 🎨 Sally | Timeline interactive en premier |
| 🏗️ Winston | D33 (preuves) d'abord, puis D32 |
| 📋 John | Timeline interactive en premier |
| 📊 Mary | Approche incrémentale |
| 🚀 Barry | Sprint 1 = Timeline cliquable |

**Consensus:** Approche incrémentale, commencer par la Timeline interactive.

---

## Faisabilité technique (Winston)

| Décision | Faisabilité | Complexité |
|----------|-------------|------------|
| D32 - Timeline interactive | ✅ Faisable | Moyenne |
| D33 - Documents = preuves | ✅ Déjà prévu (condition_evidence) | Faible |
| D34 - Offres reclassées | ✅ Simple | Faible |
| D35 - Historique drawer | ✅ Composant existant | Faible |
| D36 - Archivage auto | ✅ Migration simple | Faible |

---

## Questions en suspens pour demain

1. **Approche Big Bang ou Incrémentale ?**
   - Recommandation équipe : Incrémentale

2. **Par quoi commencer concrètement ?**
   - Majorité : Timeline interactive (D32)
   - Winston suggère : D33 d'abord car modèle prêt

3. **Protection du seeder** (tâche reportée)
   - Ajouter protection contre les templates dupliqués
   - Discuté avant cette session, non encore implémenté

---

## Fichiers modifiés cette session

| Fichier | Modification |
|---------|--------------|
| `frontend/src/components/transaction/ActionZone.tsx` | Ajout champ raison obligatoire pour skip |
| `frontend/src/components/transaction/TransactionHeader.tsx` | Fix langue pour delete phrase |
| `frontend/src/i18n/locales/fr/common.json` | Nouvelles traductions skip reason |
| `frontend/src/i18n/locales/en/common.json` | Nouvelles traductions skip reason |

---

## Nouvelles décisions (Session 16h51)

### D37 - Deadlines relatives dans les templates

**Problème identifié:** Les templates de conditions n'ont pas de deadline alors que toute condition immobilière a une échéance.

**Solution:**
- Ajouter `deadline_reference` : `"acceptance"` | `"closing"` | `"step_start"`
- Ajouter `default_deadline_days` : nombre de jours
- À la création → calcul automatique de la date
- Deadline toujours éditable ensuite par le courtier

**Exemples:**
| Condition | Référence | Jours | Résultat |
|-----------|-----------|-------|----------|
| Financement | acceptance | +10 | Date acceptation + 10j |
| Inspection | acceptance | +7 | Date acceptation + 7j |
| Dépôt | acceptance | +2 | Date acceptation + 48h |

**Statut:** Validé conceptuellement

---

### D38 - Conditions éditables par le courtier

**Principe:** "Templates = intelligence par défaut, Transaction = réalité du terrain"

**Règles d'édition:**

| Champ | À la création | Après création | Après passage étape |
|-------|---------------|----------------|---------------------|
| Deadline | ✅ Modifiable (pré-remplie) | ✅ Modifiable | ✅ Modifiable |
| Note | ✅ Ajout optionnel | ✅ Éditable | ✅ Éditable |
| Niveau | ✅ Modifiable | ⚠️ Warning visuel | ❌ Verrouillé 🔒 |

**UX pour le niveau:**
- Si modification avant passage : Tooltip "Changer le niveau impacte la progression"
- Si étape passée : Champ grisé + icône 🔒 + message "Niveau verrouillé après validation"

**Statut:** Validé conceptuellement

---

---

### D39 - Pack conditions optionnel (opt-in)

**Problème identifié:** On ne peut pas imposer un package de conditions à l'agent. Chaque courtier a son style de travail.

**Principe:** "Le système propose, le courtier dispose"

**Solution - Choix à la création de transaction:**

```
┌─────────────────────────────────────────────┐
│ 📦 Conditions suggérées                     │
│                                             │
│ ○ Charger le pack complet (recommandé)     │
│   → X conditions pré-configurées            │
│                                             │
│ ○ Je choisis moi-même par étape            │
│   → Suggestions disponibles à chaque étape  │
└─────────────────────────────────────────────┘
```

**Comportement:**

| Option | À la création | Par la suite |
|--------|---------------|--------------|
| Pack complet | Toutes conditions du profil chargées | Peut en ajouter/supprimer |
| Manuel | Transaction vide | Suggestions dispo par étape |

**Avantages:**
- Respecte l'autonomie du courtier
- Deux profils servis : le pressé ET le contrôleur
- Plus l'utilisateur a le contrôle, plus il fait confiance au système

**Implémentation (Barry):**
- Ajouter `loadConditionPack: boolean` dans le form de création
- Si `true` → API charge le pack complet
- Si `false` → transaction vide, suggestions par étape
- Estimation : 2-3 heures

**Statut:** Validé conceptuellement

---

### D40 - Onboarding personnalisé RÉVISÉ (première connexion)

**Problème identifié:** On ne connaît pas le profil du courtier, donc on ne peut pas personnaliser son expérience.

**Solution:** Wizard d'onboarding à la première connexion après inscription.

**Flow RÉVISÉ (validé avec ChatGPT):**

```
┌─────────────────────────────────────────────┐
│ 👋 Bienvenue sur Ofra !                     │
│                                             │
│ Quelques questions pour personnaliser       │
│ votre expérience...                         │
└─────────────────────────────────────────────┘

Question 1/4 - Votre pratique
   ○ Je travaille seul(e)
   ○ Petite équipe (2-5)
   ○ Agence (+5)
   👉 Sert à : segmenter + préparer multi-user / plan Agence

Question 2/4 - Vos transactions typiques (MULTI-SELECT)
   □ Résidentiel urbain/banlieue
   □ Résidentiel rural (puits, fosse)
   □ Condos
   □ Terrains
   👉 Sert à : sélectionner les packs/conditions applicables

Question 3/4 - Votre volume (annuel)
   ○ Débutant (< 10/an)
   ○ Établi (10-30/an)
   ○ Volume élevé (30+/an)
   👉 Sert à : adapter l'UX (aide, densité, suggestions)

Question 4/4 - Vos préférences
   ○ Guidez-moi (conditions auto)
   ○ Je préfère tout contrôler
   👉 Sert à : D39 opt-in pack + style de travail
```

**Modèle de données RÉVISÉ (Winston):**

```typescript
interface UserProfile {
  // Q1: Pratique
  practiceType: 'solo' | 'small_team' | 'agency'

  // Q2: Contextes (multi-select)
  propertyContexts: ('urban_suburban' | 'rural' | 'condo' | 'land')[]

  // Q3: Volume annuel
  annualVolume: 'beginner' | 'established' | 'high'

  // Q4: Préférence auto
  preferAutoConditions: boolean

  // État
  onboardingCompleted: boolean
}
```

**Changements clés vs version initiale:**
- ❌ "Commercial" retiré (hors scope v1)
- ✅ Q2 multi-select (un agent peut faire rural ET condo)
- ✅ Volume annuel (plus réaliste que mensuel)
- ✅ Q1 "Pratique" → prépare pricing Solo/Agence
- ✅ "Passer" possible mais tracké
- ✅ Profil modifiable dans Settings

**Impact produit (John):**

| Bénéfice | Description |
|----------|-------------|
| Personnalisation | Pack conditions adapté (rural NB) |
| Pricing | Segmentation Solo vs Agence |
| Données business | Comprendre le marché NB |
| Réduction churn | L'utilisateur se sent compris |

**Questions stratégiques et leur impact (Mary) - RÉVISÉ:**

| Question | Pourquoi | Impact produit |
|----------|----------|----------------|
| Q1 Pratique | Solo vs équipe | Prépare pricing + multi-user |
| Q2 Contextes | Rural = packs spéciaux | Puits, fosse, servitudes auto |
| Q3 Volume | Débutant vs power user | Complexité UX adaptée |
| Q4 Préférence | Style de travail | D39 pack auto ou manuel |

**Données business récoltées:**
- % solo vs équipe au N.-B.
- % rural vs urbain vs condo
- Volume moyen → sizing des plans

**Points de validation (Murat):**
- ✅ Onboarding affiché si `onboardingCompleted === false`
- ✅ Bouton "Passer" discret mais tracké
- ✅ Profil modifiable dans Settings
- ✅ Q2 multi-select fonctionnel
- ✅ "Commercial" retiré (hors scope v1)

**Implémentation (Barry):**

Partie 1 - Backend:
- Migration : ajouter 5 champs sur User
- API : `PUT /me/onboarding`

Partie 2 - Frontend:
- Composant `OnboardingWizard` (4 étapes)
- Redirect après login si `onboardingCompleted === false`
- Multi-select pour Q2
- Sauvegarde à la fin

**Estimation:** 1 sprint complet

**Statut:** ✅ RÉVISÉ ET VALIDÉ

---

### Plan d'implémentation révisé (mise à jour)

**Priorités réorganisées:**

| Priorité | Décision | Effort | Impact | Statut |
|----------|----------|--------|--------|--------|
| 1 | D38 Phase A - Édition conditions (deadline + note) | Faible | Immédiat | ✅ FAIT |
| 2 | D37 - Deadlines relatives templates | Moyen | Premium | ✅ FAIT |
| 3 | D39 - Pack conditions optionnel | Faible | UX | ✅ FAIT |
| 4 | **D41 - Garde-fous + preuves** | Moyen | **Signature** | 🎯 **PROCHAIN** |
| 5 | D40 - Onboarding personnalisé | Élevé | Stratégique | ⏳ |
| 6 | D32 - Timeline interactive | Moyen | UX majeur | ⏳ |
| 7 | D33 - Documents = preuves | - | - | ✅ Fusionné D41 |
| 8 | D34/D35 - Nettoyage onglets | Faible | UX | ⏳ |
| 9 | D36 - Archivage automatique | Faible | Maintenance | ⏳ |

---

---

## Analyse Concurrentielle (Recherche Mary - 02/02/2026)

### Concurrents DIRECTS (Transaction Management)

| Acteur | Origine | Prix | Présence Canada |
|--------|---------|------|-----------------|
| **Dotloop** | USA (Zillow) | 31.99$/mois solo, 149-199$ équipes | ✅ Forms OREA |
| **SkySlope** | USA | Custom (~1$/feature) | ✅ Utilisé via bannières |
| **Lone Wolf Transact** | Canada (ON) | Custom | ✅ Leader historique |
| **DealTrack** | Canada | Custom | ⚠️ Expansion 2026 (42-50 courtages) |
| **Paperless Pipeline** | USA | 15-30$/mois | Partiel |

### Concurrents INDIRECTS (CRM)

| Acteur | Prix | Type |
|--------|------|------|
| **IXACT Contact** (Canada) | 46-47$/mois | CRM + marketing |
| **Follow Up Boss** | 69$/mois+ | CRM leads |
| **kvCORE** | Custom | Plateforme tout-en-un |
| **Wise Agent** | 32$/mois | CRM basique |

### Acteurs Québec/Francophones

**Aucun concurrent direct identifié** sur l'angle Ofra (conditions, deadlines, timeline, workflow transactionnel).

- JLR Solutions → Données Registre foncier (pas workflow)
- Lorent → Gestion parc immobilier (investisseurs)
- Hopem → Gestion locative (pas transactionnel)

### Avantage Concurrentiel Ofra

| Critère | Ofra | Dotloop/SkySlope | DealTrack |
|---------|------|------------------|-----------|
| Francophone natif | ✅ | ❌ | ❌ |
| Contexte NB/QC | ✅ | ❌ | Partiel |
| Conditions intelligentes | ✅ | Basique | ❓ |
| Timeline interactive | ✅ | ❌ | ❓ |
| Prix accessible | ✅ | 149$+ | Custom |

### Recommandation Pricing (basée sur concurrence)

| Plan | Prix suggéré | Limite | Benchmark |
|------|--------------|--------|-----------|
| **Solo** | 29-39$/mois | 5 TX actives | Wise Agent |
| **Pro** | 59-79$/mois | 15 TX actives | IXACT Contact |
| **Agence** | 149$/mois | Illimité + multi-user | Dotloop Teams |

---

## DÉCISION PRICING FINALE (Validée)

### Principe directeur

> **On ne vend PAS des features, on vend :**
> - Solo = **sécurité mentale** ("Je n'oublie rien")
> - Pro = **efficacité** ("Je gagne du temps")
> - Agence = **scalabilité** ("Je pilote une organisation")

### Grille tarifaire validée

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLO          PRO           AGENCE           │
│ Prix mensuel       35$           69$           149$             │
│ Prix annuel        29$/mois      59$/mois      129$/mois        │
├─────────────────────────────────────────────────────────────────┤
│ TX actives         5             20            Illimité         │
│ Utilisateurs       1             1 (strict)    10 (+15$/u)      │
│ Upload docs        3/TX          Illimité      Illimité         │
├─────────────────────────────────────────────────────────────────┤
│ CORE (TOUS LES PLANS)                                           │
│ ─────────────────────────────────────────────────────────────── │
│ ✅ Workflow 8 étapes                                            │
│ ✅ Timeline interactive (UI centrale)                           │
│ ✅ Conditions manuelles                                         │
│ ✅ Édition conditions (deadline + note)                         │
│ ✅ Notes                                                        │
│ ✅ Archivage auto                                               │
├─────────────────────────────────────────────────────────────────┤
│ PREMIUM (PRO + AGENCE)                                          │
│ ─────────────────────────────────────────────────────────────── │
│ ✅ Pack conditions automatiques                                 │
│ ✅ Deadlines relatives auto-calculées                           │
│ ✅ Templates personnalisés                                      │
│ ✅ Onboarding guidé (D40)                                       │
├─────────────────────────────────────────────────────────────────┤
│ AGENCE UNIQUEMENT                                               │
│ ─────────────────────────────────────────────────────────────── │
│ ✅ Multi-utilisateurs                                           │
│ ✅ Rôles admin/agent                                            │
│ ✅ Dashboard équipe                                             │
│ ✅ Rapports consolidés                                          │
│ ✅ Support prioritaire (téléphone)                              │
│ ✅ Accès API (futur)                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Décisions explicites

| # | Décision | Choix |
|---|----------|-------|
| 1 | Timeline interactive | ✅ TOUS les plans (c'est le cœur) |
| 2 | Upload docs Solo | Limité 3/TX (pas bloqué) |
| 3 | Multi-user Pro | ❌ 1 user strict (protège Agence) |
| 4 | Deadlines auto + Packs | PRO+ uniquement (intelligence payante) |
| 5 | Édition conditions | ✅ TOUS les plans (sinon frustrant) |

### Projection MRR

**À 100 clients (mix 50% Solo / 40% Pro / 10% Agence) :**

| Plan | Clients | MRR |
|------|---------|-----|
| Solo | 50 | 1,750$ |
| Pro | 40 | 2,760$ |
| Agence | 10 | 1,490$ |
| **TOTAL** | **100** | **6,000$ MRR** |

**ARR potentiel : ~72,000$/an**

### Feature Flags techniques (Winston)

```typescript
interface PlanLimits {
  plan: 'solo' | 'pro' | 'agence'
  maxActiveTransactions: 5 | 20 | null  // null = illimité
  maxUsers: 1 | 1 | 10
  extraUserPrice: 0 | 0 | 15
  maxDocsPerTransaction: 3 | null | null
  features: {
    conditionPacks: boolean      // Pro+
    autoDeadlines: boolean       // Pro+
    customTemplates: boolean     // Pro+
    guidedOnboarding: boolean    // Pro+
    multiUser: boolean           // Agence
    teamDashboard: boolean       // Agence
    advancedReports: boolean     // Agence
    apiAccess: boolean           // Agence
    prioritySupport: boolean     // Agence
  }
}
```

**Statut : ✅ DÉCISION PRICING VALIDÉE**

---

## D38 Phase A - Scope d'implémentation (Validé)

### Objectif
Permettre au courtier de modifier deadline + note sur une condition existante.

### Acceptance Criteria (Bob)

- [ ] Bouton "Modifier" (✏️) sur chaque ConditionCard
- [ ] Modal avec DatePicker + Textarea note (design Sally)
- [ ] Titre readonly dans le modal
- [ ] Sauvegarde via PATCH /conditions/:id
- [ ] Validation : date ISO, note max 1000 chars
- [ ] Après save : invalidation queries (transaction, conditions, advance-check)
- [ ] ActionZone se met à jour instantanément
- [ ] Log dans condition_events : `condition_updated` avec delta (from/to)
- [ ] Condition archivée = readonly (pas de bouton modifier)
- [ ] Permission : 403 si pas owner, 409 si archived

### UI Modal (Sally)

```
┌─────────────────────────────────────────┐
│ ✏️ Modifier la condition                │
├─────────────────────────────────────────┤
│ Titre (readonly)                        │
│ ┌─────────────────────────────────────┐ │
│ │ Financement hypothécaire            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Date d'échéance                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📅 15 février 2026                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Note                                    │
│ ┌─────────────────────────────────────┐ │
│ │ Client attend confirmation banque   │ │
│ │ RBC. Suivi prévu le 10/02.          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Annuler]  [✓ Enregistrer]              │
└─────────────────────────────────────────┘
```

### Fichiers à modifier

**Backend:**
- `app/controllers/conditions_controller.ts` → update method
- `app/validators/condition_validator.ts` → updateValidator
- `app/models/condition_event.ts` → log changes

**Frontend:**
- `components/transaction/ConditionCard.tsx` → bouton éditer
- `components/transaction/EditConditionModal.tsx` → nouveau
- `api/conditions.api.ts` → update method

### Tests (Murat)

- [ ] PATCH dueDate ok → 200
- [ ] PATCH note ok → 200
- [ ] PATCH invalide → 422
- [ ] PATCH autre owner → 403
- [ ] PATCH condition archived → 409
- [ ] Modal ouvre/ferme correctement
- [ ] Save → update visible instantanément
- [ ] Réseau lent → loader visible
- [ ] ActionZone change après update

### Phase B (après)
- Édition niveau (blocking/required/recommended)
- Règle : "downgrade only" OU "pas si étape passée"

**Statut : ✅ IMPLÉMENTÉ ET TESTÉ**

---

## D37 - Deadlines relatives dans templates (Implémenté)

### Objectif
Permettre aux templates de conditions de définir des deadlines relatives qui seront calculées automatiquement à la création.

### Nouveaux champs dans ConditionTemplate

| Champ | Type | Description |
|-------|------|-------------|
| `deadlineReference` | `'acceptance' \| 'closing' \| 'step_start'` | Point de référence |
| `defaultDeadlineDays` | `number` | Nombre de jours (positif ou négatif) |

### Points de référence

| Référence | Signification |
|-----------|---------------|
| `acceptance` | Date d'acceptation de l'offre |
| `closing` | Date de clôture prévue |
| `step_start` | Date de début de l'étape |

### Exemples de calcul

```
dueDate = referenceDate + defaultDeadlineDays

Exemples avec acceptance=1er fév, closing=1er mars:
- Dépôt (acceptance +2) → 3 février
- Inspection (acceptance +7) → 8 février
- Avocat (closing -14) → 15 février (countdown)
- Signatures (closing 0) → 1er mars
```

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `backend/database/migrations/1772000000006_*.ts` | Nouvelle migration (2 colonnes) |
| `backend/app/models/condition_template.ts` | +2 champs + méthode `calculateDueDate()` |
| `backend/app/models/condition_event.ts` | +type `condition_updated` (fix D38) |
| `backend/database/seeders/condition_templates_seeder.ts` | Deadlines sur tous les 52 templates |

### Deadlines par pack

**Universal (11 templates):**
- Step 2: Pas de deadline (pré-offre)
- Step 3: acceptance +2 à +7 jours
- Step 4: acceptance +10 jours
- Step 5-7: closing countdown (-14 à 0)
- Step 8: closing +7 jours

**Rural NB (12 templates):**
- Tests puits/fosse: acceptance +3 à +10 jours
- Servitudes: acceptance +10 jours
- Visite pré-fermeture: closing -2 jours

**Condo NB (15 templates):**
- Documents condo: acceptance +2 à +10 jours
- Prêteur satisfait: closing -5 jours

**Finance NB (14 templates):**
- Financement: acceptance +10 jours
- Title search: closing -21 jours
- Instructions banque: closing -14 à -3 jours
- Suivi hypothèque: closing +30 jours

**Statut : ✅ IMPLÉMENTÉ**

---

## D39 - Pack conditions optionnel (Implémenté)

### Objectif
Permettre au courtier de choisir entre charger automatiquement les conditions du pack ou gérer manuellement.

### Principe
> "Le système propose, le courtier dispose"

### UI dans CreateTransactionModal

```
┌─────────────────────────────────────────────┐
│ 📦 Conditions de départ                     │
│                                             │
│ ● Charger le pack recommandé               │
│   → Conditions pré-configurées selon profil │
│                                             │
│ ○ Je gère moi-même                         │
│   → Transaction vide, ajout manuel          │
└─────────────────────────────────────────────┘
```

### Fichiers modifiés

**Backend:**
| Fichier | Modification |
|---------|--------------|
| `backend/app/services/conditions_engine_service.ts` | +`loadPackForTransaction()` avec D37 deadlines |
| `backend/app/controllers/transaction_profiles_controller.ts` | +endpoint `loadPack` |
| `backend/start/routes.ts` | +route `POST /transactions/:id/profile/load-pack` |

**Frontend:**
| Fichier | Modification |
|---------|--------------|
| `frontend/src/api/transactions.api.ts` | +`loadConditionPack()` |
| `frontend/src/components/CreateTransactionModal.tsx` | +toggle + appel API |
| `frontend/src/i18n/locales/fr/common.json` | +traductions conditionPack |
| `frontend/src/i18n/locales/en/common.json` | +traductions conditionPack |

### Flow de création

1. User remplit le formulaire (client, type, profil)
2. Toggle visible après profil complet
3. À la soumission:
   - Créer transaction
   - Créer profil
   - Si `loadConditionPack === true`:
     - Appeler `POST /transactions/:id/profile/load-pack`
     - Charger toutes les conditions applicables
     - Calculer les deadlines avec D37

### Intégration D37

Les conditions chargées utilisent automatiquement `calculateDueDate()` pour pré-calculer les deadlines basées sur:
- `acceptance` (date acceptation)
- `closing` (date clôture)
- `step_start` (date début étape)

**Statut : ✅ IMPLÉMENTÉ**

---

## D41 - Garde-fous Validation Conditions (VALIDÉ)

### Problème identifié
Les checkboxes de conditions peuvent être cochées sans friction, même pour les conditions bloquantes. Risque d'erreur/oubli.

### Principe
> "Ofra ne vous bloque pas, mais il documente."

Friction proportionnelle au risque + trace complète.

### Gradation par niveau

| Niveau | Modal | Preuve | Escape | Note |
|--------|-------|--------|--------|------|
| 🔴 **Blocking** | Oui | Demandée | Raison + checkbox + phrase | Obligatoire si escape |
| 🟡 **Required** | Oui | Optionnelle | Direct | Optionnelle |
| 🟢 **Recommended** | Non | - | - | - |

### Flow BLOCKING

```
Clic checkbox
     ↓
┌─────────────────────────┐
│ Modal upload preuve     │
│  [Uploader fichier]     │
│  ou                     │
│  [Je n'ai pas de preuve]│
└─────────────────────────┘
     ↓                ↓
  Upload OK      Escape modal
     ↓                ↓
  ✅ Validé      Raison (10 char min)
  + preuve       + □ Je comprends
  attachée       + Phrase "je confirme sans preuve"
                      ↓
                 ⚠️ Validé sans preuve
```

### Flow REQUIRED

```
Clic checkbox → Modal simple (note + upload optionnels) → ✅ Validé
```

### Flow RECOMMENDED

```
Clic checkbox → Toggle direct → ✅ Validé
```

### États visuels ConditionCard

| État | Affichage |
|------|-----------|
| Complété + preuve | ✅ + 📎 "1 preuve attachée" |
| Complété sans preuve | ⚠️ + note visible + "Complété sans preuve (confirmation manuelle)" |
| Pending | ○ + countdown si deadline |

### Ajustements ChatGPT (8.8/10 → 9.3)

1. ✅ Texte légal discret : "Cette action peut être consultée en cas de vérification ou de litige."
2. ✅ Métadonnées preuve : Type, taille, date
3. ✅ Note visible sur la card pour required/blocking sans preuve
4. ✅ Badge clair "Complété sans preuve (confirmation manuelle)"

### Fusion avec D33

D41 concrétise D33 (Documents = preuves) :
- Upload directement sur la condition
- Pas d'onglet Documents séparé
- Preuve = attachée à SA condition
- Audit trail riche

### Composants à créer

| Composant | Description |
|-----------|-------------|
| `ConditionValidationModal.tsx` | Modal principale (3 variantes) |
| `EscapeConfirmationModal.tsx` | Sous-modal confirmation sans preuve |
| `EvidenceUploader.tsx` | Upload avec drag & drop |
| `EvidenceBadge.tsx` | Affichage preuve sur card |

### Audit Trail (ConditionEvent)

```typescript
{
  eventType: 'resolved',
  meta: {
    resolution_type: 'completed',
    has_evidence: boolean,
    evidence_id: number | null,
    evidence_filename: string | null,
    note: string | null,
    escaped_without_proof: boolean,
    escape_reason: string | null
  }
}
```

### Pricing

| Feature | Solo | Pro | Agence |
|---------|------|-----|--------|
| Validation avec preuve | ✅ | ✅ | ✅ |
| Upload documents | 3/TX | Illimité | Illimité |

**Statut : ✅ IMPLÉMENTÉ**

### Fichiers créés/modifiés (D41)

**Backend:**
| Fichier | Description |
|---------|-------------|
| `database/migrations/1772000000007_add_escape_tracking_to_conditions.ts` | Migration D41 |
| `app/models/condition.ts` | +3 champs escape, +ResolveOptions, méthode resolve() enrichie |
| `app/controllers/conditions_controller.ts` | Validateur et endpoint resolve enrichis |

**Frontend:**
| Fichier | Description |
|---------|-------------|
| `components/transaction/ConditionValidationModal.tsx` | **NEW** - Modal validation graduée |
| `components/transaction/EscapeConfirmationModal.tsx` | **NEW** - Confirmation sans preuve |
| `components/transaction/EvidenceUploader.tsx` | **NEW** - Upload drag & drop |
| `components/transaction/EvidenceBadge.tsx` | **NEW** - Badge preuve/escape |
| `components/transaction/ConditionsTab.tsx` | Intégration modals D41 |
| `components/transaction/ConditionCard.tsx` | +import EvidenceBadge, affichage escape |
| `components/transaction/index.ts` | Exports D41 |
| `api/conditions.api.ts` | Types D41 (escape fields, resolve options) |
| `i18n/locales/fr/common.json` | Traductions validation.* |
| `i18n/locales/en/common.json` | Traductions validation.* |

---

## Récap complet des décisions UX

| ID | Décision | Statut |
|----|----------|--------|
| D32 | Timeline interactive (cliquable par étape) | ✅ Validé |
| D33 | Documents = preuves de conditions | ✅ **Fusionné dans D41** |
| D34 | Offres → résumé dans header | ✅ Validé |
| D35 | Historique/Notes → drawer secondaire | ✅ Validé |
| D36 | Archivage automatique des transactions | ✅ Validé |
| D37 | Deadlines relatives dans templates | ✅ **IMPLÉMENTÉ** |
| D38 | Conditions éditables (deadline, note, niveau) | ✅ **IMPLÉMENTÉ** (Phase A) |
| D39 | Pack conditions optionnel (opt-in) | ✅ **IMPLÉMENTÉ** |
| D40 | Onboarding personnalisé | ✅ **RÉVISÉ & VALIDÉ** |
| D41 | Garde-fous validation + preuves | ✅ **IMPLÉMENTÉ** |

---

## Reprise

**Prochaines étapes suggérées:**

1. ~~D41 - Garde-fous validation~~ ✅ FAIT
2. **D40 - Onboarding personnalisé** (prochain)
3. D32 - Timeline interactive
4. D34/D35 - Nettoyage onglets
5. D36 - Archivage automatique

---

*Document consigné par Paige - 2026-02-03*
*Party Mode Session - Refonte UX + D41 Implementation*
