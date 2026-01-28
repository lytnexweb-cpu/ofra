# Story 2C.3: Blocking System

Status: done

## Story

As a **real estate agent**,
I want **a pedagogical modal explaining why I can't advance when blocking conditions exist, and a persistent banner after dismissal**,
So that **I understand the workflow rules and can track blockers easily (FR7, FR8, FR9)**.

## Acceptance Criteria

1. **Given** premier attempt Advance avec bloquantes **When** API retourne E_BLOCKING_CONDITIONS **Then** modal pedagogique s'ouvre (FR7)
2. **Given** modal pedagogique **When** "Don't show again" coche + ferme **Then** localStorage enregistre preference (FR8)
3. **Given** localStorage "don't show again" = true **When** Advance avec bloquantes **Then** banner inline s'affiche au lieu du modal (FR9)
4. **Given** blocking banner **When** l'agent clique dismiss **Then** banner disparait
5. **Given** ActionZone avec bloquantes **When** affiche **Then** nearest deadline en jours visible

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : Le blocking system dans ActionZone.tsx est **completement implemente** (modal + banner + localStorage). Les 7 tests existants couvrent les cas de base mais pas le flow modal/banner.

## Tasks / Subtasks

- [x] **Task 1: Ajouter tests blocking flow a ActionZone**
  - [x] Advance with blocking → pedagogical modal appears — AC1
  - [x] "Don't show again" + close → localStorage set — AC2
  - [x] With localStorage set → banner instead of modal — AC3
  - [x] Banner dismiss button — AC4
  - [x] Nearest deadline display — AC5
