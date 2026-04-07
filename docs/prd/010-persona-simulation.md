# PRD-010: Persona Simulation Engine

## Summary
Transform static persona profiles into interactive simulated users. Given a persona's traits, preferences, and behavior patterns, an LLM role-plays as that persona walking through the mockup — narrating their thought process, flagging friction points, and scoring the experience dynamically based on what they actually "see" on each screen.

## Problem
- Current persona feedback is manually authored by the designer, which introduces bias.
- Feedback is static — it doesn't update when the design changes.
- Writing believable persona feedback for 3-5 personas across 4-8 screens is tedious and slow.

## Goals
1. "Simulate Review" button per persona that triggers an AI walkthrough of the current scenario.
2. The simulation follows the scenario steps, capturing a screenshot at each screen.
3. Output: per-screen feedback in the exact `feedbackHistory` format, ready to merge into the persona JSON.
4. Comparison mode: show simulated feedback alongside manually written feedback.
5. Bulk simulation: run all personas through a scenario in one click.

## Non-Goals
- Simulating actual interactions (clicks, form fills) — screenshot-based analysis only for v1.
- Generating new personas from scratch (uses existing persona profiles).
- Replacing manual persona feedback authoring.

## Proposed Solution

### Simulation Flow
```
User clicks "Simulate" on persona card
        ↓
System walks through scenario steps:
  For each step:
    1. Set screen → capture screenshot
    2. Send to LLM with persona profile + screenshot + screen doc
    3. LLM responds in-character as the persona
        ↓
Aggregate into feedbackHistory format
        ↓
Display in PersonaPanel as "Simulated" entries
Optional: merge into persona JSON file
```

### Prompt Engineering
The system prompt includes:
- Full persona profile (age, role, archetype, booking behavior, trust signals, quotes)
- The persona's existing feedback history (for consistency)
- The screen's goal and design notes
- Instruction to respond in first person, matching the persona's voice

Example output:
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

### UI
- "Simulate" button on each persona card (rocket icon).
- "Simulate All" button at the top of the persona panel.
- Simulated feedback entries have a distinct badge/border (e.g., dashed border, "AI" label).
- "Accept" button to merge simulated feedback into the real persona file.
- "Reject" to discard.

## Success Criteria
- Simulated feedback is persona-consistent (Nadia's feedback sounds different from Budi's).
- Friction points identified by simulation overlap >60% with human-authored feedback.
- Full scenario simulation (4 screens, 1 persona) completes in under 60 seconds.

## Risks
- LLM may produce generic feedback that doesn't reflect the persona's actual preferences — mitigate with strong few-shot examples from existing feedback history.
- Screenshot quality limits what the LLM can "see" — high-res captures needed.
- Cost: ~$0.10-0.30 per full scenario simulation per persona.

## Effort Estimate
**L (2–4 weeks)** — simulation pipeline, prompt engineering, screenshot capture, review/accept UI, batch mode.
