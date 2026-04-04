# Troubleshooting Guide

Common problems and their solutions. When you encounter a bug or unexpected behavior, start here.

---

## UI/Layout Issues

### Bottom sheets overflow into the sidebar

**Symptom:** A modal or bottom sheet appears over the sidebar instead of staying inside the mobile mockup viewport.

**Cause:** The shadcn `Sheet` component uses Radix portals that teleport to `document.body`, bypassing the project container's overflow constraints.

**Fix:** Replace shadcn `Sheet` with a custom bottom sheet that uses `position: absolute`. Ensure the project container has `position: relative; overflow: hidden`:

```tsx
<div className="my-app w-full" style={{ position: 'relative', overflow: 'hidden' }}>
  <BottomSheet />  {/* position: absolute, stays within container */}
</div>
```

### Fixed elements escape the mobile viewport

**Symptom:** A footer, nav bar, or other element appears outside the 375x812 mockup frame.

**Cause:** Used `position: fixed` which positions relative to the viewport, not the mockup container.

**Fix:** Use `sticky bottom-0` inside a flex column layout:

```tsx
<div className="flex flex-col min-h-screen">
  <div className="flex-1">{/* scrollable content */}</div>
  <div className="sticky bottom-0">{/* footer */}</div>
</div>
```

### Sidebar doesn't adapt to project brand

**Symptom:** The left sidebar shows wrong colors or brand after switching projects.

**Cause:** `App.tsx` isn't passing the correct `brand` prop, or the project config is misconfigured.

**Fix:** Verify that `LeftPanel` receives the correct `brand` from `PROJECT_CONFIGS[activeProject]`. Check that `handleProjectChange` resets the active scenario to the new project's first scenario.

---

## Type Errors

### "Property X does not exist on type ProjectBrand"

**Symptom:** TypeScript error when accessing a brand property.

**Cause:** The property exists in the interface but the config object is missing it.

**Fix:** Add the missing property to your project's `brand` object in `registry.ts`. All `ProjectBrand` properties are required.

### "Record<string, PersonaCommon> is not assignable to Record<string, LabPersona>"

**Symptom:** Type error when passing `personaFiles` to `PersonaPanel` or `LeftPanel`.

**Cause:** `PersonaCommon` (in `registry.ts`) and `LabPersona` (in `types.ts`) are structurally similar but TypeScript treats them as different types.

**Fix:** Use a type assertion when importing persona JSON:
```tsx
personaFiles={personaFiles as unknown as Record<string, LabPersona>}
```

---

## Routing Issues

### Screen change doesn't update the mockup

**Symptom:** Clicking a nav element or button doesn't navigate to the expected screen.

**Cause:** The `onScreenChange` callback isn't being called, or the parent `App.tsx` isn't updating its `screen` state.

**Fix:** Verify that the page component calls its navigation callback with the correct screen ID. Verify that `App.tsx`'s `setScreen` is being called when `onScreenChange` fires.

### Infinite navigation loop

**Symptom:** App gets stuck or cycles between two screens endlessly.

**Cause:** `onNext` is being called unconditionally in a `useEffect`, or the routing logic has a circular dependency.

**Fix:** Check that navigation callbacks are only triggered by user actions (button clicks), not by render effects.

---

## Missing Data

### "No documentation for this screen yet"

**Symptom:** The docs panel in the sidebar shows a "No documentation" message.

**Cause:** No `SCREEN_DOCS` entry exists for the current screen ID.

**Fix:** Add a `SCREEN_DOCS` entry in `src/data/screenDocs.ts` for the screen. Every screen in a scenario needs an entry.

### Screen doesn't appear in scenario stepper

**Symptom:** A screen exists in the project but the stepper dots don't include it.

**Cause:** The screen wasn't added to the `steps[]` array of the relevant scenario in `registry.ts`.

**Fix:** Add the screen to the scenario's `steps[]`:
```ts
{
  id: 'my-scenario',
  steps: [
    { screen: 'my-app-home', label: 'Home' },
    { screen: 'my-app-new', label: 'New Screen' },  // ← add here
  ],
}
```

### Project doesn't appear in project switcher

**Symptom:** Added a project but it doesn't show in the dropdown.

**Cause:** The project config wasn't added to `PROJECT_CONFIGS` in `registry.ts`.

**Fix:** Add your config to the exported record:
```tsx
export const PROJECT_CONFIGS: Record<string, ProjectConfig> = {
  tugas: TUGAS_CONFIG,
  'my-app': MY_APP_CONFIG,  // ← add this
}
```

---

## Persona Issues

### Persona feedback not showing in panel

**Symptom:** Added feedback to the JSON file but the persona panel doesn't show it.

**Cause:** The JSON is malformed or `latestScore` in `_index.json` wasn't updated.

**Fix:**
1. Verify the JSON file is valid (no trailing commas, correct field names)
2. Update `latestScore` in `_index.json` with the new score and screen
3. Also add the feedback to `SCREEN_DOCS.personaFeedbacks[]`

---

## Build Errors

### Module not found: @/components/ui/...

**Symptom:** Build fails with "Cannot find module @/components/ui/...".

**Cause:** The `@` path alias isn't resolving correctly.

**Fix:** Check `vite.config.ts` — it should have `@` mapped to `./src`. The shadcn components should be in `src/components/ui/`.

---

## Checklist for New Screen Bugs

If a new screen isn't working, verify in order:

1. [ ] Screen ID is prefixed with project name (e.g., `my-app-home`)
2. [ ] Screen wired in project's `index.tsx` routing with correct condition
3. [ ] `SCREEN_DOCS` entry exists in `src/data/screenDocs.ts`
4. [ ] Screen added to correct scenario's `steps[]` in `registry.ts`
5. [ ] Page component renders without throwing (check browser console)
6. [ ] Navigation callbacks are wired to correct screen IDs
7. [ ] Build passes (`npm run build`)
