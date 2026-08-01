---
name: comprehensive-study-desk-redesign
description: System-first visual redesign for the GRE vocabulary app
metadata:
  type: frontend-design
---

# Comprehensive Study Desk Redesign

## Goal

Elevate the GRE vocabulary app from a minimally styled utility into a cohesive, premium editorial study environment. The redesign retains routes, stores, learning behavior, grading, and persistence while replacing fragmented inline presentation with a responsive design system.

## Design System

`web/src/index.css` becomes a structured stylesheet with named sections for tokens, reset/base typography, shared primitives, shell/navigation, page layouts, study modes, Progress, responsive behavior, and reduced motion. It defines a warm paper-and-ink palette, a characterful serif display stack paired with a humanist sans stack, spacing and radius scales, accessible focus treatment, meaningful state colors, and layered paper/card surfaces.

Semantic classes replace presentation-only inline styles. React components retain only data-driven style values that cannot be represented by classes, such as a progress-bar percentage or status color CSS custom property.

## App Shell and Navigation

The desktop shell uses an ink-colored sidebar with an editorial app mark, measured navigation rhythm, selected-mode marker, and clear study-set summary. Quiz navigation remains compact but exposes tooltips and accessible names. On narrow screens, navigation becomes a horizontally scrollable top rail and content spacing is reduced without hiding core controls.

## Word Bank

Word Bank is the flagship “Vocabulary Ledger.” A masthead sets study context, filters form a dedicated workbench, and selected-word information sits in a strong summary tray with one clear Start Quiz action. Rows use a deliberate metadata hierarchy: vocabulary word first, part of speech and definition second, learning status third. Selection, drag, hover, focus, and disabled states are visually distinct and keyboard accessible.

## Study Workspaces

Flashcards, Match, and Fill in Blank share a centered desk workspace with a small progress/meta strip, layered paper panels, consistent action hierarchy, and clear feedback treatment.

- Flashcards prioritize large display typography, an elegant reveal affordance, and rating buttons with readable quality hierarchy.
- Match uses clearly paired columns, tactile tiles, and unambiguous selected, matched, and incorrect states.
- Fill in Blank makes the prompt visually dominant, uses balanced answer-option cards, and presents grading explanations as an annotated result panel.

Animation is limited to short entrance, selection, and feedback transitions. `prefers-reduced-motion` removes all nonessential animation.

## Progress Dashboard

Progress becomes a concise learning dashboard: a streak focal point, status summary cards, and a review ledger with proportional bars. Counts, labels, and color indicators remain understandable independently so color is never the only state signal.

## Accessibility and Verification

Preserve native controls, existing accessible names, semantic headings, visible focus, 44px touch targets, and all current functional behavior. Add focused structure/state tests where useful; run the complete test suite, lint, and production build. Review desktop and 375px layouts, keyboard focus, and reduced-motion behavior.

## Scope Boundary

This change does not modify word data, SM-2 calculations, routing behavior, question generation, grading rules, or deployment configuration. It is a visual architecture and presentation overhaul.
