# Tugas — Decision Log

All design decisions for the Tugas project. Each entry includes the rationale and any persona feedback that prompted it.

---

### Indonesian language for all UI labels
- **Date:** 2026-04-04
- **Decision:** All button labels, filters, empty states, and placeholder text use Bahasa Indonesia
- **Rationale:** The target persona (Budi, 24yo dev in Bandung) thinks in Indonesian. English UI creates unnecessary cognitive load for a personal productivity tool. Stats labels (like "Completion rate") stay in English as they're industry-standard dev terms.
- **Status:** Active

### Visual priority selector instead of dropdown
- **Date:** 2026-04-04
- **Decision:** Priority selection on the Add Task page uses three side-by-side buttons with color coding (🟢🟡🔴), not a dropdown menu
- **Rationale:** Three options don't warrant a dropdown. Buttons are one tap (vs. two for dropdown). Color + emoji makes the choice visceral — you feel the urgency difference. Budi's feedback: "Priority selector yang visual — nggak perlu dropdown."
- **Feedback prompted:** budi-tugas-add-7
- **Status:** Active

### Delete confirmation via bottom sheet, not browser dialog
- **Date:** 2026-04-04
- **Decision:** Deleting a task shows a custom bottom sheet confirmation instead of `window.confirm()`
- **Rationale:** Browser dialogs break the mobile mockup illusion. A bottom sheet feels native to the platform we're simulating (iOS/Android). It also lets us show the task title in the confirmation message for clarity. Uses `position: absolute` within the project container per lab conventions.
- **Feedback prompted:** budi-tugas-detail-8
- **Status:** Active

### Due date urgency labels on task cards
- **Date:** 2026-04-04
- **Decision:** Task cards show contextual urgency labels: "Hari ini" (yellow), "Besok" (yellow), "Terlambat" (red)
- **Rationale:** Raw dates require mental math. Urgency labels provide instant triage — you know which tasks need attention without calculating. Budi's top request: "Tambahin indikator kalau due date hari ini atau besok."
- **Feedback prompted:** budi-tugas-home-8
- **Status:** Active
