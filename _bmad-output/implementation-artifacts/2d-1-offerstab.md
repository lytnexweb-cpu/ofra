# Story 2D.1: OffersTab (OffersSection)

Status: done

## Story

As a **real estate agent**,
I want **to see all offers on a transaction with status badges, prices, direction labels, and revision history**,
So that **I can track negotiation progress and take actions (accept/reject/counter/withdraw) (FR30-FR34)**.

## Acceptance Criteria

1. **Given** aucune offre **When** OffersSection se charge **Then** texte "No offers yet."
2. **Given** offre recu **When** affiche **Then** badge "Received" + prix "$450,000" formatte CAD
3. **Given** OffersSection **When** rendu **Then** bouton "+ New Offer" visible
4. **Given** offre expanded **When** status=received **Then** boutons Accept, Counter, Reject, Withdraw
5. **Given** offre expanded **When** affiche **Then** section "Revision History" avec numero "#1"
6. **Given** offre **When** direction=buyer_to_seller **Then** label "Buyer -> Seller"
7. **Given** OffersSection **When** rendu **Then** aucune violation WCAG 2.1 AA

## Tasks / Subtasks

- [x] **Task 1: Creer tests OffersSection** — 8 tests (empty, loading, badge+price, new offer btn, action buttons, revision history, direction label, WCAG a11y)
