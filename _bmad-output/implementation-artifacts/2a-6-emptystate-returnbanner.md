# Story 2A.6: EmptyState + ReturnBanner

Status: done

## Story

As a **new real estate agent**,
I want **a welcoming empty state on day 1 with a clear call to action**,
So that **I know exactly how to start using Ofra (FR25)**.

## Acceptance Criteria

1. **Given** 0 transactions **When** TransactionsPage se charge **Then** EmptyState avec titre, description, CTA "Creer ma premiere transaction" (FR25)
2. **Given** EmptyState affiche **When** l'agent clique CTA **Then** le formulaire s'ouvre
3. **Given** l'agent revient apres > 24h **When** TransactionsPage se charge **Then** ReturnBanner s'affiche (FR26) + localStorage lastSeenAt
4. **Given** l'agent revient apres < 24h **When** TransactionsPage se charge **Then** pas de ReturnBanner

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : EmptyState.tsx (35 lignes) et ReturnBanner.tsx (47 lignes) sont **completement implementes**. Manque tests dedies.

## Tasks / Subtasks

- [x] **Task 1: Creer tests EmptyState + ReturnBanner**
  - [x] EmptyState : renders title, description, CTA button
  - [x] EmptyState : CTA calls onCreateClick
  - [x] EmptyState : data-testid, a11y
  - [x] ReturnBanner : visible after 24h absence
  - [x] ReturnBanner : hidden after < 24h
  - [x] ReturnBanner : hidden when no lastSeenAt
  - [x] ReturnBanner : dismiss button hides banner
  - [x] ReturnBanner : a11y

- [x] **Task 2: Scan hardcoded strings** — all i18n'd
