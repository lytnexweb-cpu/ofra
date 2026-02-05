# D32 - Timeline Interactive

> Décision validée: 2026-02-03
> Participants: Équipe BMAD + Validation externe (ChatGPT)
> Statut: **VALIDÉ - Prêt pour implémentation**

---

## Contexte

Question posée: "Que signifie timeline pour un agent immobilier solo au NB?"

## Débat d'équipe

### Perspectives recueillies

**Mary (Analyst):**
- Agent solo gère 5-15 transactions actives simultanément
- Besoin: "Où en est ma transaction? Qu'est-ce qui s'est passé? Qu'est-ce qui vient après?"
- Timeline = fil d'Ariane pour ne pas se perdre

**Winston (Architect):**
- 2 concepts existants: workflow (8 étapes) vs historique (activités)
- Hypothèse: l'agent veut les deux, mais pas mélangés

**Sally (UX):**
- Questions à répondre en 2 secondes:
  1. "C'est rendu où?" → Étape actuelle
  2. "Il reste quoi à faire?" → Conditions en attente
  3. "Qu'est-ce qui s'est passé avec X?" → Fouiller si besoin
- Timeline = GPS de transaction

**Murat (TEA):**
- Usage principal: CYA (Cover Your Ass)
- Vérifier qu'une condition a été complétée
- Retrouver une date précise
- Identifier les responsabilités

**Barry (QuickFlow):**
- Agent solo n'a pas le temps de lire 50 entrées
- Veut cliquer le moins possible
- Veut voir rouge/vert (problème ou pas)
- Proposition: 8 pastilles avec couleurs

**Paige (Tech Writer):**
- Agents NB utilisent des checklists papier
- Timeline doit ressembler à ça, en mieux

## Décision finale

### Ce que Timeline signifie

> "La timeline n'est pas une histoire du passé, c'est un tableau de bord du présent."

**Timeline = les 8 étapes du workflow**, pas un journal d'activités.

### Spécification D32

**Affichage:**
```
✓ Offre soumise (15 jan)
✓ Offre acceptée (17 jan)
● Période conditionnelle   ← ÉTAPE COURANTE
  - [ ] Inspection
  - [ ] Financement
  - [x] Dépôt
○ Ferme en attente
○ Pré-clôture
○ Closing
○ Post-closing
```

**Statuts visuels:**
- Vert ✓ = complété
- Orange ● = en cours (1 seule étape active)
- Gris ○ = à venir

**Interactions:**
- Click étape passée → voir conditions archivées (lecture seule)
- Click étape courante → voir conditions actives (modifiables)
- Click étape future → preview vide ou désactivé

### Retour arrière

**Décision: NON pour le MVP**

Raisons:
- Risque légal (qui a modifié quoi?)
- Risque UX (confusion)
- Risque technique (états incohérents)
- Risque support ("j'ai cassé ma transaction")

**Alternative V2:** États spéciaux
- Transaction en pause
- Transaction annulée
- Transaction échouée

### Architecture

```
🧭 Timeline = Workflow (8 étapes) → MVP
📜 Activity Log = Audit/Conformité → Post-MVP
```

Séparation claire, pas de dette technique.

## Critères d'acceptation

- [x] 8 étapes affichées verticalement
- [x] Indicateurs visuels de statut (vert/orange/gris)
- [x] Click étape passée → conditions archivées (readonly)
- [x] Click étape courante → conditions actives
- [x] Aucun moyen de reculer le workflow
- [x] Responsive mobile

## Tests requis

- [ ] Click chaque étape → affiche les bonnes conditions
- [ ] Étapes passées = readonly (pas de modification)
- [ ] Aucun bouton/action pour reculer
- [ ] Performance < 500ms

---

## Décision d'implémentation (2026-02-04)

**Débat d'équipe:** Option 1 validée (4 votes sur 6)

**Nomenclature:**
- Onglet renommé "Étapes" (FR) / "Steps" (EN)
- Tab key: `steps` (anciennement `timeline`)

**Fichiers modifiés:**
- `frontend/src/components/transaction/WorkflowTimeline.tsx` (NOUVEAU)
- `frontend/src/pages/TransactionDetailPage.tsx`
- `frontend/src/components/transaction/TransactionBottomNav.tsx`
- `frontend/src/components/transaction/index.ts`
- `frontend/src/i18n/locales/fr/common.json`
- `frontend/src/i18n/locales/en/common.json`

**Activity Log:** Accessible via bouton "Voir l'historique complet" → ouvre drawer avec TimelineTab (inchangé)

---

**Validé par:** Sam (Product Owner)
**Implémentation:** ✅ COMPLÉTÉ (2026-02-04)
