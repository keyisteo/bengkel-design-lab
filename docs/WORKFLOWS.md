# Design Lab Workflows

This document covers the day-to-day workflows an agent (or human) follows when working in the Design Lab. It covers branching strategy, iterating on screens with personas, decision logging, and the conventions that keep the lab consistent.

---

## Branching Strategy

### One branch per piece of work

```bash
git checkout -b feature/my-new-scenario
```

Never work directly on the default branch. Branches make it easy to:
- Switch between scenarios without losing context
- Revert if an approach doesn't work
- Keep unrelated changes isolated

### When to branch
- When creating a new scenario
- When iterating on an existing screen based on persona feedback
- When adding a new project to the lab

### When not to branch
- Fixing typos in documentation
- Minor CSS tweaks that don't change behavior
- Updating SCREEN_DOCS with existing decisions

---

## Design Iteration Workflow

This is the full loop from receiving persona feedback to shipping a change.

### 1. Read the persona's feedback

Before writing any code, read the relevant feedback from:
- The persona's JSON file (`src/projects/<name>/personas/<id>.json`) — `feedbackHistory[]` array
- The `SCREEN_DOCS` entry for that screen — `personaFeedbacks[]` section

Understand three things:
1. **What they liked** — don't remove things that work
2. **What caused friction** — this is what you're fixing
3. **Their #1 change** — the single most impactful improvement they suggested

### 2. Implement the change

Make the change to the relevant page component. Follow the code conventions:
- Use CSS tokens from `<project>.css`, not raw hex values
- Use `position: absolute` for bottom sheets, never `position: fixed`
- Keep sticky footers using `flex flex-col min-h-screen` + `sticky bottom-0`
- Preserve all existing functionality while addressing the feedback

### 3. Log the decision

Every design change — even small ones — must be logged in two places:

**A. `src/projects/<name>/DECISIONS.md` (human-readable)**

```markdown
### My new decision
- **Date:** 2026-04-04
- **Decision:** Description of what was decided
- **Rationale:** Why this approach was chosen over alternatives
- **Feedback prompted:** budi-tugas-home-8
- **Status:** Active
```

**B. `src/data/screenDocs.ts` (runtime — drives the docs panel)**

Add to the screen's `decisions[]` array:

```ts
decisions: [
  {
    id: 'home-urgency-labels',
    date: '2026-04-04',
    decision: 'Due date urgency labels on task cards',
    rationale: 'Raw dates require mental math. Urgency labels provide instant triage.',
    status: 'active',
    feedbackIds: ['budi-tugas-home-8'],
  },
],
```

### 4. Update the persona's JSON file

Append to the `feedbackHistory[]` array in the persona's JSON file:

```json
{
  "screen": "tugas-home",
  "date": "2026-04-04",
  "score": 8,
  "scoreReason": "Clean and focused. Can see what matters immediately.",
  "firstImpression": "I can see at a glance what needs attention today.",
  "likes": ["Priority badges", "Filter tabs"],
  "missing": ["Drag-and-drop reorder"],
  "wouldTheyProceed": "Yes — this is what I needed.",
  "topChange": "None. This is what I wanted."
}
```

### 5. Update SCREEN_DOCS personaFeedbacks

Add a `personaFeedbacks[]` entry in `src/data/screenDocs.ts` for that screen:

```ts
personaFeedbacks: [
  {
    personaId: 'budi-santoso',
    personaName: 'Budi Santoso',
    personaRole: '24 · Junior Developer · Bandung',
    date: '2026-04-04',
    score: 8,
    scoreReason: "Clean and focused.",
    likes: ["Priority badges"],
    missing: [],
    wouldTheyProceed: "Yes.",
    topChange: "None.",
  },
],
```

> **Critical:** Both the JSON file AND `SCREEN_DOCS.personaFeedbacks[]` must be updated together.

---

## Adding a New Screen

1. Create the page component in `src/projects/<name>/pages/<Name>Page.tsx`
2. Wire the screen into the project's `index.tsx` routing
3. Add CSS tokens in `src/projects/<name>/<name>.css` if needed
4. Add `SCREEN_DOCS` entry in `src/data/screenDocs.ts`
5. Add the screen to the scenario's `steps[]` in `src/projects/registry.ts`
6. Write decisions in `DECISIONS.md` and `SCREEN_DOCS.decisions[]`

---

## Adding a New Scenario

1. Create all screen components for the new flow
2. Add a new scenario block to `src/projects/registry.ts` under the project's `scenarios[]`:
   ```ts
   {
     id: 'my-app-edge-case',
     label: 'Edge Case',
     description: 'Step → Step → Step',
     steps: [
       { screen: 'my-app-empty', label: 'Empty State' },
       { screen: 'my-app-error', label: 'Error' },
     ],
   }
   ```
3. Add `SCREEN_DOCS` entries for each new screen
4. Wire the pages into the project's `index.tsx` routing

---

## Decision Log Format

### Decision interface

```ts
{
  id: string                    // unique, e.g. 'home-urgency-labels'
  date: string                 // 'YYYY-MM-DD'
  decision: string            // what was decided
  rationale: string            // why this approach
  status: 'active' | 'scrapped'
  scrappedBy?: string          // id of replacement decision (only if scrapped)
  scrappedReason?: string      // why it was replaced (only if scrapped)
  feedbackIds?: string[]      // links to persona feedback that prompted this
}
```

### feedbackIds format

`'budi-tugas-home-8'` decodes as:
- Persona: Budi Santoso (`budi-santoso`)
- Screen: tugas-home
- Score: 8/10

### Scrapped decisions

When a decision is replaced:
1. Set `status: 'scrapped'` and fill in `scrappedBy` and `scrappedReason`
2. Keep the entry — it documents the design evolution
3. Update `DECISIONS.md` with the same information

---

## Code Conventions

### CSS token scoping

Every project scopes tokens under its root class. Use these tokens — never raw hex values.

```tsx
// Correct
<div style={{ color: 'var(--tg-primary)' }}>

// Incorrect
<div style={{ color: '#4F46E5' }}>
```

### Routing is state-based

No React Router. Screen changes are state updates:

```tsx
const go = (s: string) => {
  setScreen(s)
  onScreenChange?.(s)
}
```

### Sticky footers

```tsx
<div className="flex flex-col min-h-screen">
  <div className="flex-1">{/* scrollable content */}</div>
  <div className="sticky bottom-0">{/* footer */}</div>
</div>
```

**Never use `position: fixed`** — it escapes the mobile viewport mockup.

### Bottom sheets and modals

Use `position: absolute` inside the project container:

```tsx
<div className="<name> w-full" style={{ position: 'relative', overflow: 'hidden' }}>
  {/* page content */}
  <BottomSheet />
</div>
```

### Screen IDs

Prefix all screen IDs with your project name to prevent collisions:
- Tugas: `tugas-home`, `tugas-add`, `tugas-detail`, `tugas-stats`
- My App: `myapp-list`, `myapp-detail`, `myapp-settings`

### Dark theme detection

Use `isDarkBrand(brand.bgSubtle)` from `src/lib/utils.ts`. Never hardcode project IDs for theme detection.
