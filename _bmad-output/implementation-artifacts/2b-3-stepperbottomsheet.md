# Story 2B.3: StepperBottomSheet

Status: done

## Story

As a **real estate agent on mobile**,
I want **a bottom sheet listing all workflow steps with their status**,
So that **I can see the full progression breakdown on a small screen (FR29)**.

## Acceptance Criteria

1. **Given** isOpen=true **When** StepperBottomSheet se charge **Then** affiche la liste des steps avec statuts
2. **Given** steps avec statuts varies **When** affiche **Then** chaque step montre: completed/active/skipped/pending texte
3. **Given** step active **When** affiche **Then** surlignee avec bg-primary/10
4. **Given** isOpen=false **When** StepperBottomSheet **Then** rien n'est affiche
5. **Given** StepperBottomSheet **When** rendu **Then** role="list" + data-testid="stepper-sheet-list"

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : StepperBottomSheet.tsx (103 lignes) est **completement implemente**. Manque tests dedies.

## Tasks / Subtasks

- [x] **Task 1: Creer tests StepperBottomSheet**
  - [x] Renders step list when open — AC1
  - [x] Shows status labels (completed/active/skipped/pending) — AC2
  - [x] Active step has highlighted style — AC3
  - [x] data-testid per step — AC5
  - [x] WCAG a11y — DoD
