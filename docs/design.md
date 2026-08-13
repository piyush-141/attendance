# Playful Learning — Design System

> Extracted from the reference dashboard (warm, rounded, illustration-led edtech UI) and written as an implementation-ready spec. Swap the placeholder copy, nav items, and illustrations for your own content — the tokens, spacing, and component rules below are what carry the "playful" feel and should stay consistent.

**Note on scope:** I don't have your current site's pages or content, so this doc defines the full visual language (tokens + components) generically, the way the reference does, so you can apply it to any page type — dashboard, marketing page, or app. Section 8 shows how to adapt the same components to non-dashboard layouts.

---

## 1. Design Philosophy

Four things make this style read as "playful" rather than just "colorful":

1. **Soft everything.** No hard edges, no pure black, no harsh shadows. Every surface is rounded, every shadow is diffused, every color is a tint rather than a saturated primary.
2. **Color-coded categories, not color-coded chrome.** Orange is the *one* brand/action color (buttons, active states). Every other color (purple, pink, blue, green, yellow) is reserved for labeling content categories — it tells you *what something is*, not just *that it's clickable*.
3. **3D illustration as reward, not wallpaper.** Illustrations (graduation cap, piggy bank, mascots) appear sparingly, at moments of achievement or upsell — never as generic decoration filling empty space.
4. **Warm neutral base.** The canvas itself is a warm sand/cream tone, not white or gray. White is reserved for content surfaces (cards), which makes those cards feel like they're floating on the background rather than blending into it.

**Signature element:** the corner-anchored 3D illustration + the "days left" progress nudge (piggy bank card). This is the one moment of dimensional, rendered artwork against an otherwise flat UI — keep it to one or two per screen so it stays special.

---

## 2. Color Palette

### Base / Neutral
| Token | Hex | Usage |
|---|---|---|
| `--color-canvas` | `#F4E6CC` → `#EAD6AE` (soft diagonal gradient) | Page background, visible as a frame around the main content card |
| `--color-surface` | `#FFFFFF` | Cards, sidebar, top bar |
| `--color-surface-alt` | `#FBF9F5` | Nested panels, input fields |
| `--color-border` | `#F0EDE6` | Hairline dividers, card outlines |
| `--color-text-primary` | `#26243A` | Headings, primary text |
| `--color-text-secondary` | `#8B8AA0` | Captions, metadata, placeholder text |
| `--color-text-tertiary` | `#B8B7C9` | Disabled text, faint labels |

### Brand / Action
| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#FF9A3D` | Primary buttons ("Upgrade to Pro", "Follow"), active nav state, links |
| `--color-primary-hover` | `#F58A26` | Hover/pressed state |
| `--color-primary-tint` | `#FFF1E0` | Active nav item background, subtle highlight fills |

### Category Colors (each is a bg tint + a matching icon/accent shade — never mix across pairs)
| Category | Tint (bg) | Accent (icon/text/progress) |
|---|---|---|
| Violet | `#EDEAFB` | `#7C6AE8` |
| Coral | `#FDE9E7` | `#FF7A6B` |
| Sky | `#E3F2FE` | `#2FA8E0` |
| Teal (selected/active variant of Sky) | `#DFF5F1` | `#1B9E93` |
| Mint | `#E1F7EA` | `#2FBE73` |
| Sand | `#F7EDD3` | `#D9A441` |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#2FBE73` | Positive states, completed |
| `--color-warning` | `#F5B942` | Low balance / time-limited notices |
| `--color-danger` | `#F16565` | Errors, destructive actions |

**Rule of thumb:** pick a category color once per content type (course subject, product line, project tag) and keep that pairing consistent everywhere it appears — card background, progress bar fill, and category chip should always match.

---

## 3. Typography

Avoid the default pairing of a heavy geometric sans for everything — use two families with distinct jobs so headings keep the rounded, friendly character while long text stays easy to read at small sizes.

