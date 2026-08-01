# Comprehensive Study Desk Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the GRE app’s presentation as a cohesive, responsive editorial study desk without changing learning behavior.

**Architecture:** Centralize all visual decisions in structured `index.css` tokens, primitives, page regions, and responsive rules. Replace static inline styles with semantic class names in components; retain only data-driven CSS custom properties for progress/status values.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Vite.

---

## File Structure

- Modify: `web/src/index.css` — full visual system, primitive components, page/module styles, motion, mobile rules.
- Modify: `web/src/App.tsx`, `web/src/components/Sidebar.tsx`, `web/src/components/QuizResults.tsx` — shell/navigation/feedback semantics.
- Modify: `web/src/pages/WordBank.tsx`, `Flashcards.tsx`, `Match.tsx`, `FillInBlank.tsx`, `Progress.tsx` — semantic page layouts and state classes.
- Modify: matching `*.test.tsx` files — assert new landmarks and state classes while retaining behavior tests.

### Task 1: Design-system foundation and application shell

**Files:** `web/src/index.css`, `web/src/App.tsx`, `web/src/components/Sidebar.tsx`, `web/src/components/Sidebar.test.tsx`

- [ ] **Step 1: Write failing navigation structure tests**

```tsx
expect(screen.getByRole('navigation')).toHaveClass('app-sidebar', 'app-sidebar--expanded');
expect(screen.getByText('GRE Vocab')).toHaveClass('sidebar-brand');
```

- [ ] **Step 2: Verify red**

Run: `npm test -- --run src/components/Sidebar.test.tsx`

Expected: FAIL because the class hooks do not exist or are incomplete.

- [ ] **Step 3: Implement semantic shell and structured CSS**

Replace static layout styles with `app-shell`, `app-main`, `app-sidebar`, `sidebar-brand`, and `sidebar-nav-button` classes. Organize `index.css` under explicit sections: tokens, base, primitives, shell, pages, study modes, dashboard, responsive, motion. Use `--paper`, `--ink`, `--navy`, `--sage`, `--gold`, `--rust`, and accessible focus colors; define serif display typography and humanist sans UI typography.

- [ ] **Step 4: Verify green and commit**

Run: `npm test -- --run src/components/Sidebar.test.tsx && npm run build`

```bash
git add web/src/index.css web/src/App.tsx web/src/components/Sidebar.tsx web/src/components/Sidebar.test.tsx
git commit -m "feat: build editorial study desk system"
```

### Task 2: Rebuild Word Bank as the flagship vocabulary ledger

**Files:** `web/src/pages/WordBank.tsx`, `web/src/pages/WordBank.test.tsx`, `web/src/index.css`

- [ ] **Step 1: Write failing page-landmark test**

```tsx
expect(screen.getByRole('heading', { name: /vocabulary ledger/i })).toBeVisible();
expect(screen.getByTestId('selection-tray')).toHaveClass('selection-tray');
```

- [ ] **Step 2: Verify red**

Run: `npm test -- --run src/pages/WordBank.test.tsx`

Expected: FAIL because the selection tray test id is missing.

- [ ] **Step 3: Implement ledger layout**

Add semantic header, `filter-workbench`, `prefix-chip`, `selection-tray`, `word-ledger`, and `word-ledger-row` regions. Move every static Word Bank inline declaration into CSS. Preserve input names, filters, drag selection, checkbox behavior, and Start Quiz handler.

- [ ] **Step 4: Verify green and commit**

Run: `npm test -- --run src/pages/WordBank.test.tsx && npm run build`

```bash
git add web/src/index.css web/src/pages/WordBank.tsx web/src/pages/WordBank.test.tsx
git commit -m "feat: rebuild vocabulary ledger"
```

### Task 3: Apply shared premium study workspaces

**Files:** `web/src/pages/Flashcards.tsx`, `web/src/pages/Match.tsx`, `web/src/pages/FillInBlank.tsx`, `web/src/components/QuizResults.tsx`, related tests, `web/src/index.css`

- [ ] **Step 1: Write failing workspace tests**

```tsx
expect(screen.getByTestId('flashcard-workspace')).toHaveClass('study-workspace');
expect(screen.getByTestId('match-workspace')).toHaveClass('study-workspace');
expect(screen.getByTestId('fill-blank-workspace')).toHaveClass('study-workspace');
```

- [ ] **Step 2: Verify red**

Run: `npm test -- --run src/pages/Flashcards.test.tsx src/pages/Match.test.tsx src/pages/FillInBlank.test.tsx`

Expected: FAIL for each missing workspace hook.

- [ ] **Step 3: Implement study cards and interaction states**

Use `study-workspace`, `study-meta`, `study-card`, `flashcard-display`, `rating-button`, `match-tile`, `answer-option`, and `quiz-results` classes. Represent selected/correct/wrong/matched state with modifier classes; keep grading, timers, keyboard submission, and all accessible labels unchanged.

- [ ] **Step 4: Verify green and commit**

Run: `npm test -- --run src/pages/Flashcards.test.tsx src/pages/Match.test.tsx src/pages/FillInBlank.test.tsx && npm run build`

```bash
git add web/src/index.css web/src/pages/Flashcards.tsx web/src/pages/Match.tsx web/src/pages/FillInBlank.tsx web/src/components/QuizResults.tsx web/src/pages/Flashcards.test.tsx web/src/pages/Match.test.tsx web/src/pages/FillInBlank.test.tsx
git commit -m "feat: create cohesive study workspaces"
```

### Task 4: Build the Progress dashboard and verify responsive/accessibility behavior

**Files:** `web/src/pages/Progress.tsx`, `web/src/pages/Progress.test.tsx`, `web/src/index.css`

- [ ] **Step 1: Write failing dashboard test**

```tsx
expect(screen.getByRole('heading', { name: /study progress/i })).toBeVisible();
expect(screen.getByTestId('progress-ledger')).toHaveClass('progress-ledger');
```

- [ ] **Step 2: Verify red**

Run: `npm test -- --run src/pages/Progress.test.tsx`

Expected: FAIL when dashboard landmarks are absent.

- [ ] **Step 3: Implement dashboard and reduced-motion/mobile CSS**

Use `progress-overview`, `streak-card`, `progress-stat`, `progress-ledger`, and `progress-ledger-fill`; preserve count text nodes and calculations. Use a CSS custom property only for dynamic status color/width. Finish 720px layouts, 44px targets, focus states, and a `prefers-reduced-motion` override.

- [ ] **Step 4: Run final verification and commit**

Run: `npm test -- --run && npm run lint && npm run build`

```bash
git add web/src/index.css web/src/pages/Progress.tsx web/src/pages/Progress.test.tsx
git commit -m "feat: add study progress dashboard"
```

## Plan Self-Review

- Spec coverage: design system/shell (Task 1), flagship Word Bank (Task 2), all study modes and results (Task 3), Progress, mobile, motion, and accessibility (Task 4).
- No placeholders or deferred steps remain.
- Tests target existing user-visible landmarks and behavior remains isolated from styling changes.
