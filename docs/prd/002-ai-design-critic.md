# PRD-002: AI Persona Review Engine

> **Status: Active** — Merged from original PRD-002 (AI Design Critic) + PRD-010 (Persona Simulation Engine)

## Summary
Transform persona profiles into AI-powered reviewers that analyze live mockup screenshots and provide structured, in-character feedback. Two persona categories exist: **user personas** (target end-users like Nadia the marketing manager) and **internal personas** (product team members like a UX designer, accessibility auditor, or PM). Each persona walks through the scenario, narrates their thought process, and scores the experience based on what they "see."

## Problem
- Current persona feedback is manually authored by the designer, introducing bias and becoming stale when designs change.
- There's no "expert eye" review — usability heuristics, accessibility, and visual hierarchy checks require specialized knowledge.
- Writing believable feedback for 3-5 personas across 4-8 screens is tedious and slow.
- Designers working solo lack a senior design review.

## Two Persona Types

### User Personas (existing concept, now AI-simulated)
Real target users with demographics, behavior patterns, trust signals, and booking behavior. They review from the **"would I use this?"** perspective.

Examples: Nadia Putri (marketing manager, impulse booker), Budi Santoso (methodical planner).

### Internal Personas (new)
Product team archetypes that review from a **professional lens**. They don't have booking behavior — they have expertise domains and review checklists.

```ts
interface InternalPersona {
  id: string
  name: string
  role: string                    // "Senior UX Designer", "Accessibility Auditor", "Product Manager"
  type: 'internal'                // distinguishes from user personas
  avatar: string
  expertise: string[]             // ["visual hierarchy", "interaction patterns", "mobile usability"]
  reviewFocus: string[]           // what they look for specifically
  quotes: string[]                // characteristic voice
  severityBias: 'strict' | 'balanced' | 'lenient'
}
```

**Built-in internal personas (v1):**

| Name | Role | Focus |
|------|------|-------|
| Ayu Pramesti | Senior UX Designer | Visual hierarchy, interaction patterns, information architecture, flow friction |
| Rizal Hakim | Accessibility Auditor | WCAG compliance, contrast ratios, touch targets, screen reader compatibility |
| Dian Kusuma | Product Manager | User value clarity, conversion friction, scope creep, MVP focus |

## Goals
1. "Simulate Review" button per persona — captures screenshots of the scenario, sends to LLM with persona profile.
2. User personas produce `feedbackHistory`-format output (score, likes, missing, topChange).
3. Internal personas produce structured **review reports** (heuristic findings, severity, suggestions).
4. Comparison mode: show simulated vs. manually-written feedback side by side.
5. Bulk simulation: run all personas (or all of one type) through a scenario in one click.
6. Reviews saved to SQLite for history and trend tracking.

## Non-Goals
- Simulating actual interactions (screenshot-based analysis only for v1).
- Generating new personas from scratch.
- Replacing manual persona feedback authoring.
- Auto-fixing identified issues.

## Proposed Solution

### Simulation Flow
```
User clicks "Simulate" on persona card
        ↓
System walks through scenario steps:
  For each step:
    1. Set screen → capture screenshot (html2canvas)
    2. Send to LLM with persona profile + screenshot + screen doc
    3. LLM responds in-character
        ↓
Aggregate results by persona type:
  - User persona → feedbackHistory format
  - Internal persona → review report format
        ↓
Display in PersonaPanel with type badges
Optional: accept/merge into persona JSON
```

### User Persona Output (matches existing format)
```json
{
  "screen": "ketemoo-discover",
  "view": "mobile",
  "date": "2026-04-07",
  "score": 7,
  "scoreReason": "Nice warm feeling but I can't tell what neighborhood these are in",
  "firstImpression": "Oh this looks cozy! But wait, where is this pottery class?",
  "likes": ["Love the warm colors", "Photos make me want to try this"],
  "missing": ["Location/neighborhood info", "Available dates visible upfront"],
  "wouldTheyProceed": "Probably, but I'd need to tap into each one to check location",
  "topChange": "Add neighborhood name to each card",
  "simulated": true
}
```

### Internal Persona Output (new format)
```ts
interface DesignReview {
  personaId: string
  screen: string
  view: 'mobile' | 'web'
  overallScore: number
  summary: string
  findings: {
    category: string          // "Visual Hierarchy", "Accessibility", "Interaction"
    severity: 'info' | 'warning' | 'critical'
    finding: string
    element?: string          // CSS selector if identifiable
    suggestion: string
    wcagLevel?: 'A' | 'AA' | 'AAA'  // for accessibility findings
  }[]
  topChanges: string[]
  reviewedAt: string
  simulated: true
}
```

### UI
- Persona panel split into two sections: "Users" and "Team" (collapsible).
- "Simulate" button (rocket icon) on each persona card.
- "Simulate All Users" / "Simulate All Team" bulk buttons.
- Simulated entries have dashed border + "AI" badge.
- "Accept" merges into persona file, "Reject" discards.
- Internal persona reviews render as finding cards (color-coded by severity).

## Success Criteria
- Simulated feedback is persona-consistent (Nadia sounds different from Ayu the UX designer).
- Internal persona findings overlap >70% with a real UX audit on the same screen.
- Full scenario simulation (4 screens, 1 persona) completes in under 60 seconds.
- WCAG contrast violations correctly identified by the accessibility persona.

## Risks
- LLM may produce generic feedback — mitigate with strong few-shot examples and persona voice samples.
- Screenshot quality limits what the LLM can "see" — high-res captures needed.
- Cost: ~$0.10-0.30 per full scenario simulation per persona.

## Effort Estimate
**L (2–4 weeks)** — simulation pipeline, dual persona types, prompt engineering, screenshot capture, review/accept UI, batch mode.
