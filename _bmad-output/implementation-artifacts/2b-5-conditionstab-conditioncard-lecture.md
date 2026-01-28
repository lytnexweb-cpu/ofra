# Story 2B.5: ConditionsTab + ConditionCard (lecture)

Status: done

## Story

As a **real estate agent**,
I want **to see condition cards with title, type badge, blocking badge, and countdown in read-only mode**,
So that **I can understand the status of each condition at a glance (FR31)**.

## Acceptance Criteria

1. **Given** une condition pending **When** ConditionCard se charge **Then** affiche titre, type badge, countdown
2. **Given** une condition blocking + pending **When** affiche **Then** badge "Blocking" avec icone ShieldAlert
3. **Given** une condition completed **When** affiche **Then** titre barre, texte "Completed", pas de countdown
4. **Given** interactive=false **When** affiche **Then** pas de bouton toggle
5. **Given** ConditionCard **When** rendu **Then** data-testid="condition-card-{id}" + data-condition-id

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : ConditionCard.tsx (121 lignes) est **completement implemente**. ConditionsTab.test.tsx a 7 tests existants. Manque tests dedies ConditionCard en mode lecture.

## Tasks / Subtasks

- [x] **Task 1: Creer tests ConditionCard (lecture)**
  - [x] Renders title — AC1
  - [x] Renders description — AC1
  - [x] Shows blocking badge when blocking + pending — AC2
  - [x] Hides blocking badge when completed — AC2
  - [x] Shows type badge — AC1
  - [x] Shows countdown when pending with dueDate — AC1
  - [x] Shows completed text when done — AC3
  - [x] Line-through title when done — AC3
  - [x] No toggle button in non-interactive mode — AC4
  - [x] data-testid and data-condition-id — AC5
  - [x] WCAG a11y — DoD
