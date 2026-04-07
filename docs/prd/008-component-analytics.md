# PRD-008: Component Usage Analytics

## Summary
Track which shared components and design tokens are actually used across all projects. Surface a dashboard showing usage frequency, unused components, token adoption rate, and cross-project patterns — helping teams understand what's working in their design system.

## Problem
- shadcn/ui has 49 components installed, but there's no visibility into which ones projects actually use.
- Design tokens are declared but adoption is unknown — are projects actually using them or falling back to hardcoded values?
- When maintaining the shared component library, it's unclear which components to invest in vs. deprecate.

## Goals
1. Static analysis scan that counts component imports and token references per project.
2. Dashboard view showing: most/least used components, token adoption %, cross-project patterns.
3. "Component map" per screen: which components appear on each screen.
4. Trend tracking: compare usage across snapshots over time.

## Non-Goals
- Runtime performance analytics (bundle size, render time).
- Component-level interaction tracking (clicks, engagement).
- Enforcing usage (informational only).

## Proposed Solution

### Analysis Engine
```
AST Parser (src/projects/**/*)
        ↓
Import Analyzer → count component references
        ↓
Token Analyzer → count CSS variable usage vs hardcoded
        ↓
    Analytics DB (SQLite)
        ↓
    Dashboard UI
```

### Data Model
```ts
interface ComponentUsage {
  component: string        // e.g., "Button", "Card", "Badge"
  projectId: string
  screen: string
  importCount: number
  renderCount: number      // approximate, from JSX analysis
}

interface TokenUsage {
  token: string            // e.g., "--accent-primary"
  projectId: string
  fileCount: number
  referenceCount: number
  hardcodedAlternatives: number  // times the raw value appears instead
}
```

### Dashboard UI
- New top-level tab or route: `/analytics`.
- Cards: "Top 10 Components", "Unused Components", "Token Adoption Rate".
- Per-project breakdown with expandable details.
- Screen-level component map: click a screen → see its component tree.

### Scan Trigger
- Manual "Scan" button.
- Optional: file watcher that re-scans on save (debounced).

## Success Criteria
- Correctly identifies 95%+ of component imports (including aliased imports).
- Dashboard loads in under 2 seconds for 5 projects.
- Reveals at least 3 actionable insights in the first scan (e.g., "Badge is imported but never rendered").

## Risks
- AST parsing may miss dynamic imports or renamed components — start with static import analysis, iterate.
- JSX render count is approximate (conditional rendering makes exact counts hard).

## Effort Estimate
**M (1–2 weeks)** — AST parser, usage DB, dashboard UI, token analysis.
