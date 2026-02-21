# Phase 0 — PRD vs Code Reality Check
## Audit Complet Ofra — 20 fev 2026

---

## Inventaire du Projet

| Categorie | Quantite |
|-----------|----------|
| Routes API backend | 180+ endpoints |
| Controllers | 32 |
| Models | 33 |
| Services | 17 |
| Validators | 20 |
| Email templates | 28 |
| Migrations | 89 |
| Frontend routes | 24 |
| Frontend pages | 25 (1 orpheline: AdminSubscribersPage) |
| API modules frontend | 24 |
| i18n keys | 2836 lignes (FR/EN parite parfaite) |
| Tests backend | 277 PASS |
| Tests frontend | 319 PASS (8 pre-existing failures) |

---

## Score Global PRD vs Code

| Section PRD | Features | DONE | PARTIAL | MISSING | % |
|-------------|----------|------|---------|---------|---|
| 1: Vision | 8 | 8 | 0 | 0 | 100% |
| 2: Pricing | 16 | 13 | 2 | 1 | 81% |
| 3: Billing | 6 | 4 | 1 | 1 | 67% |
| 4: UX Decisions (32) | 32 | 18 | 7 | 7 | 56% |
| 5: Maquettes (20) | 20 | 10 | 8 | 2 | 50% |
| 6: Comportement | 8 | 6 | 2 | 0 | 75% |
| 7: Implementation | 22 | 20 | 1 | 1 | 91% |
| 8: Tests User | 12 | 12 | 0 | 0 | 100% |
| 9: Roadmap | ~40 | 30 | 4 | 6 | 75% |
| 10: Metriques | 7 | 1 | 6 | 0 | 14% |
| 11: Annexes | 11 bugs | 11 | 0 | 0 | 100% |
| **TOTAL** | **~182** | **133** | **31** | **18** | **~73%** |

---

## Blocs Pre-Lancement (9 blocs)

| Bloc | Contenu | Statut |
|------|---------|--------|
| 1: Trial Backend | Middleware, flags, limits | DONE |
| 2: Trial Frontend | Banners, soft wall, hard wall | DONE (hard wall partial) |
| 3: Landing Page | Hero, features, CTA | PARTIAL (no public landing) |
| 4: Pricing Page | 4 plans, toggle, founder | DONE |
| 5: Legal | CGU, Privacy | MISSING |
| 6: Emails | Welcome, trial reminders, digests | DONE |
| 7: Stripe | Elements, webhooks, subscribe | EN COURS (code done, Dashboard TBD) |
| 8: Smart Offers | Parties, direction, comparison, intake | DONE |
| 9: Admin Refonte | Pulse, Gens, Config, SiteMode, Promos | DONE |

---

## Phase 2 "Les Connexions" (12/12 DONE)

| Sprint | Features | Statut |
|--------|----------|--------|
| Sprint 1: Offre-Parties | C1-C4 (migration, auto-party, pre-fill) | DONE |
| Sprint 2: UI Buyer/Seller | C5-C8 (CTA adaptatif, comparateur, client form) | DONE |
| Sprint 3: Carnet Pros | C9-C12 (CRUD, suggestions, assignation) | DONE |

---

## Boucle Notification Offres (N1-N6) — MIS A JOUR 20 FEV

| Gap | Severite | Statut | Note |
|-----|----------|--------|------|
| N1: Email buyer sur contre-offre | CRITIQUE | **DONE (20 fev)** | OfferCounterBuyerMail cree + wire |
| N2: OfferAcceptedMail jamais envoye | CRITIQUE | **DONE (20 fev)** | Wire dans accept() buyer+seller |
| N3: Confirmation soumission buyer | HAUTE | **DONE (20 fev)** | OfferReceivedConfirmationMail cree + wire |
| N4: Expiration offres non nettoyee | HAUTE | TODO | Pas de cron/lazy cleanup |
| N5: Pas de lien intake pour vendeur | MOYENNE | TODO | Intake hardcode buyer_to_seller |
| N6: Buyer ne peut pas accepter via lien public | MOYENNE | TODO | Pas d'endpoint public accept |

---

## GAPS CRITIQUES POUR LANCEMENT (20 mars 2026)

### BLOQUANTS (P0)

| # | Gap | Effort | Impact |
|---|-----|--------|--------|
| 1 | **Stripe Dashboard** : creer 4 produits, webhook URL, seed stripeProductId | 1-2h | Pas de paiement = pas de revenue |
| 2 | **Legal (CGU/Privacy)** | 1 jour | LPRPDE/PIPEDA requis pour lancement public |

### IMPORTANTS (P1)

| # | Gap | Effort | Impact |
|---|-----|--------|--------|
| 3 | **Landing page publique** (unauthenticated `/`) | 4h | Visiteurs voient login au lieu de marketing |
| 4 | **Hard wall J33+** | 2h | Users post-trial peuvent encore utiliser l'app |
| 5 | **N4: Expiration offres** | 30min | Offres expirees restent actives |

### NICE-TO-HAVE (P2)

| # | Gap | Effort |
|---|-----|--------|
| 6 | Share links manager (D54) | 2h |
| 7 | Seller intake links (N5) | 2h |
| 8 | Public offer accept (N6) | 2h |
| 9 | Admin Sprint D fixes (65 issues) | 1-2 jours |
| 10 | S3 file storage | 2-3h |

---

## FANTOMES (PRD dit DONE mais code absent/incomplet)

| Feature | PRD dit | Realite |
|---------|---------|---------|
| POST /api/admin/plans | Code Bloc 9 | Seulement PUT (edit), pas de creation |
| Auto-archive TX terminees (D36) | Valide | Non implemente |
| Bloc "Valeur protegee" (D43) | Phase 2 | Non commence |

---

## CORRECTIFS APPLIQUES CETTE SESSION (20 fev)

1. **N1**: `OfferCounterBuyerMail` cree + wire dans `addRevision()`
2. **N2**: `OfferAcceptedMail` wire dans `accept()` (buyer + seller)
3. **N3**: `OfferReceivedConfirmationMail` cree + wire dans `submit()`
4. **Stripe Docker build**: Fix `VITE_STRIPE_PUBLISHABLE_KEY` injection via ARG + fly.toml build args
5. **Fly.io machines**: Reduit de 4 a 2 (suppression doublons)

---

## RESUME POUR PHASE 1 AUDITS SPECIALISES

Ce rapport sert de base pour les audits Phase 1 :
- **Sally (UX/UI)** : Verifier conformite maquettes M01-M14, responsive, accessibilite
- **Winston (Architecture)** : Patterns, securite, scalabilite, dette technique
- **Amelia (Code Quality)** : TS errors, code smells, patterns inconsistants
- **Murat (Tests)** : Couverture, tests manquants, edge cases

Chaque agent ecrit dans `phase1-*.md` dans ce dossier.
