# D33 - Decisions UX Maquettes Transaction Detail

> Date de validation: 2026-02-06
> Participants: Sam (PO), Sally (UX), John (PM), Winston (Architect), ChatGPT (revue externe)
> Consigne par: Paige (Tech Writer)
> Statut: **VALIDE — Source de verite pour implementation**

---

## Portee

Decisions prises lors de la phase maquettes HTML (mockup-first approach) pour les ecrans de transaction, validees iterativement sur 4 versions (v1→v4) + modales de confirmation.

---

## Maquette 01 — Transaction Detail Page (VERROUILLEE)

Fichier: `maquettes/01-transaction-detail.html`

### D33.1 — Workflow 8 etapes (source: seeder backend)

**Decision:** Le workflow affiche exactement 8 etapes avec les noms officiels du backend.

| # | Nom officiel |
|---|---|
| 1 | Consultation acheteur/vendeur |
| 2 | Offre soumise |
| 3 | Offre acceptee |
| 4 | Periode conditionnelle |
| 5 | Fermeture en attente |
| 6 | Taches pre-cloture |
| 7 | Jour de cloture / Remise des cles |
| 8 | Suivi post-cloture |

**Rationale:** Coherence backend/frontend, source unique de verite.

### D33.2 — Timeline verticale

**Decision:** Timeline affichee verticalement (pas horizontale) avec indicateurs visuels:
- Vert + check = complete
- Bleu + pulse = etape active
- Gris = a venir

**Rationale:** Plus lisible en responsive, permet d'afficher les sous-details (conditions) inline.

### D33.3 — Header prix + offre acceptee

**Decision:** Format du header prix:
- Sans offre acceptee: `Achat 350 000 $`
- Avec offre acceptee: `Achat 350 000 $ (offre acceptee : 340 000 $)`

**Regle:** N'afficher "(offre acceptee : X $)" que si une offre est effectivement acceptee.

### D33.4 — Offres: 3 etats avec actions dynamiques

**Decision:** Chaque carte offre affiche des actions differentes selon son statut:

| Statut | Badge | Actions | Lien workflow |
|---|---|---|---|
| Recue | Bleu | Accepter, Contre-offre, Refuser | Concerne etape: 2. Offre soumise — en negociation |
| Acceptee | Vert | Voir details, Addenda | A declenche: 3. Offre acceptee → 4. Periode conditionnelle |
| Refusee | Gris | Voir, Restaurer | Aucun impact workflow |

### D33.5 — CTA principal "Valider l'etape"

**Decision:**
- **CTA principal:** "Valider l'etape" — toujours visible, disabled si conditions bloquantes non resolues
- **Action secondaire:** "Passer a l'etape suivante" dans le menu "..." (action avancee, pas en evidence)

