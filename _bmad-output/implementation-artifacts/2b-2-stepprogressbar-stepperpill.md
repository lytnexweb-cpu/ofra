# Story 2B.2: StepProgressBar + StepperPill

Status: done

## Story

As a **real estate agent viewing a transaction**,
I want **a visual stepper showing progress through workflow steps on desktop and a compact pill on mobile**,
So that **I can quickly understand where the transaction stands (FR28)**.

## Acceptance Criteria

1. **Given** des steps avec statuts varies **When** StepProgressBar se charge **Then** affiche cercles: completed=check, active=pulse, skipped=skip-forward, pending=numero
2. **Given** StepProgressBar **When** rendu **Then** role="list" avec aria-label, chaque step est role="listitem"
3. **Given** StepProgressBar **When** steps avec noms **Then** affiche les labels traduits via workflow.steps.{slug}
4. **Given** StepperPill sur mobile **When** rendu **Then** affiche "Step X/Y — nom" + barre de progression
5. **Given** StepperPill **When** l'agent clique **Then** appelle onClick callback
6. **Given** StepperPill **When** rendu **Then** progressbar role="progressbar" avec aria-valuenow/min/max

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : StepProgressBar.tsx (90 lignes) + StepperPill.tsx (53 lignes) sont **completement implementes**. Manque tests dedies.

## Tasks / Subtasks

- [x] **Task 1: Creer tests StepProgressBar**
  - [x] Renders all steps as listitem — AC1, AC2
  - [x] Shows check icon for completed steps — AC1
  - [x] Shows step number for pending steps — AC1
  - [x] Shows connector lines between steps — AC1
  - [x] Labels use i18n slug translation — AC3
  - [x] data-testid + a11y role="list" — AC2
  - [x] WCAG a11y — DoD

- [x] **Task 2: Creer tests StepperPill**
  - [x] Renders step X/Y and step name — AC4
  - [x] Progress bar width reflects current step — AC4
  - [x] Click calls onClick — AC5
  - [x] progressbar role with aria-valuenow/min/max — AC6
  - [x] data-testid="stepper-pill" — AC6
  - [x] WCAG a11y — DoD
