# Adding a New Project to the Design Lab

This is a detailed, step-by-step guide for adding a new project to the Design Lab. Read this end-to-end before starting — each step has dependencies on the previous ones.

> **Quick start:** Use `./scripts/create-project.sh` to scaffold the boilerplate, then follow this guide for the details.

---

## Overview

A project in the Design Lab consists of:

1. **A React app** in `src/projects/<name>/` — fully self-contained, with its own routing, pages, CSS tokens, and mock data
2. **A `ProjectConfig`** in `src/projects/registry.ts` — declares the project's brand, scenarios, personas, and React component
3. **Screen documentation** in `src/data/screenDocs.ts` — one entry per screen
4. **Design documents** in the project folder — `DESIGN_BRIEF.md`, `APP_STRUCTURE.md`, `DESIGN_TOKENS.md`, `DECISIONS.md`

The lab shell (`App.tsx`) renders one project at a time, selected via the project switcher in the sidebar. The sidebar adapts to the active project's brand (logo, accent color, scenario list, persona library).

The project switcher is a searchable dropdown at the top of the sidebar. It reads all projects from `PROJECT_CONFIGS` dynamically — adding a new config automatically adds it to the dropdown without any manual wiring.

**Reference example:** Study `src/projects/tugas/` — it's a fully fleshed to-do list app that demonstrates every pattern described below.

---

## Step-by-Step

### Step 1: Create the project folder structure

Create the following directory tree under `src/projects/<name>/`:

```
<name>/
├── index.tsx              # ProjectApp component
├── <name>.css            # Design tokens scoped under .<name>
├── pages/
│   └── *.tsx            # All screen/page components
├── data/
│   └── *.ts             # Mock data (optional)
└── personas/
    ├── _index.json      # Persona index
    └── <persona-id>.json # Full persona files
```

---

### Step 2: Create the project entry point (`index.tsx`)

Create `src/projects/<name>/index.tsx`. The component must:
- Accept `screen?: string` (optional external control from the lab stepper)
- Accept `onScreenChange?: (screen: string) => void` (fires when screen changes internally)
- Use state-based routing with `useState`

**Pattern:**
```tsx
import { useState, useEffect } from 'react'
import './<name>.css'

interface <Name>AppProps {
  screen?: string
  onScreenChange?: (screen: string) => void
}

export function <Name>App({ screen: externalScreen, onScreenChange }: <Name>AppProps) {
  const [screen, setScreen] = useState(externalScreen ?? '<name>-home')

  useEffect(() => {
    if (!externalScreen || externalScreen === screen) return
    setScreen(externalScreen)
  }, [externalScreen]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (s: string) => {
    setScreen(s)
    onScreenChange?.(s)
  }

  return (
    <div className="<name> w-full h-full">
      {screen === '<name>-home' && <HomePage onNavigate={go} />}
      {screen === '<name>-detail' && <DetailPage onBack={() => go('<name>-home')} />}
    </div>
  )
}
```

**Key routing rules:**
- Pages receive navigation callbacks as props (`onNavigate`, `onNext`, `onBack`)
- The first screen in the flow should NOT have an `onBack`
- Screens accessed via bottom nav should NOT have back buttons

---

### Step 3: Define CSS design tokens (`<name>.css`)

Create `src/projects/<name>/<name>.css`. All tokens must be scoped under `.<project-name>`:

```css
.<name> {
  --<prefix>-bg: #HEXCODE;           /* primary canvas */
  --<prefix>-surface: #HEXCODE;       /* card surfaces */
  --<prefix>-primary: #HEXCODE;        /* primary accent / CTA */
  --<prefix>-primary-hover: #HEXCODE; /* hover state */
  --<prefix>-muted: #HEXCODE;         /* secondary text */
  --<prefix>-text: #HEXCODE;          /* primary text */
  --<prefix>-border: #HEXCODE;         /* borders */

  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--<prefix>-bg);
  color: var(--<prefix>-text);
}

.<name> .<prefix>-card {
  background: var(--<prefix>-surface);
  border-radius: 12px;
  border: 1px solid var(--<prefix>-border);
}

.<name> .<prefix>-btn-primary {
  background-color: var(--<prefix>-primary);
  color: #HEXCODE;
  border-radius: 10px;
  height: 48px;
  font-weight: 600;
  transition: background-color 150ms;
}

.<name> .<prefix>-btn-primary:hover {
  background-color: var(--<prefix>-primary-hover);
}

.<name> .<prefix>-input {
  background: var(--<prefix>-surface);
  border: 1px solid var(--<prefix>-border);
  border-radius: 10px;
  padding: 12px 16px;
  color: var(--<prefix>-text);
  outline: none;
  transition: border-color 150ms;
}

.<name> .<prefix>-input:focus {
  border-color: var(--<prefix>-primary);
}
```