**Rationale:** Eviter la confusion entre valider (verifier les conditions) et passer (forcer l'avancement).

### D33.6 — Cockpit "Prochaines actions"

**Decision:** Bloc en haut de page montrant les actions prioritaires:
- Conditions bloquantes en premier (badge rouge)
- Conditions requises ensuite (badge amber)
- Triees par date d'echeance

**Rationale:** L'agent NB veut savoir "qu'est-ce que je dois faire maintenant?" en 2 secondes.

### D33.7 — Mobile: offres compactees

**Decision:**
- L'offre active (Recue) est depliee par defaut
- Les autres offres sont masquees derriere un toggle "Voir historique (N)"
- Bouton email de contact ajoute a cote du telephone

### D33.8 — Zero badges NOUVEAU

**Decision:** Aucun badge "NOUVEAU" dans l'interface. L'information de nouveaute est vehiculee par le statut lui-meme (ex: badge "Recue" sur une offre).

**Rationale:** Les badges NOUVEAU polluent visuellement et deviennent rapidement obsoletes.

---

## Maquette 02 — Accepter une offre (VERROUILLEE)

Fichier: `maquettes/02-accepter-offre.html`

### D33.9 — Modale de confirmation (pas inline)

**Decision:** L'acceptation d'une offre passe par une modale de confirmation overlay, pas une action inline.

**Rationale:** Action a impact majeur (modifie le workflow, affecte d'autres offres, met a jour le prix).

### D33.10 — Formulation securisante (pas "irreversible")

**Decision:** Le sous-titre de la modale est:
> "Cette action modifie le workflow et sera enregistree dans l'historique"

**Interdit:** Ne jamais utiliser "irreversible", "definitive", "sans retour" — trop anxiogene.

### D33.11 — Impact workflow visible avant confirmation

**Decision:** La modale affiche 4 impacts avant confirmation:
1. Etape 3 marquee comme completee
2. Etape 4 demarre automatiquement
3. Conditions de l'etape 4 activees (financement, depot, inspection, eau, RPDS)
4. Prix de la transaction mis a jour

### D33.12 — Terminologie "non retenue" (pas "expiree")

**Decision:** Les offres concurrentes deviennent "non retenue" (pas "expiree", "fermee", "rejetee").

**Coherence:** Le terme "non retenue" est utilise:
- Dans la modale: "sera marquee comme non retenue"
- Dans l'etat de succes: "1 offre marquee comme non retenue"
- Sur la carte offre: badge "Non retenue" (a implementer)

### D33.13 — "Conditions activees" (pas "creees")

**Decision:** Dans l'etat de succes, utiliser "5 conditions activees" (pas "creees").

**Rationale:** Les conditions existent deja dans le template; l'acceptation les active, elle ne les cree pas.

### D33.14 — Toggle email enrichi

**Decision:** Le toggle "Notifier les parties par email" affiche quand ON:
- **Destinataires** avec statut: pastille verte si email connu, amber si manquant
- **Warning inline** "adresse manquante" pour les contacts sans email
- **Lien "Previsualiser l'email"** (mock pour MVP)
- Par defaut: toggle ON

### D33.15 — Mobile: bottom-sheet pattern

**Decision:** Sur mobile (375px), les modales se transforment en bottom-sheet:
- Ancree en bas de l'ecran
- Coins arrondis en haut uniquement
- Drag handle (barre grise)
- Corps scrollable, header/footer fixes
- Animation slide-up (pas scale)

**Rationale:** Pattern natif iOS/Android, meilleure ergonomie tactile.

---

## Regles transversales

### R1 — Approche mockup-first
Toute fonctionnalite UI passe par maquette HTML → validation PO → dev tickets → implementation.

### R2 — Source de verite workflow
Les noms d'etapes viennent UNIQUEMENT de `backend/database/seeders/nb_workflow_template_seeder.ts`.

### R3 — Responsive obligatoire
Chaque maquette est validee sur 3 breakpoints: Mobile (375px), Tablette (768px), Desktop (1280px).

### R4 — Coherence terminologique
Un concept = un terme, utilise partout. Voir glossaire ci-dessous.

---

## Glossaire UX valide

| Concept | Terme FR | Terme EN |
|---|---|---|
| Offre non choisie | Non retenue | Not selected |
| Conditions qui existent deja | Activees | Activated |
| Avancer l'etape apres validation | Valider l'etape | Validate step |
| Forcer l'avancement | Passer a l'etape suivante | Skip to next step |
| Actions prioritaires | Prochaines actions | Next actions |
| Action majeure sur workflow | Modale de confirmation | Confirmation modal |

---

## Pipeline maquettes restantes

| # | Nom | Priorite | Statut |
|---|---|---|---|
| 01 | Transaction Detail | P0 | VERROUILLE |
| 02 | Accepter une offre | P1 | VERROUILLE |
| 03 | Valider l'etape | P1 | A FAIRE |
| 04 | Resoudre condition | P1 | A FAIRE |
| 05 | Ajouter condition | P1 | A FAIRE |
| 06 | Nouvelle offre | P2 | A FAIRE |
| 07 | Contre-offre | P2 | A FAIRE |

---

**Consigne par:** Paige (Tech Writer)
**Valide par:** Sam (Product Owner)
**Date:** 2026-02-06
