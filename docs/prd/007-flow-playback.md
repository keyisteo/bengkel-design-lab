# PRD-007: User Flow Playback & Recording

## Summary
Record interactive user flows (clicks, scrolls, screen transitions) as replayable sessions. Play them back in the mockup at adjustable speed — like a screen recording, but using the actual live components. Useful for stakeholder demos, handoff documentation, and testing flow smoothness.

## Problem
- Scenario steps show *which* screens exist in a flow but not *how* a user moves through them.
- Demoing a flow to stakeholders requires manually clicking through every time.
- There's no way to document the exact click path that triggers a transition.

## Goals
1. "Record" mode that captures user interactions (clicks, taps, scrolls) with timestamps.
2. "Playback" mode that replays the recording in the live mockup with visual cursor.
3. Adjustable playback speed (0.5x, 1x, 2x).
4. Export as GIF or WebM for sharing outside the lab.
5. Recordings linked to scenarios (e.g., "Happy Path recording v2").

## Non-Goals
- Full session replay like FullStory/Hotjar (no network requests, no console).
- Cross-project recordings.
- Audio narration (v1 is visual only).

## Proposed Solution

### Recording
```ts
interface FlowEvent {
  type: 'click' | 'scroll' | 'screen-change'
  timestamp: number   // ms from recording start
  target?: string     // CSS selector of clicked element
  coordinates?: { x: number; y: number }
  screen?: string     // for screen-change events
  scrollDelta?: number
}

interface FlowRecording {
  id: string
  projectId: string
  scenarioId: string
  view: 'mobile' | 'web'
  events: FlowEvent[]
  duration: number
  recordedAt: string
}
```

### Capture Mechanism
- Wrap the mockup viewport in a transparent event listener layer (similar to annotation layer).
- Capture `click`, `scroll`, and `screen-change` events with relative coordinates.
- Screen changes detected via the `onScreenChange` callback.

### Playback Engine
- Iterate through events by timestamp.
- Render a fake cursor SVG that moves to each click position.
- Trigger screen changes by calling `onScreenChange`.
- Scroll events applied to the viewport container.

### Export
- Use `html2canvas` per frame at 10fps → stitch into GIF via `gif.js` or WebM via `MediaRecorder`.
- Alternative: just capture start/end of each screen transition as a filmstrip.

### UI
- "Record" toggle button in the mockup toolbar.
- Recording indicator (red dot) while active.
- Playback controls: play/pause, speed, scrub bar.
- "Recordings" section in the scenario selector panel.

## Success Criteria
- Recording adds zero noticeable lag to interactions.
- Playback reproduces the exact screen sequence with correct timing.
- GIF export completes in under 30 seconds for a 10-screen flow.

## Risks
- DOM events can't fully simulate real user interaction (e.g., hover states) — accept click + scroll as sufficient for v1.
- Export quality depends on html2canvas — test with complex screens.

## Effort Estimate
**M (1–2 weeks)** — event capture layer, playback engine, recording storage, export pipeline.
