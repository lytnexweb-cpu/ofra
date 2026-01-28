# Story 2D.3: TimelineTab + Activity Feed

Status: done

## Story

As a **real estate agent**,
I want **to see a chronological activity feed on my transaction showing who did what and when**,
So that **I have full audit trail and history of all actions (FR36)**.

## Acceptance Criteria

1. **Given** aucune activite **When** TimelineTab se charge **Then** empty state data-testid="timeline-empty"
2. **Given** activites **When** affiche **Then** liste avec types (step_advanced, condition_completed)
3. **Given** activite **When** affiche **Then** nom utilisateur visible
4. **Given** total > perPage **When** affiche **Then** bouton "Load More" data-testid="load-more-activities"
5. **Given** total <= perPage **When** affiche **Then** pas de bouton "Load More"
6. **Given** TimelineTab **When** rendu **Then** aucune violation WCAG 2.1 AA

## Tasks / Subtasks

- [x] **Task 1: Creer tests TimelineTab** — 6 tests (empty, activity types, user name, load more shown, load more hidden, WCAG a11y)
