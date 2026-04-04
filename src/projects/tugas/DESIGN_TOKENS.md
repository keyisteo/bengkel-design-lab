# Tugas — Design Tokens

All tokens are scoped under `.tugas` and prefixed with `--tg-`.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `--tg-bg` | `#F8FAFC` | Primary canvas (slate-50) |
| `--tg-surface` | `#FFFFFF` | Card surfaces |
| `--tg-primary` | `#4F46E5` | Primary accent, CTAs, active states (indigo-600) |
| `--tg-primary-hover` | `#4338CA` | Primary hover state (indigo-700) |
| `--tg-primary-light` | `#EEF2FF` | Primary tint, selected backgrounds (indigo-50) |
| `--tg-muted` | `#94A3B8` | Placeholder text, inactive icons (slate-400) |
| `--tg-text` | `#1E293B` | Primary text (slate-800) |
| `--tg-text-secondary` | `#64748B` | Secondary text, descriptions (slate-500) |
| `--tg-border` | `#E2E8F0` | Borders, dividers (slate-200) |
| `--tg-success` | `#10B981` | Completed states, positive indicators (emerald-500) |
| `--tg-success-light` | `#ECFDF5` | Success background tint (emerald-50) |
| `--tg-warning` | `#F59E0B` | Due soon indicators (amber-500) |
| `--tg-warning-light` | `#FFFBEB` | Warning background tint (amber-50) |
| `--tg-danger` | `#EF4444` | Overdue, delete actions (red-500) |
| `--tg-danger-light` | `#FEF2F2` | Danger background tint (red-50) |

## Typography

- **Font family:** Inter, Plus Jakarta Sans, system-ui, sans-serif
- **Headings:** Bold, text-2xl (24px)
- **Body:** Regular, text-sm (14px)
- **Labels:** Semibold, text-[10px] uppercase tracking-wide
- **Badges:** Semibold, text-[11px]

## Spacing

- **Page padding:** px-5 (20px horizontal)
- **Section gaps:** mb-4 to mb-5 (16-20px)
- **Card padding:** p-4 to p-5 (16-20px)
- **Component gaps:** gap-2 to gap-3 (8-12px)

## Border Radius

- **Cards:** 12px
- **Buttons:** 10px
- **Badges:** 6px
- **Filter pills:** rounded-full
- **Checkboxes:** rounded-full

## Component Classes

| Class | Purpose |
|---|---|
| `.tg-card` | Card surface with border and radius |
| `.tg-btn-primary` | Primary CTA button (indigo) |
| `.tg-btn-secondary` | Secondary button (indigo tint) |
| `.tg-input` | Text input with focus state |
| `.tg-badge-high` | Red priority badge |
| `.tg-badge-medium` | Yellow priority badge |
| `.tg-badge-low` | Indigo priority badge |
