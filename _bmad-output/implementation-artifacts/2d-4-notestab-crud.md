# Story 2D.4: NotesSection CRUD

Status: done

## Story

As a **real estate agent**,
I want **to create, view, and delete notes on a transaction**,
So that **I can keep track of important communications and decisions (FR37)**.

## Acceptance Criteria

1. **Given** aucune note **When** NotesSection se charge **Then** section vide avec data-testid="notes-section"
2. **Given** notes existantes **When** affiche **Then** liste avec data-testid="note-{id}" et contenu visible
3. **Given** note **When** affiche **Then** nom auteur visible
4. **Given** NotesSection **When** rendu **Then** champ input data-testid="note-input" et bouton data-testid="note-submit"
5. **Given** input vide **When** affiche **Then** bouton submit disabled
6. **Given** note propre (authorUserId = currentUser) **When** affiche **Then** bouton delete data-testid="delete-note-{id}"
7. **Given** note autre utilisateur **When** affiche **Then** pas de bouton delete
8. **Given** NotesSection **When** rendu **Then** aucune violation WCAG 2.1 AA

## Tasks / Subtasks

- [x] **Task 1: Creer tests NotesSection** — 8 tests (empty, list, author, input+submit, disabled, own delete, no delete others, WCAG a11y)
