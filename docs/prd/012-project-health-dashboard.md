# PRD-012: Project Health Dashboard

## Summary
A single overview screen that shows the health and completeness of each project in the lab. At a glance: how many screens have docs, how many have persona feedback, decision log activity, annotation coverage, and a readiness score for stakeholder review.

## Problem
- With multiple projects in the lab, there's no way to see which ones are well-documented vs. half-baked.
- It's easy to forget to add persona feedback, screen docs, or decisions for new screens.
- No sense of overall progress: "Is this prototype ready to show to stakeholders?"

## Goals
1. Dashboard accessible from the project switcher (or a dedicated `/health` route).
2. Per-project health card showing:
   - Screen coverage: X/Y screens have docs
   - Persona coverage: X/Y screens have persona feedback
   - Decision activity: last decision date, total decisions, active vs. scrapped ratio
   - Annotation sessions: total, most recent
   - Scenario coverage: screens without any scenario
3. Overall readiness score (0-100) based on weighted criteria.
4. Drill-down: click a metric to jump to the relevant screen/panel.

## Non-Goals
- Code quality metrics (that's PRD-006 and PRD-008).
- Time-based tracking (no "days since last update" guilt trips).
- Cross-project comparison rankings.

## Proposed Solution

### Health Metrics
```ts
interface ProjectHealth {
  projectId: string
  screens: {
    total: number
    withDocs: number
    withPersonaFeedback: number
    withDecisions: number
    withAnnotations: number
  }
  personas: {
    total: number
    withFeedback: number
    averageScore: number | null
  }
  decisions: {
    total: number
    active: number
    scrapped: number
    lastDecisionDate: string | null
  }
  scenarios: {
    total: number
    screensNotInAnyScenario: string[]
  }
  readinessScore: number  // 0-100
}
```

### Readiness Score Weights
| Metric | Weight | Max Points |
|--------|--------|-----------|
| Screen docs coverage | 30% | 30 |
| Persona feedback coverage | 25% | 25 |
| Decision log has entries | 15% | 15 |
| All screens in at least one scenario | 15% | 15 |
| At least one annotation session | 10% | 10 |
| At least 2 personas defined | 5% | 5 |

### UI
- Accessible via a "Health" icon in the project switcher header.
- Grid of project cards, each showing a radial progress chart (readiness score) and key metrics.
- Color coding: green (>80), yellow (50-80), red (<50).
- Click a metric → navigate to that project + relevant panel.
- "What's missing" section: actionable checklist of items needed to reach 100%.

### Data Source
- Reads from `PROJECT_CONFIGS` (or SQLite if PRD-001 ships first).
- Reads from `SCREEN_DOCS`.
- Queries `annotation_sessions` table.
- All computation is client-side — no new API needed.

## Success Criteria
- Dashboard renders in under 1 second for 5 projects.
- Readiness score accurately reflects prototype completeness (validated by manual review of 3 projects).
- "What's missing" list correctly identifies undocumented screens.

## Risks
- Readiness score weighting may not match all teams' priorities — make weights configurable in v2.
- If PRD-001 (SQLite migration) hasn't shipped, health data comes from multiple sources — accept the complexity.

## Effort Estimate
**S (< 1 week)** — metric computation from existing data, dashboard UI, readiness score algorithm.
