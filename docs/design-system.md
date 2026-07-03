# UFO Design System

## Purpose

This document defines the working design-system rules for UFO's mobile-first UI.
It records approved standards, deferred decisions, and implementation guardrails
so future UI work does not drift from the provided PNG designs.

The current design system is intentionally lightweight. It should standardize
repeated foundations and shared components without flattening page-specific
design intent.

## Product UI Direction

- UFO uses a light-only visual direction.
- The UI is designed for smartphone screens only.
- Larger screens must show the same mobile UI centered on the page.
- Do not introduce desktop-specific layouts or breakpoint-driven structural
  changes.
- The current mobile surface max width remains `430px`.
- Visual checks should include `375px`, `390px`, `402px`, and `430px` widths.

## Approved Decisions

| Topic | Decision |
| --- | --- |
| Light/dark mode | Always render as light UI |
| Mobile shell width | Keep `max-w-[430px]` |
| Shared shell | Add a `MobileShell` layout primitive |
| Main navigation | Keep current tabs; do not add Community |
| Chat tokens | Add chat unread, thumbnail, and divider tokens |
| Home fallback banner | Keep fallback, minimize inline hex, use existing tokens where possible |
| Typography | Use role-based text styles and limit arbitrary sizes |
| State UI | Add a shared `StateBlock` after API review |
| Chips | Align classes now; do not extract a shared `Chip` yet |
| Icons | Prefer reusable icon components; do not add a library without review |
| Top bars | Keep `TopBar` and `ChatRoomTopBar` separate but visually aligned |
| Styles route | Keep current feature state; only align visual treatment |
| Radius scale | Keep the current component radius values after gallery review |
| PatternCard geometry | Keep the current `PatternCard` geometry after gallery review |

## Gallery-Reviewed Decisions

### Radius Scale

Radius values were reviewed through `/design-gallery`. Keep the current radius
values for this pass.

Do not broadly change these component types unless a future design task provides
new PNG references or a specific replacement rule:

- Search field
- Top navigation tab
- Pattern card
- Chat room row
- Filter chip
- Profile panel
- Empty/error card
- Dialog
- Toast
- Bottom sheet

### Pattern Card Geometry

`PatternCard` image radius and card geometry were reviewed through
`/design-gallery`. Keep the current `PatternCard` structure and existing
screen-level usage.

Do not add `imageRadius`, broad variants, or global card geometry changes in
this pass. Reconsider only if future design references require distinct card
types.

Reviewed card contexts:

- Home BEST horizontal cards
- Home NEW grid cards
- Pattern catalog cards
- Scrap cards
- Style feed cards
- Dark recommendation section cards

## Color Tokens

Use existing UFO tokens first.

Existing tokens:

- `ufo-bg`
- `ufo-surface`
- `ufo-text`
- `ufo-text-muted`
- `ufo-text-subtle`
- `ufo-text-secondary`
- `ufo-text-neutral`
- `ufo-text-dim`
- `ufo-border`
- `ufo-border-light`
- `ufo-brand`
- `ufo-brand-soft`
- `ufo-brand-pale`
- `ufo-credit`
- `ufo-kakao`
- `ufo-naver`
- `ufo-error`

Approved additions:

| Token | Use |
| --- | --- |
| `ufo-chat-unread` | Chat unread count badge |
| `ufo-chat-thumbnail` | Default chat-room thumbnail background |
| `ufo-divider` | Row and list dividers |

Token definitions in `tailwind.config.ts` and `src/app/globals.css` must stay
in sync.

## Layout

Use `MobileShell` for repeated mobile app surfaces.

Default shell:

- Outer background: `ufo-bg`
- Inner surface: `ufo-surface`
- Text color: `ufo-text`
- Width: `w-full max-w-[430px]`
- Alignment: centered
- Minimum height: screen height

Some screens, such as chat conversation, need a full-height flex variant. Keep
that behavior explicit rather than forcing every screen into the same markup.

## Typography

Use role-based typography instead of adding new arbitrary text sizes.

| Role | Direction |
| --- | --- |
| App title / top-bar title | `text-base font-semibold` |
| Section title | `text-xl font-bold tracking-tight` |
| Body | `text-sm` or `text-base` |
| Meta | `text-xs` or a narrowly scoped `text-[11px]` |
| Caption | `text-[10px]` or `text-[11px]` when design requires it |
| Badge | `text-xs font-semibold`; smaller badges may use `text-[10px]` |

Rules:

- Do not add new arbitrary sizes without a role-based reason.
- Keep small arbitrary sizes only when the component role is clear.
- Fix suspicious non-standard classes during implementation.
- Use negative tracking only when it matches the design hierarchy.

## State UI

Add a shared `StateBlock` for repeated loading, error, and empty states.

Proposed API:

```ts
type StateBlockProps = {
  type: "loading" | "error" | "empty";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "card" | "plain";
};
```

Variant intent:

- `card`: large page states such as profile, my page, and pattern detail
- `plain`: list-local states such as empty search results or empty messages

Do not force every state into the shared component immediately. Start with
states that already share the same structure.

Exception:

- The dark home recommendation surface may keep a local empty treatment because
  the default `StateBlock` card is designed for light surfaces. Keep this
  exception scoped to that dark recommendation surface unless a dedicated dark
  `StateBlock` variant is approved.

## Navigation

The main tab bar keeps these tabs:

- Home
- Patterns
- Styles
- Scraps

Do not add Community to the main `NavBar` in this pass.

## Icons

- Prefer reusable components under `src/components/icons`.
- Normalize icon size and color before changing behavior.
- Do not add an icon library without a separate review.
- If a library becomes useful, evaluate bundle size, license, tree-shaking, and
  fit with Next.js before adoption.

## Component Gallery Checklist

The visual gallery route is available at `/design-gallery`.

Before finalizing radius and PatternCard geometry, create a review gallery using
the provided design PNGs and current implementation screenshots.

Required checks:

- Component role
- Design reference file
- Current implementation file
- Current color tokens
- Current radius
- Current typography
- Proposed standard
- Decision status: approved, rejected, or deferred

## Verification

Every implementation pass must run:

```bash
npm run lint
npm run build
```

Manual visual checks should cover:

- `375px`
- `390px`
- `402px`
- `430px`
- Desktop width with centered mobile surface
