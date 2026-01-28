# Story 2D.2: DocumentsTab

Status: done

## Story

As a **real estate agent**,
I want **to see documents linked to conditions grouped by condition title**,
So that **I can quickly access all relevant files (FR35)**.

## Acceptance Criteria

1. **Given** aucun document **When** DocumentsTab se charge **Then** empty state data-testid="documents-empty"
2. **Given** conditions avec documentUrl **When** affiche **Then** groupe par conditionTitle avec liens externes
3. **Given** document link **When** affiche **Then** target="_blank" + rel="noopener noreferrer"
4. **Given** DocumentsTab **When** rendu **Then** data-testid="documents-tab", "document-link"

## Tasks / Subtasks

- [ ] **Task 1: Creer tests DocumentsTab** — 5 tests
