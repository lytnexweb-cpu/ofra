# Story 2C.1: Toggle Condition Interactive

Status: done

## Story

As a **real estate agent**,
I want **to toggle a condition's status between pending and completed by tapping a checkbox**,
So that **I can track progress in real-time without navigating away (FR32)**.

## Acceptance Criteria

1. **Given** interactive=true **When** ConditionCard se charge **Then** affiche un bouton toggle avec data-testid="toggle-condition-{id}"
2. **Given** condition pending **When** l'agent clique toggle **Then** onToggle est appele avec la condition
3. **Given** condition completed **When** affiche **Then** cercle vert avec check icon
4. **Given** isToggling=true **When** affiche **Then** bouton disabled + opacity reduite
5. **Given** condition pending **When** affiche **Then** aria-label="Pending" (i18n)
6. **Given** condition completed **When** affiche **Then** aria-label="Completed" (i18n)

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : ConditionCard interactive mode est **completement implemente**. 11 tests read-only existent. Manque tests interactifs dedies.

## Tasks / Subtasks

- [x] **Task 1: Ajouter tests ConditionCard interactif**
  - [x] Toggle button renders when interactive=true — AC1
  - [x] Click calls onToggle with condition — AC2
  - [x] Completed state shows check circle — AC3
  - [x] Disabled when isToggling — AC4
  - [x] Correct aria-label for pending — AC5
  - [x] Correct aria-label for completed — AC6
  - [x] WCAG a11y in interactive mode — DoD
