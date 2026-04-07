# PRD-006: Design System Linter

## Summary
A real-time linter that checks project screens against the declared design tokens and conventions. Flags violations like hardcoded hex colors, non-token spacing, inconsistent typography, and off-brand component usage — surfaced as warnings in the docs panel.

## Problem
- Projects declare tokens in CSS custom properties and `DESIGN_TOKENS.md`, but nothing enforces usage.
- It's easy to write `text-[#333]` instead of using the project's `--text-primary` token.
- Inconsistencies accumulate silently, making the prototype misleading as a design spec.

## Goals
1. Scan project source files for design token violations on save.
2. Categorize violations: color, typography, spacing, component convention.
3. Show violations in a "Lint" tab in the docs panel with file:line links.
4. Auto-fix suggestions where possible (e.g., "Replace `#C96A3A` with `var(--accent-primary)`").

## Non-Goals
- Enforcing at build time (no blocking errors, warnings only).
- Linting non-project files (shared components are exempt).
- Custom rule authoring (v1 ships with built-in rules only).

## Proposed Solution

### Lint Rules (v1)

| Rule | Checks |
|------|--------|
| `no-hardcoded-color` | Flags `#hex`, `rgb()`, `hsl()` in project files not matching any declared token |
| `no-arbitrary-spacing` | Flags Tailwind arbitrary values like `p-[13px]` that don't match token scale |
| `typography-consistency` | Flags font-family/size/weight outside declared type scale |
| `no-fixed-position` | Flags `position: fixed` in project components (should be `absolute`) |
| `token-usage-ratio` | Reports % of token usage vs. hardcoded values per file |

### Architecture
```
File Watcher (chokidar on src/projects/<id>/)
        ↓
    Lint Engine (AST parse CSS/TSX → match against token map)
        ↓
    Vite SSE endpoint → push violations to browser
        ↓
    LintPanel.tsx in docs panel
```

### Token Map Extraction
- Parse the project's `.css` file for `--custom-property` declarations.
- Parse `DESIGN_TOKENS.md` for the declared scale.
- Build a lookup: `{ '#C96A3A': '--accent-primary', '16px': '--space-4', ... }`.

### UI
- "Lint" tab in the docs panel (next to "Docs", "Personas", "AI Review").
- Violation cards: severity icon, rule name, file:line, current value → suggested token.
- Summary badge: "3 warnings" on the tab.
- Click-to-copy the suggested fix.

## Success Criteria
- Flags at least 90% of hardcoded colors in project files.
- No false positives on Tailwind's built-in utility classes (e.g., `bg-white` is fine).
- Violations update within 2 seconds of file save.

## Risks
- Parsing TSX for arbitrary Tailwind values is complex — use regex first, upgrade to AST later.
- Token maps may be incomplete if not all tokens are declared — require a minimum token set per project.

## Effort Estimate
**M (1–2 weeks)** — token map extraction, 5 lint rules, file watcher, SSE push, lint panel UI.
