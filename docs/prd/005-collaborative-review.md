# PRD-005: Collaborative Review Mode

## Summary
Enable real-time collaborative design reviews where multiple people can view the same mockup simultaneously, drop annotations, and discuss changes live. Think "Google Docs for design review" — cursors, presence indicators, and a shared annotation layer.

## Problem
- Design reviews happen in meetings with screen-share, losing context afterward.
- Feedback is scattered across Slack, email, and meeting notes.
- Only one person can annotate at a time in the current system.

## Goals
1. Shareable review URL that others can open in their browser.
2. Live cursor presence: see where others are pointing.
3. Shared annotation layer: all reviewers' pins appear in real-time.
4. Comment threads on annotations (not just single comments).
5. Session recording: who said what, when, preserved in the DB.

## Non-Goals
- Real-time co-editing of the actual React code.
- Video/audio chat (use Zoom/Meet alongside).
- Persistent user accounts (session-based identity with display names).

## Proposed Solution

### Architecture
```
[Reviewer A Browser] ←→ WebSocket Server ←→ [Reviewer B Browser]
                              ↓
                    Session State (in-memory + SQLite persist)
```

### WebSocket Server
- Vite plugin or standalone `ws` server on a separate port.
- Events: `cursor:move`, `annotation:add`, `annotation:update`, `comment:add`, `presence:join`, `presence:leave`.
- Room = `projectId:screen:view`.

### Identity
- On join: prompt for display name + pick a color.
- Stored in `localStorage` for return visits.
- Presence bar shows colored dots with names.

### Annotation Threading
```ts
interface ReviewComment {
  id: string
  annotationId: number
  author: string
  authorColor: string
  text: string
  timestamp: string
  resolved: boolean
}
```

### UI Changes
- "Start Review" button → generates a shareable URL with a session token.
- Presence bar at the top of the mockup area.
- Annotation pins show author color.
- Comment panel under each pin expands into a thread.
- "End Review" saves the full session to SQLite.

## Success Criteria
- 2+ simultaneous reviewers with <200ms cursor latency on LAN.
- All annotations and comments persisted after session ends.
- Shareable URL works without any setup on the reviewer's side (no npm install).

## Risks
- WebSocket adds infra complexity — mitigate by using Vite's built-in WebSocket or a minimal `ws` plugin.
- NAT traversal for remote reviewers — initially scope to LAN, add tunneling (ngrok) as stretch.
- Conflict resolution if two people annotate the same element — last-write-wins is acceptable for MVP.

## Effort Estimate
**L (2–4 weeks)** — WebSocket server, presence system, shared annotation layer, comment threading, session persistence.
