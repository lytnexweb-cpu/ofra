# Story 2B.4: TransactionDetailPage Orchestrator + Onglets

Status: done

## Story

As a **real estate agent**,
I want **the transaction detail page to show loading, error, not-found, and full views with 5 tabs**,
So that **I can access all aspects of a transaction from one place (FR30)**.

## Acceptance Criteria

1. **Given** data loading **When** TransactionDetailPage se charge **Then** affiche spinner data-testid="detail-loading"
2. **Given** API error **When** TransactionDetailPage se charge **Then** affiche erreur + retry button data-testid="detail-error"
3. **Given** transaction non trouvee **When** API repond sans transaction **Then** affiche not-found data-testid="detail-not-found"
4. **Given** transaction chargee **When** rendu **Then** affiche TransactionHeader + steppers + 5 onglets
5. **Given** 5 onglets **When** l'agent clique un onglet **Then** contenu change (conditions par defaut)
6. **Given** TransactionDetailPage **When** rendu **Then** data-testid="transaction-detail-page", "detail-tabs"

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : TransactionDetailPage.tsx (162 lignes) est **completement implemente**. Manque tests dedies.

## Tasks / Subtasks

- [x] **Task 1: Creer tests TransactionDetailPage**
  - [x] Loading state shows spinner — AC1
  - [x] Error state shows retry button — AC2
  - [x] Not-found state — AC3
  - [x] Full view renders header + tabs — AC4
  - [x] Default tab is conditions — AC5
  - [x] 5 tab triggers present — AC4
  - [x] data-testid attributes — AC6
  - [x] WCAG a11y — DoD
