# PRD-003: Version Snapshot & Visual Diff

## Summary
Capture point-in-time visual snapshots of every screen at each design milestone. Enable side-by-side comparison of any two versions, with pixel-diff highlighting and a decision-log link explaining what changed and why.

## Problem
- Design evolution is invisible — you can see git diffs of code but not visual diffs of the actual mockup.
- Decision logs describe changes in text, but there's no visual evidence of before/after.
- When reviewing with stakeholders, there's no way to say "here's what it looked like last Tuesday."

## Goals
1. Manual "Save Snapshot" button that captures the current screen as a PNG + metadata.
2. Snapshot gallery per screen showing thumbnails with timestamps.
3. Side-by-side diff viewer with pixel-diff overlay (red highlight on changed areas).
4. Link snapshots to decisions: "This snapshot was taken before/after decision X."

## Non-Goals
- Automatic snapshots on every code change (too noisy).
- Video recording of interactions.
- Design version branching (not git for designs).

## Proposed Solution

### Snapshot Capture
```
[Mockup] → html2canvas → PNG blob → POST /api/snapshots
                                          ↓
                          SQLite: { id, projectId, screen, view, 
                                    imageBlob, metadata, decisionId?, timestamp }
```

### Diff Engine
- Use `pixelmatch` (npm library) to generate a diff image between two snapshots.
- Overlay modes: side-by-side, overlay with opacity slider, diff-only (red pixels).

### UI
- New "History" tab in the docs panel per screen.
- Thumbnail timeline: click any two snapshots to compare.
- "Snapshot" button next to the "Annotate" button in the toolbar.
- Badge on snapshot thumbnails if linked to a decision.

### Storage
```sql
CREATE TABLE snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  screen TEXT NOT NULL,
  view TEXT NOT NULL,
  image BLOB NOT NULL,
  label TEXT,
  decision_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Success Criteria
- Snapshots capture in under 2 seconds.
- Diff viewer correctly highlights visual changes with <5% false-positive pixels.
- Designers use snapshot links in decision log entries.

## Risks
- BLOB storage in SQLite could bloat the DB — mitigate by compressing PNGs and offering a purge option.
- html2canvas doesn't capture everything (e.g., CSS backdrop-filter) — document known limitations.

## Effort Estimate
**L (2–4 weeks)** — capture pipeline, SQLite blob storage, diff engine, gallery UI, decision linking.
