# D35 — Lien d'offre public (Offer Intake Link)

**Date** : 2026-02-11
**Statut** : Approuvé (vote unanime 9/9)
**Auteur** : Équipe BMAD (Party Mode)

---

## Contexte

Lors de l'implémentation du Party Linkage (fromPartyId/toPartyId sur offer_revisions), l'équipe a identifié un problème fondamental : **le workflow Ofra ne guide pas le courtier vers l'identification de la contrepartie**. Le système TransactionParties existe mais est déconnecté du flux naturel de la transaction.

Une recherche concurrentielle sur 15+ plateformes (Lone Wolf, Dotloop, SkySlope, etc.) a confirmé que :
- Aucune plateforme ne demande la contrepartie à la création
- Le moment naturel d'identification est **l'offre**
- SkySlope Offers a validé le modèle "lien public d'offre" aux US
- Aucune plateforme francophone canadienne n'offre cette fonctionnalité

## Décision

Implémenter un **lien d'offre partageable** que le courtier inscripteur peut envoyer au courtier acheteur (ou à l'acheteur directement). L'acheteur soumet son offre via un formulaire public, ce qui crée automatiquement l'Offre ET la TransactionParty.

## Phasing

| Phase | Scope | Effort estimé |
|-------|-------|---------------|
| **A (MVP)** | Lien partageable + formulaire public minimaliste (nom, email, téléphone, prix, message) → crée Offre + TransactionParty automatiquement | ~1 sprint |
| **B** | Formulaire enrichi (conditions, dépôt, financement, upload docs) + notifications temps réel | ~1 sprint |
| **C** | Portail acheteur complet (suivi offre, contre-offres, statut) | ~2 sprints |

## Contraintes techniques

- Premier endpoint public de soumission de données dans Ofra (les share links existants sont en lecture seule)
- Sécurité : token UUID non-devinable, expiration configurable, rate limiting, validation input
- Réutilise l'infrastructure TransactionShareLink existante (token, expiration, isActive)
- Le formulaire public est une page React standalone (pas de layout auth)

## Infrastructure existante réutilisable

- `TransactionShareLink` : modèle avec token, expiration, isActive, accessCount — **fondation directe**
- `TransactionShareLinksController.publicAccess()` : endpoint public existant (`/api/share/:token`)
- `TransactionParty` : modèle avec role, fullName, email, phone, isPrimary
- `OfferService.createOffer()` : accepte déjà fromPartyId/toPartyId
- `middleware.rateLimit()` : déjà utilisé sur les routes publiques auth

## Flux utilisateur (Phase A)

### Côté courtier inscripteur
1. Sur la page de détail transaction, clic "Générer lien d'offre"
2. Configure : expiration (7j/14j/30j/custom), mot de passe optionnel
3. Copie le lien ou l'envoie par email/SMS
4. Reçoit une notification quand une offre est soumise

### Côté acheteur/courtier acheteur
1. Ouvre le lien dans son navigateur (pas besoin de compte Ofra)
2. Voit un résumé de la propriété (adresse, prix demandé, photo si dispo)
3. Remplit le formulaire : nom complet, email, téléphone, prix offert, message
4. Soumet → confirmation affichée
5. L'offre apparaît instantanément dans le tableau de bord du courtier inscripteur

## Vote

| Agent | Vote | Condition |
|-------|------|-----------|
| John (PM) | OUI | — |
| Winston (Arch) | OUI | Périmètre Phase A défini avant dev |
| Amelia (Dev) | OUI | — |
| Murat (Test) | OUI | Tests sécurité obligatoires sur endpoint public |
| Sally (UX) | OUI | — |
| Mary (Analyst) | OUI | — |
| Bob (SM) | OUI | — |
| Barry (Dev) | OUI | — |
| Paige (Writer) | OUI | — |

**Résultat : 9/9 unanime**
