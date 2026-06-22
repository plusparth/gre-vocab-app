---
name: editorial-study-desk-polish
description: Visual polish specification for the GRE vocabulary app
metadata:
  type: frontend-design
---

# Editorial Study Desk Visual Polish

## Goal

Turn the existing GRE vocabulary SPA into a calm, focused editorial study desk without changing routes, stores, quiz logic, word-selection behavior, or persistence. The interface should make dense vocabulary work easier to scan and more pleasant to revisit.

## Visual Direction

The product uses the visual language of a well-kept study notebook: a warm paper surface, deep ink typography, restrained colored annotations, and deliberate card-like grouping. It should feel composed rather than nostalgic or decorative.

- Background: warm parchment with a subtle paper-grain treatment.
- Type: a distinctive serif for page and word headings; a humanist sans-serif for controls, definitions, and metadata.
- Color roles: navy for ink and primary actions; sage for selections and correct states; rust for errors/struggling states; muted gold for focused details and due-review indicators.
- Motion: short opacity/position transitions for page elements and controls; all nonessential animation disabled under `prefers-reduced-motion`.

## Shared Application Shell

`App` will receive semantic shell classes instead of inline layout styles. The sidebar becomes a dark ink panel on desktop, with a clear app mark, selected-state indicator, and selected-word summary. In quiz modes it remains a narrow rail with tooltips and accessible labels. At narrow viewports, navigation becomes a compact horizontal header so content retains usable width.

A shared stylesheet provides design tokens, element defaults, focus-visible outlines, form styling, reusable buttons, panels, tags, and feedback colors. Existing inline style declarations will be replaced in the polished UI files so visual treatment stays consistent and maintainable.

## Word Bank

The Word Bank is the primary “vocabulary ledger” surface:

- A page header states the current task and selection context.
- Search, sort, and mastery controls form a clear filter row; prefix filters become compact annotation chips.
- The selection toolbar becomes a distinct summary strip, with the primary Start Quiz action visually dominant.
- Each word is an index-card-inspired row: word and part of speech lead, definition stays readable, and status appears as a compact colored tag.
- Selected rows use sage fill and a strong ink outline; hover, keyboard focus, and drag selection remain visibly distinct.

The current filtering, top-N selection, drag behavior, and testable labels remain unchanged.

## Study Modes and Results

Flashcards, Match, and Fill in Blank share a centered study workspace with a small mode label, a paper panel, and consistent action-button hierarchy. Vocabulary words use the display face, while question text and answers remain highly legible.

Correct and incorrect results use clear text, color, and borders together; color is never the only signal. Multiple-choice options expose selected, correct, and incorrect states clearly. Rating buttons and next actions use the shared component styles. No quiz scoring, answer-generation, or progression logic changes.

## Progress

Progress becomes a compact study dashboard:

- A headline card emphasizes streak and total studied context.
- Status counts use coordinated notebook-card styling.
- The distribution list is a readable progress ledger with labels, values, and proportional bars.

The existing SM-2-derived status calculations and streak logic are retained.

## Responsiveness and Accessibility

- Keep content widths constrained for comfortable reading and provide padded mobile layouts.
- Use native buttons, inputs, labels, and select controls; preserve current accessible names used by tests.
- Provide a high-contrast focus ring and adequate text/background contrast.
- Avoid hover-only interactions and honor reduced-motion preferences.

## Validation

Run the web test suite and production build after implementation. Manually inspect Word Bank, every quiz mode, Progress, keyboard focus, a narrow viewport, and a reduced-motion viewport.

## Scope Boundary

No changes to data generation, routes, stores, SM-2 calculations, quiz selection, answer grading, or deployment behavior are included. This pass is limited to presentation structure and styling needed for the editorial study desk experience.