**Important:**
- The class name on the root `<div>` must match the CSS selector (e.g., `.tugas`)
- Token names must not conflict with Tailwind's built-in values or shadcn CSS variables
- Choose a 2-3 character prefix (e.g., `tg` for Tugas, `mo` for "My Other App")

---

### Step 4: Create all page components

Create each screen in `src/projects/<name>/pages/<ScreenName>Page.tsx`:

```tsx
interface HomePageProps {
  onNavigate: (screen: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="<name> flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="font-bold text-2xl" style={{ color: 'var(--<prefix>-text)' }}>
          Page Title
        </h1>
      </div>

      {/* Content */}
      <div className="px-5 flex-1">
        {/* ... */}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-8">
        <button onClick={() => onNavigate('<name>-next')} className="<prefix>-btn-primary w-full">
          Continue
        </button>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 flex border-t" style={{ background: 'var(--<prefix>-surface)' }}>
        {/* nav items */}
      </div>
    </div>
  )
}
```

**Layout rules:**
- Always use `flex flex-col min-h-screen` on the root, `flex-1` on scrollable content, `sticky bottom-0` on footer nav
- **Never use `position: fixed`** — it escapes the mobile viewport mockup
- For bottom sheets/modals, use `position: absolute` within the project container (set `position: relative; overflow: hidden` on container)

---

### Step 5: Wire the project into the registry

Open `src/projects/registry.ts`. Import your component and add a config:

```tsx
import { MyApp } from './my-app'
import myAppPersonaIndex from './my-app/personas/_index.json'

export const MY_APP_CONFIG: ProjectConfig = {
  id: 'my-app',
  component: MyApp,
  brand: {
    id: 'my-app',
    name: 'My App',
    tagline: 'One-line description',
    logoChar: 'M',
    accentColor: '#HEXCODE',
    accentLight: '#HEXCODE',
    accentMuted: '#HEXCODE',
    bgSubtle: '#HEXCODE',
    bgSubtleAlt: '#HEXCODE',
    textPrimary: '#HEXCODE',
    textSecondary: '#HEXCODE',
    textMuted: '#HEXCODE',
  },
  scenarios: [
    {
      id: 'my-app-happy-path',
      label: 'Happy Path',
      description: 'Step → Step → Step',
      steps: [
        { screen: 'my-app-home', label: 'Home' },
        { screen: 'my-app-detail', label: 'Detail' },
      ],
    },
  ],
  personaIndex: myAppPersonaIndex as ProjectConfig['personaIndex'],
  personaFiles: {},
}
```

Then add to `PROJECT_CONFIGS`:
```tsx
export const PROJECT_CONFIGS: Record<string, ProjectConfig> = {
  tugas: TUGAS_CONFIG,
  'my-app': MY_APP_CONFIG,  // ← add this
}
```

That's it — the project switcher picks it up automatically. **No changes to `App.tsx` needed.**

---

### Step 6: Add SCREEN_DOCS entries

Open `src/data/screenDocs.ts`. Add a block for each new screen:

```tsx
'my-app-home': {
  step: 1,
  name: 'Home',
  goal: 'What this screen aims to accomplish',
  description: 'What it does and why it exists',
  designNotes: [
    'Note about a specific design choice',
  ],
  components: ['HomePage', 'NavBar'],
  tokens: [
    { name: '--mo-primary', value: '#HEXCODE' },
  ],
  decisions: [],
  personaFeedbacks: [],
},
```

Each screen in a scenario must have a `SCREEN_DOCS` entry. Without it, the docs panel shows "No documentation for this screen yet."

---

### Step 7: Create design documents

Create the following files inside `src/projects/<name>/`:

#### `DESIGN_BRIEF.md`
- What the project is (1-2 sentence description)
- Who it's for (target users)
- Business goals
- Core problem it solves

#### `APP_STRUCTURE.md`
- Directory layout
- List of all screens with their goals
- Routing graph (how screens connect)
- Scenario descriptions

#### `DESIGN_TOKENS.md`
- Color palette with hex values and usage
- Typography (font family, sizes, weights)
- Spacing scale
- Component classes

#### `DECISIONS.md`
- Design decisions with date, rationale, status
- Links to persona feedback that prompted changes

---

## Quick Checklist

Before calling a new project complete, verify:

- [ ] All screens wired in `index.tsx` routing
- [ ] Screen IDs prefixed with project name (e.g., `my-app-home`)
- [ ] `ProjectConfig` added in `registry.ts` with `component` field
- [ ] `SCREEN_DOCS` entry for each screen in `src/data/screenDocs.ts`
- [ ] All 4 design documents created
- [ ] Build passes (`npm run build`)
- [ ] Sidebar shows correct project brand when switched
- [ ] Scenario stepper navigates all screens correctly
