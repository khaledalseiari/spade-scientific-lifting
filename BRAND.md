# Brand palette & contrast rules

| Token | Hex | Role |
|---|---|---|
| `brand-ink` | `#2F0147` | Deepest tone — nav, footer, hero bg, dark-mode base |
| `brand-primary` | `#610F7F` | Primary buttons, links, active states |
| `brand-accent` | `#065A82` | Headings, data viz lines/bars, section dividers |
| `brand-support` | `#84C7D0` | Cards, badges, chips, secondary buttons |
| `brand-highlight` | `#75DDDD` | Success states, progress bars, hover states (sparingly) |

## Verified contrast pairs (WCAG AA = 4.5:1 for normal text)

Computed with the standard relative-luminance formula:

- `ink` on white: **17.27:1** — body text, headings on white surfaces.
- `primary` background + white text: **11.15:1** — safe for primary buttons.
- `accent` background + white text: **7.52:1** — safe for accent buttons/headers.
- `support` (`#84C7D0`) background: **fails** with white text (1.90:1). Always pair with **dark text** — `ink` (9.09:1) or near-black.
- `highlight` (`#75DDDD`) background: **fails** with white text (1.60:1). Always pair with **dark text** — `ink` (10.81:1) or near-black.

**Rule of thumb:** `ink`, `primary`, `accent` are dark enough for white text on top. `support` and `highlight` are light — they always take dark (`ink` or near-black) text, never white. The shared UI components in `src/components/ui/` (`Button`, `Badge`, `ProgressBar`) already encode this, so use those rather than hand-rolling color classes on `support`/`highlight` backgrounds.
