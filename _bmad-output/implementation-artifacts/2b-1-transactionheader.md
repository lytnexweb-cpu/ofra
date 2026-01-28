# Story 2B.1: TransactionHeader

Status: done

## Story

As a **real estate agent viewing a transaction**,
I want **a clear header with client name, property address, and a back link**,
So that **I can identify the transaction and navigate back easily (FR27)**.

## Acceptance Criteria

1. **Given** une transaction avec client **When** TransactionHeader se charge **Then** affiche "prenom nom" du client
2. **Given** une transaction sans client **When** TransactionHeader se charge **Then** affiche fallback i18n `transaction.client`
3. **Given** une transaction avec property.address **When** TransactionHeader se charge **Then** affiche l'adresse avec separateur "—"
4. **Given** une transaction sans property **When** TransactionHeader se charge **Then** pas d'adresse affichee
5. **Given** TransactionHeader **When** l'agent clique "Back" **Then** navigue vers /transactions
6. **Given** TransactionHeader **When** rendu **Then** data-testid="transaction-header", "back-link", "header-client"

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : TransactionHeader.tsx (54 lignes) est **completement implemente**. Manque tests dedies.

### Composant analyse :
- `TransactionHeader.tsx` : 54 lignes
- Back link vers `/transactions` avec icone ArrowLeft
- Client name : `firstName lastName` ou fallback `t('transaction.client')`
- Property address : conditionally rendered avec `data-testid="header-address"`
- data-testid : `transaction-header`, `back-link`, `header-client`
- i18n : `common.back`, `transaction.client`

## Tasks / Subtasks

- [x] **Task 1: Creer tests TransactionHeader**
  - [x] Renders client full name (firstName + lastName) — AC1
  - [x] Renders fallback when no client — AC2
  - [x] Renders property address when available — AC3
  - [x] Hides address when no property — AC4
  - [x] Back link to /transactions — AC5
  - [x] data-testid attributes — AC6
  - [x] WCAG a11y — DoD

## Dev Agent Record

### Completion Notes List

- 7 tests created, all pass first run
- No code changes needed — component fully implemented

### File List

- `frontend/src/components/transaction/__tests__/TransactionHeader.test.tsx` — CREATED (7 tests)
