# PRD-009: Export to Production Starter

## Summary
Generate a production-ready starter project from a Design Lab prototype. Extract the project's components, routes, tokens, and mock data into a standalone Vite + React app (or Next.js / Remix) with real routing, clean file structure, and all lab-specific scaffolding removed.

## Problem
- The lab is great for prototyping, but the prototype is trapped inside the lab shell.
- Moving from prototype to real product requires manual extraction: copy files, replace lab routing with real routing, remove mock data wiring, set up a build pipeline.
- This friction means prototypes often get thrown away and rebuilt from scratch.

## Goals
1. One-command export: `npm run export <project-id> [--framework vite|next|remix]`.
2. Output is a standalone, buildable project with:
   - Real file-based or library routing (replacing the lab's state-based routing).
   - Design tokens preserved as CSS custom properties.
   - Components extracted with clean imports.
   - Mock data preserved as placeholder, clearly marked for replacement.
3. README generated with setup instructions and a checklist of what to wire up (API, auth, etc.).

## Non-Goals
- Backend generation (export is frontend-only).
- Automatic API integration.
- Deploying the exported project.

## Proposed Solution

### Export Pipeline
```
src/projects/<id>/
        ↓
    Analyzer: scan files, identify lab dependencies
        ↓
    Transformer:
      - Replace onScreenChange() with React Router <Link>
      - Convert screen strings to route paths
      - Strip ProjectAppProps, replace with standard props
      - Extract CSS tokens into standalone file
      - Copy components, preserving imports
        ↓
    Generator: scaffold target framework structure
        ↓
    output/<id>/  (standalone project)
```

### Framework Templates
- **Vite + React Router** (default): `src/pages/`, `src/components/`, `src/styles/tokens.css`.
- **Next.js App Router**: `app/`, `components/`, `styles/`.
- **Remix**: `app/routes/`, `app/components/`.

### Route Mapping
```ts
// Lab routing (state-based):
const go = (s: string) => { setScreen(s); onScreenChange?.(s) }
<button onClick={() => go('ketemoo-detail')}>

// Exported (React Router):
import { Link } from 'react-router-dom'
<Link to="/activity/:id">
```

### Generated Files
```
output/ketemoo/
├── package.json          (dependencies from lab minus lab-specific)
├── vite.config.ts        (clean, no lab plugins)
├── src/
│   ├── main.tsx
│   ├── App.tsx            (router setup)
│   ├── styles/
│   │   └── tokens.css     (extracted design tokens)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Detail.tsx
│   │   └── Booking.tsx
│   ├── components/        (shared project components)
│   └── data/
│       └── mock.ts        (clearly marked placeholder data)
└── README.md              (setup + migration checklist)
```

## Success Criteria
- Exported project runs `npm install && npm run dev` successfully on first try.
- All screens render identically to the lab mockup.
- Exported code has zero references to lab internals (`ProjectAppProps`, `onScreenChange`, etc.).

## Risks
- Complex component dependencies may not extract cleanly — mitigate with a dry-run mode that reports issues.
- Tailwind config differences between lab and standalone project — include Tailwind config in export.
- One-size-fits-all transformation may not handle edge cases — provide manual override hooks.

## Effort Estimate
**XL (4+ weeks)** — AST transformation, multi-framework templates, route mapping, integration testing.