- **Display / Headings:** [Fredoka](https://fonts.google.com/specimen/Fredoka) — rounded terminals, medium-to-bold weights. Carries the "playful" personality.
- **Body / UI text:** [Inter](https://fonts.google.com/specimen/Inter) — neutral, highly legible at 13–14px, used for paragraphs, table data, nav labels.
- **Numerals / Data:** Inter with tabular figures (`font-variant-numeric: tabular-nums`) for stats, follower counts, percentages, so numbers align in lists.

### Type Scale
| Token | Size / Line-height | Weight | Family | Usage |
|---|---|---|---|---|
| `--text-h1` | 28px / 34px | 600 | Fredoka | Page title ("Overview") |
| `--text-h2` | 18px / 24px | 600 | Fredoka | Section headers ("Course in Progress") |
| `--text-h3` | 15px / 20px | 600 | Fredoka | Card titles |
| `--text-body` | 14px / 20px | 400 | Inter | Paragraph, descriptions |
| `--text-small` | 12.5px / 16px | 400 | Inter | Captions, dates, metadata |
| `--text-label` | 11px / 14px | 600, uppercase, +0.04em tracking | Inter | Sidebar section labels ("MAIN MENU", "SETTING") |
| `--text-button` | 14px / 20px | 600 | Inter | Button labels |

---

## 4. Spacing & Grid

Base unit: **4px**. Use the scale below rather than arbitrary values so rhythm stays consistent.

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

- **Page padding** (canvas → card edge): 24px
- **Card padding:** 20–24px
- **Gap between cards in a row:** 20px
- **Gap between stacked sections:** 32px
- **Sidebar width:** 220px fixed
- **Content grid:** 12-column, main content ~8 columns, right rail ~4 columns on desktop ≥1280px

```
┌───────────┬──────────────────────────────────────────┬──────────────┐
│           │  Top bar: search · notifications · avatar │              │
│  Sidebar  ├──────────────────────────────────────────┤  (right rail │
│  220px    │  Course in Progress  (3-up card row)      │   collapses  │
│           ├───────────────────┬──────────────────────┤   into main  │
│  logo     │  Popular           │  Top Mentors          │   flow on   │
│  nav      │  Categories        │  (list)               │   tablet)   │
│  settings │  (2×2 grid)        │                       │              │
└───────────┴───────────────────┴──────────────────────┴──────────────┘
```

---

## 5. Radius & Elevation

Roundness is the single biggest signal of "playful" vs "corporate" — be generous and consistent.

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 10px | Chips, small icon tiles, inputs |
| `--radius-md` | 16px | Buttons, list items, avatars-with-frame |
| `--radius-lg` | 20px | Cards (course cards, category cards) |
| `--radius-xl` | 28px | Page-level containers, hero/promo panels |
| `--radius-full` | 999px | Pills, primary buttons, avatars, progress bars |

### Shadows
Keep shadows soft, warm-tinted (not pure black), and used sparingly — one level for resting cards, one for hover/raised state.

```css
--shadow-resting: 0 8px 24px rgba(43, 36, 20, 0.06);
--shadow-raised:  0 16px 32px rgba(43, 36, 20, 0.10);
--shadow-button:  0 6px 14px rgba(255, 154, 61, 0.35); /* colored shadow under primary buttons */
```

---

## 6. Iconography & Illustration

- **Line icons** (sidebar nav, list actions, search, bell): 20px, 1.5px stroke, rounded caps/joins — e.g. [Phosphor Icons](https://phosphoricons.com/) or [Lucide](https://lucide.dev/) in "regular" weight. Icons inside colored tiles use the category's accent color; icons in the sidebar are gray by default, orange when active.
- **Icon tiles:** small icons sit inside a 36–40px rounded-square (`--radius-sm`) tinted with the category color — never a bare icon floating on white.
- **3D illustrations** (mascot, graduation cap, piggy bank, achievement moments): glossy, soft-shaded, rounded forms with a limited palette pulled from the same category colors so they never clash with the UI. Use these only for: empty states, milestones/achievements, and upsell moments (subscription, upgrade). Cap it at one illustration per screen so it stays a "moment" rather than clutter.
- **Avatars:** circular, 32–40px, with a 2px white ring when overlapping (mentor lists, team stacks).

---

## 7. Components

### 7.1 Sidebar Navigation
- White background, full height, 220px wide, 24px horizontal padding.
- Logo top-left, Fredoka 20px bold.
- Section label (`--text-label`, `--color-text-secondary`) above each nav group: "MAIN MENU", "SETTING".
- Nav item: 44px tall, icon + label, `--radius-md`, full-width.
  - **Default:** transparent bg, `--color-text-secondary` icon/text.
  - **Hover:** `--color-surface-alt` bg.
  - **Active:** `--color-primary-tint` bg, `--color-primary` icon/text, optional 3px rounded bar on the left edge in `--color-primary`.

### 7.2 Top Bar
- Search input: pill-shaped (`--radius-full`), `--color-surface-alt` fill, no border, search icon + "Search here" placeholder in `--color-text-tertiary`.
- Notification bell: icon button, `--radius-full`, small unread dot in `--color-danger`.
- Avatar: 36px circle, top-right, optional colored ring on hover.

### 7.3 Progress / Content Card (e.g. "Course in Progress")
- `--radius-lg`, category tint background, `--shadow-resting`, 20px padding.
- Top row: small icon tile (category accent) + overflow "⋯" button.
- Date/meta line: `--text-small`, `--color-text-secondary`.
- Title: `--text-h3`.
- Description: `--text-body`, `--color-text-secondary`, 2-line clamp.
- Progress bar: 6px tall, `--radius-full`, track = 20%-opacity of the category accent, fill = solid category accent. Percentage label right-aligned above the bar in `--text-small` bold.
- **Selected/emphasized variant** (e.g. currently active item in a set): swap the tint for the Teal pair and give the card a 1.5px `--color-primary`-free border in the Teal accent, or lift it with `--shadow-raised` — reserve this for exactly one card in a group so "current focus" stays obvious.

### 7.4 Category Tile (e.g. "Popular Categories")
- 2-up or 2×2 grid, `--radius-lg`, category tint fill, 16–20px padding.
- Icon tile top or left, category name (`--text-h3`), count in `--text-small` `--color-text-secondary` ("34 Courses").
- No border, no shadow needed — the tint alone is enough to read as a card against the white parent panel.

### 7.5 List Row (e.g. "Top Mentors")
- 56–64px row height, avatar (40px) + name/role stack + stat columns + action.
- Name: `--text-body` weight 600. Role/subtitle: `--text-small` `--color-text-secondary`.
- Stat columns (course count, followers): `--text-small`, tabular numerals, right-aligned in fixed-width columns so they line up down the list.
- Action button ("Follow"): pill, `--color-primary` fill, white text, `--text-button`, 32px tall, ~16px horizontal padding.
- Overflow icon button at the row's far right, `--color-text-tertiary`, `--color-surface-alt` on hover.

### 7.6 Buttons
| Variant | Style |
|---|---|
| Primary | `--color-primary` fill, white text, `--radius-full`, `--shadow-button`, hover → `--color-primary-hover` |
| Secondary | White fill, 1.5px `--color-border`, `--color-text-primary` text, `--radius-full` |
| Ghost / icon | Transparent, `--color-text-secondary`, `--radius-full`, `--color-surface-alt` on hover |

All buttons: 14px/20px `--text-button`, 10–12px vertical padding, 20–24px horizontal padding for text buttons, subtle scale-down (0.97) on active press.

### 7.7 Promo / Upsell Panel (e.g. subscription card)
- `--radius-xl`, sits in the right rail, tint background (Sand or Violet work well against the primary orange CTA).
- 3D illustration anchored top or centered, slightly overflowing the card's top edge for a "popping out" effect.
- Short supporting line (`--text-body`, `--color-text-secondary`, 1–2 lines max).
- Primary button pinned to the bottom, full-width within the card's padding.

### 7.8 Progress Bar (standalone)
```
Track:  height 6px, radius-full, background = accent @ 15% opacity
Fill:   height 6px, radius-full, background = accent solid, width = %
Label:  text-small, weight 600, positioned above-right of the bar
```

---

## 8. Applying This Beyond a Dashboard

If your site isn't a dashboard, carry the same tokens into other layouts:

- **Marketing / landing page:** use the canvas gradient as the hero background, float one 3D illustration as the hero's signature visual, and turn category-tinted cards into feature cards (one tint per feature, not one tint per column position).
- **Forms / settings pages:** inputs use `--color-surface-alt` fill with `--radius-md`, no visible border until focus; focus state = 2px `--color-primary` outline with 2px offset.
- **Empty states:** centered 3D illustration (this is one of the sanctioned places to use one), `--text-h3` headline, one-line `--text-body` explanation, single primary button.

---

## 9. Motion

Keep motion minimal and functional — this style earns "playful" through color and shape, not animation:

- **Hover:** 120ms ease-out on background-color and transform (translateY(-2px) for cards, scale(0.97) for button press).
- **Progress bars:** animate width on load, 600ms ease-out, once per page load only.
- **Page transitions:** simple 150ms fade; avoid slide/bounce effects, which read as generic template motion.
- Respect `prefers-reduced-motion`: disable transform/translate animations, keep only opacity fades.

---

## 10. Accessibility

- Text on tinted backgrounds: verify `--color-text-primary` (#26243A) on the lightest tint (Sky #E3F2FE) — passes AA for body text. Never place `--color-text-secondary` on a colored tint for anything below 14px; use `--color-text-primary` instead.
- `--color-primary` orange on white passes AA for large text/UI components but is borderline for small body text — reserve it for buttons (with white text on top, which passes easily) and icons, not for small orange-on-white paragraphs.
- All interactive elements get a visible focus ring: 2px `--color-primary`, 2px offset, regardless of mouse-vs-keyboard input.
- Category color alone is never the only signal — pair every tint with a text label or icon shape difference so the UI doesn't depend on color perception alone.

---

## 11. CSS Custom Properties (ready to paste)

```css
:root {
  /* Base */
  --color-canvas-start: #F4E6CC;
  --color-canvas-end: #EAD6AE;
  --color-surface: #FFFFFF;
  --color-surface-alt: #FBF9F5;
  --color-border: #F0EDE6;
  --color-text-primary: #26243A;
  --color-text-secondary: #8B8AA0;
  --color-text-tertiary: #B8B7C9;

  /* Brand */
  --color-primary: #FF9A3D;
  --color-primary-hover: #F58A26;
  --color-primary-tint: #FFF1E0;

  /* Category pairs */
  --violet-tint: #EDEAFB; --violet-accent: #7C6AE8;
  --coral-tint:  #FDE9E7; --coral-accent:  #FF7A6B;
  --sky-tint:    #E3F2FE; --sky-accent:    #2FA8E0;
  --teal-tint:   #DFF5F1; --teal-accent:   #1B9E93;
  --mint-tint:   #E1F7EA; --mint-accent:   #2FBE73;
  --sand-tint:   #F7EDD3; --sand-accent:   #D9A441;

  /* Semantic */
  --color-success: #2FBE73;
  --color-warning: #F5B942;
  --color-danger:  #F16565;

  /* Radius */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 999px;

  /* Shadow */
  --shadow-resting: 0 8px 24px rgba(43, 36, 20, 0.06);
  --shadow-raised:  0 16px 32px rgba(43, 36, 20, 0.10);
  --shadow-button:  0 6px 14px rgba(255, 154, 61, 0.35);

  /* Type */
  --font-display: 'Fredoka', sans-serif;
  --font-body: 'Inter', sans-serif;
}

body {
  background: linear-gradient(135deg, var(--color-canvas-start), var(--color-canvas-end));
  font-family: var(--font-body);
  color: var(--color-text-primary);
}
```

---

## 12. Quick Reference Checklist

- [ ] Canvas is warm cream, never white or gray
- [ ] Every card/button is rounded (min 16px, or full pill for buttons)
- [ ] One category = one consistent tint + accent pair, used identically everywhere
- [ ] Orange reserved for primary actions and active states only
- [ ] Shadows are soft, warm-tinted, never pure black
- [ ] Fredoka for headings, Inter for everything else
- [ ] Max 1–2 3D illustrations visible per screen, placed at moments of achievement/upsell
- [ ] Numbers in lists use tabular figures and align in columns
- [ ] Every interactive element has a visible, on-brand focus state
