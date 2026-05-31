# Olive Apps Design Language

**Audience:** future Claude sessions building any user app via Olive, and
any human extending one of them.
**Status:** canonical. If you are writing UI for a deployed Olive app, read
this before opening a `.tsx` file.

> **Process — read before any UI implementation.** Apps that follow this
> document feel like Olive built them. Apps that do not, do not ship. The
> compliance check is not aesthetic preference; it is a structural one. A
> reader who lands on a generated Olive app should feel they are reading a
> single editorial publication with many issues, not a portfolio of
> unrelated React projects. Walk *Typography*, *Color*, *Components*, and
> *What Never Gets Used* against any new surface before writing JSX.

---

## What this is

This is the design language Claude follows when building any user app via
Olive. It is a sibling document to `olive-ios-app/OLIVE_DESIGN_LANGUAGE.md`
— the same editorial register, the same restraint, the same single warm
accent — adapted from SwiftUI to the web stack the template ships on
(Next.js 16, React 19, Tailwind v4, plain CSS variables).

The template at `github.com/olive-apps/template-next-firestore` wires the
fonts, the CSS variables, the dark-mode flip, and the Material Symbols
stylesheet. You do not re-import them, you do not redefine the palette, you
do not pick a different serif because the spec said "modern." Inherit the
system; spend your effort on the surface the PRD actually describes.

The accompanying `CLAUDE.md` in the template root governs editor behavior
(commit prefixes, TypeScript strictness, dependency discipline, the "Olive
is thinking" latency framing). This file governs what gets rendered. They
complement each other; do not duplicate one inside the other.

---

## The Thesis

Olive is not a generic site generator. Every Olive app is a small editorial
artifact — a tool the user voice-ideated into existence, then shipped. The
visual register borrows from a serious newspaper (NYT, The Economist, the
LRB) not as a stylistic flourish, but because the editorial tradition
already solved the problems that matter: hierarchy through typography
instead of boxes, restraint through whitespace, warmth through a single
consistent accent, and a voice that trusts the reader.

If a screen does not feel like it belongs in that tradition, it is wrong.
A SaaS landing-page surface with hero gradients and bold display weights
is wrong. A dashboard with cards-and-shadows is wrong. A "modern minimal"
sans-serif with chunky display titles is wrong. The right register is
quiet, serif, set against generous whitespace.

---

## Voice

Editorial register applies to every visible string the app renders. This
extends `CLAUDE.md` — the rules below are about what gets *seen*, not
what gets *committed*.

1. **Third register, not second.** Address the reader as a reader, not as
   "you." Write "Tap to begin," not "Tap below to begin your journey."
   Write "A small note," not "Your small note." This is the same register
   the New Yorker uses for a caption: descriptive, restrained, not
   performative.
2. **Olive is "Olive," never "it."** When the surface names the latency
   ("Olive is thinking."), it spells the name; it does not refer to the
   thing as an "AI assistant" or "the model."
3. **Never refer to Olive in product copy other than the latency line.**
   No "powered by Olive," no "Olive built this," no "ask Olive." The user
   knows where the app came from. The app is the user's now.
4. **No marketing voice.** No exclamation points. No "Welcome!". No "Let's
   get started." No "easy," "simple," "just," "seamless," "powerful,"
   "intuitive," "effortless." If a sentence could appear on a SaaS
   landing page, rewrite it.
5. **Captions, not tooltips.** Microcopy under a control should name the
   *why*, not the *what*. A toggle labeled "Public" does not need a
   caption that says "Make this public." It needs a caption that says
   "Visible to anyone with the link."
6. **Name the stakes when they exist.** If turning something off deletes
   data, say so in the caption. Warmth is not vagueness.

---

## The Roles

Three font families and one icon set. Each one has a defined role; reusing
a face outside its role breaks the register.

| Family                       | Role                                                |
| ---------------------------- | --------------------------------------------------- |
| **Fraunces**                 | Titles, headlines, editorial pull-quotes, mastheads |
| **Inter**                    | Body copy, captions, navigation labels, controls    |
| **JetBrains Mono**           | Inline code, code blocks, terminal output           |
| **Material Symbols Outlined**| Icons (single weight, single style — see Icons)     |

All three fonts are served from `fonts.googleapis.com` via Next.js's
`next/font/google` loader. No font binaries vendored in the repo; the
template wires them once and exposes them through CSS variables
(`--font-serif`, `--font-sans`, `--font-mono`). You do not import them
again per-component.

**Why Fraunces.** Fraunces is a variable font with an optical-size axis
(opsz 9–144) and a soft axis. Set body-size headlines (≤ 28px) at small
opsz so the type stays optically open; set display-size headlines (≥ 48px)
at large opsz so the serifs gain their full character at scale. This is
the modern descendent of what New York's optical scaling gives the iOS
app, and it is the closest free analogue to the editorial faces (Cheltenham,
Imperial, Mercury) that newspaper typography is built on.

**Why Inter.** Inter pairs with serif at body scale without competing.
Roboto and SF Pro are too geometric (they read as "system"). Source Sans
is fine but reads as workmanlike. Inter sits exactly where a body face
should — neutral, well-hinted, calm at small sizes.

**Why JetBrains Mono.** Code wants a monospace with editorial weight, not
a terminal aesthetic. JetBrains Mono carries a small amount of serif
warmth (it is genuinely well-drawn) and aligns visually with Fraunces +
Inter in a way Menlo or Fira Code do not.

**Why Material Symbols Outlined.** Outlined is the lightest of the three
Material styles (Outlined / Rounded / Sharp). It reads as drawn, not
stamped — the way an editorial linework illustration would read against
serif body text. Material Symbols is a variable font, so a single
stylesheet load gives you the full glyph table at any weight, fill, grade,
and optical size — but discipline matters: pick one weight (400) and one
fill (0) by default. Reaching for fill: 1 on the seventh icon turns the
page into a junk drawer.

---

## Typography

### Scale

The base size is configurable across five user-pickable steps (XS / S / M
/ L / XL), wired to `--font-size-base` on `<html>` via a
`data-font-size` attribute. The default is **M (16px)**. The chooser is
optional — only render it when the PRD calls for prolonged reading (a
long-form reader, a notes app, anything where the reader will sit with
text for ≥ 5 minutes).

```css
:root              { --font-size-base: 16px; } /* M, default */
[data-font-size="xs"] { --font-size-base: 14px; }
[data-font-size="s"]  { --font-size-base: 15px; }
[data-font-size="m"]  { --font-size-base: 16px; }
[data-font-size="l"]  { --font-size-base: 17px; }
[data-font-size="xl"] { --font-size-base: 19px; }
```

All sized type is expressed via `rem` (relative to `--font-size-base` set
on `<html>`'s `font-size`). The ramp below is what the template ships;
deviate only when the surface genuinely needs a new register, and add a
note in the surface file when you do.

| Role             | Size                                 | Family    | Weight        | Notes                                  |
| ---------------- | ------------------------------------ | --------- | ------------- | -------------------------------------- |
| Masthead         | `clamp(2.5rem, 6vw, 4rem)`           | Fraunces  | 600           | opsz large; tracking `-0.02em`         |
| H1 (page title)  | `clamp(1.875rem, 4vw, 2.5rem)`       | Fraunces  | 600           | opsz medium; tracking `-0.015em`       |
| H2 (section)     | `clamp(1.375rem, 2.5vw, 1.75rem)`    | Fraunces  | 600           | opsz medium                            |
| H3 (sub)         | `1.125rem`                           | Fraunces  | 600           | opsz small                             |
| Dek (italic)     | `1rem`                               | Fraunces  | 400 italic    | muted ink; sits below an H1/H2         |
| Body             | `1rem`                               | Inter     | 400           | line-height 1.6                        |
| Body small       | `0.9375rem`                          | Inter     | 400           | captions, dense rows                   |
| Caption          | `0.8125rem`                          | Inter     | 400           | muted ink                              |
| Eyebrow          | `0.6875rem`                          | Inter     | 700           | uppercase, tracking `0.12em`           |
| Code (inline)    | `0.9em`                              | JetBrains | 400           | rendered against a faint paper tint    |
| Code (block)     | `0.875rem`                           | JetBrains | 400           | line-height 1.55                       |

### Rules

- **No chunky display weights.** Never use Fraunces above 700. The serif
  drops its editorial character above semibold and starts to read as a
  poster headline. The masthead can go semibold (600), nothing else needs
  to.
- **Italic is semantic.** Fraunces italic is for *deks* (the italic line
  beneath a headline that names the why) and for editorial asides ("a
  small aside, in passing"). It is not for emphasis-within-body. To
  emphasize a word inside body copy, use `<strong>` (Inter 600), not
  `<em>` in serif.
- **Tracking is part of the type.** Eyebrows get `letter-spacing: 0.12em`
  + uppercase + small size; without the tracking they read as labels, not
  as eyebrows. Display headlines get slight negative tracking
  (`-0.02em`); without it the serifs feel too airy.
- **Line-height.** Body Inter at 1.6. Serif headlines at 1.2 (they have
  their own internal spacing; 1.6 makes them look like a paragraph).
  JetBrains Mono code blocks at 1.55.
- **`clamp()` is for any display-size text the layout might shrink.**
  Headlines on mobile must not blow out the viewport. Use
  `clamp(min, vw, max)` for H1 / H2 / masthead so the type breathes from
  phone to desktop without hand-tuned breakpoint overrides.
- **No system text styles.** Do not use Tailwind's default `text-3xl` /
  `text-4xl` etc. without specifying the font-family. The defaults are
  sans-serif; reaching for them silently swaps the register.

### Headline ramps (worked examples)

A page-title surface:

```tsx
<header className="space-y-2">
  <p className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-olive-gold">
    Section
  </p>
  <h1 className="font-serif text-4xl font-semibold leading-tight tracking-[-0.015em]">
    The thing this page is
  </h1>
  <p className="font-serif text-base italic text-ink-muted">
    The one sentence that names why the page exists.
  </p>
</header>
```

A section header inside a long page:

```tsx
<header className="mt-12 border-t border-hairline pt-8 space-y-1">
  <p className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-olive-gold">
    II
  </p>
  <h2 className="font-serif text-2xl font-semibold leading-tight">
    The section's name
  </h2>
</header>
```

---

## Color

The palette is intentionally small.

| Token                | Light                            | Dark                              | Role                                       |
| -------------------- | -------------------------------- | --------------------------------- | ------------------------------------------ |
| `--ink`              | `#1A1A1A`                        | `#EDE9DD`                         | Headlines, body, anything to read first    |
| `--paper`            | `#F7F5EF`                        | `#13110D`                         | Page background — never anything else      |
| `--ink-muted`        | computed via `color-mix`         | computed via `color-mix`          | Deks, captions, secondary text             |
| `--olive-gold`       | `#B5944F`                        | `#B5944F`                         | The single warm accent                     |
| `--hairline`         | `rgba(0, 0, 0, 0.08)`            | `rgba(255, 255, 255, 0.08)`       | Section dividers; never fills              |

`--ink-muted` is computed:

```css
--ink-muted: color-mix(in oklab, var(--ink) 65%, var(--paper) 35%);
```

so the muted ink stays calibrated to whichever mode the page is in, with
no per-mode override.

### The oliveGold discipline

`--olive-gold` is the signature of the publication. It is NYT's color —
warm, restrained, unmistakable once you know it. **It is not a decoration
color.** It earns its place only on:

1. **Section eyebrows** (the tracked uppercase category labels above an
   H1/H2).
2. **The gold editorial stamp on primary CTAs** — the `<Stamp>` component
   below.
3. **Link underline-on-hover** — a default anchor is body color; the
   underline appears in olive-gold on hover/focus.
4. **Focus rings** — keyboard `:focus-visible` rings are 2px olive-gold,
   no shadow.
5. **The single warmest word in a standfirst** — the one phrase you want
   the eye to land on, used at most once per surface.
6. **Active state on a tab strip or toggle** — the underline beneath the
   active label.

That is the full list. If you are reaching for olive-gold to "add color,"
stop. The app earns its warmth from the *scarcity* of the accent, not the
quantity. NEVER as a fill behind body text. NEVER as a "branded"
background block on a hero. NEVER as a button-fill on more than one
button per surface.

### Muted ink discipline

`--ink-muted` is for deks, captions, byline metadata, and "secondary" text
that needs to recede. It is not a free-form gray. Specifically:

- It is not used for body copy. Body is `--ink`.
- It is not used for placeholder text in inputs. Placeholders get
  `color-mix(in oklab, var(--ink) 40%, var(--paper) 60%)` inline.
- It is not used for icons. Icons inherit `currentColor` from their
  parent (typically `--ink`).

### Hairline discipline

`--hairline` is the divider color. It is used as a 1px border between
sections, as the underline on an active tab, as the rule beneath a
masthead. It is **never** used as a fill (no "hairline boxes" — that's
cards with extra steps).

---

## Light / Dark Mode

Default behavior: respect `prefers-color-scheme`. The template's
`globals.css` flips every CSS variable via a `@media (prefers-color-scheme:
dark)` block. Any component that consumes the variables automatically
re-skins; you do not write per-mode component code.

A user toggle is allowed when the app's PRD calls for explicit theme
control (reading apps, anything used in mixed lighting). The toggle sets
`data-theme="dark"` or `data-theme="light"` on `<html>`, which the CSS
variable cascade prefers over the media query. The template ships an
inline `<script>` in `<head>` that reads `localStorage.theme` and applies
the attribute before paint, so the page never flashes the wrong mode on
load.

Implementation contract (already wired in `layout.tsx`):

```html
<script dangerouslySetInnerHTML={{__html: `
  try {
    const t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
`}} />
```

When you render the toggle, write to `localStorage.theme` and set the
attribute on `<html>` synchronously. Do not animate the transition — the
flip is instantaneous, like flipping a light switch.

---

## Icons

Single source: **Material Symbols Outlined**, served as a variable font
from `fonts.googleapis.com/icon?family=Material+Symbols+Outlined`. The
stylesheet is loaded once in `layout.tsx`'s `<head>`; you do not load it
per-component, you do not load any other icon library.

### Defaults

```css
.material-symbols-outlined {
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}
```

- **FILL 0** — outlined glyphs. The default.
- **wght 400** — regular weight. The default.
- **opsz 24** — optical size matched to the 24px display size you
  typically render at.

### Usage

```tsx
<span className="material-symbols-outlined">arrow_outward</span>
```

The glyph name (`arrow_outward`, `north_east`, `close`, `menu`,
`expand_more`, `chevron_right`, `format_quote`, etc.) is the literal
ligature. Look them up at
`https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Outlined`.

### Discipline

- **Single weight default.** Use 400 everywhere. Reach for `wght 600`
  only when a glyph is the *one* anchor of a hero surface (you will
  rarely do this).
- **Outlined only.** Never mix Outlined with Rounded or Sharp on the same
  page. The mix reads as inconsistency.
- **FILL 0 by default.** Reach for FILL 1 only when the glyph encodes an
  *active state* — a starred item, a checked checkbox, a played media
  state. The fill is a state marker, not a style choice.
- **Inherit color.** Icons get their color from `currentColor` (so they
  match the surrounding text). Set `color: var(--olive-gold)` only on
  icons that genuinely mark an active or interactive state.
- **Never emoji.** Not in copy, not in placeholder strings, not in error
  messages, not in commit messages, not in code comments. The icon font
  is the only glyph source.

### Glyph register (defaults to reach for first)

- `north_east` / `arrow_outward` — "this opens another surface or external
  link." The editorial equivalent of a chevron.
- `close` — close buttons. Always at FILL 0, weight 400.
- `chevron_right` — list-row affordance.
- `expand_more` / `expand_less` — collapsible sections.
- `format_quote` — pulled-quote marker. Use sparingly.
- `more_horiz` — overflow menu trigger.

---

## Layout & Spacing

- **Horizontal padding.** Mobile: 24px. Desktop: 48px. The template's
  root layout wraps `<main>` at `max-w-2xl mx-auto px-6 lg:px-12` for
  reading surfaces; tool surfaces (dashboards, editors) can extend to
  `max-w-4xl` or `max-w-6xl`. Wider than that and the line length breaks
  the reading register.
- **Vertical rhythm.** Tailwind's spacing scale (`space-y-4` = 1rem,
  `space-y-8` = 2rem, `space-y-12` = 3rem) is the baseline grid. Use
  `space-y-8` between sections by default; `space-y-12` between major
  blocks; `space-y-4` between adjacent rows inside a section.
- **Hairlines, not boxes.** Sections are separated by `border-t
  border-hairline pt-8`. Not by background-color blocks. Not by drop
  shadows. The hairline does the visual work; the whitespace does the
  rest.
- **No rounded cards.** Cards-with-shadows is the SaaS register Olive
  apps rejects. If you need to group rows, separate them with hairlines
  or use the editorial list pattern below.
- **Generous whitespace.** When in doubt, double the gap. The newspaper
  comparison holds — a serious column has more leading and more margin
  than a webapp does.

---

## Responsive

Tailwind v4's default breakpoints, matched to what the template ships:

| Token  | Width    | When                                       |
| ------ | -------- | ------------------------------------------ |
| `sm:`  | ≥ 640px  | Large phone / small tablet                 |
| `md:`  | ≥ 768px  | Tablet                                     |
| `lg:`  | ≥ 1024px | Small desktop                              |
| `xl:`  | ≥ 1280px | Wide desktop                               |

### Mobile-first rules

- **Stack by default.** Two-column desktop layouts collapse to a single
  column under `md:`. Don't write a horizontal layout and then "fix it"
  for mobile — start mobile and add `md:flex md:flex-row` to escalate.
- **Reduce display sizes proportionally.** All display-size headlines
  use `clamp()` so they shrink with viewport width automatically. Do not
  write `text-5xl md:text-4xl` — write `clamp(...)`.
- **Touch targets ≥ 44px tall.** Buttons, links inside dense rows, any
  interactive element. The template's `<Stamp>` ships with `py-3`
  (24px) plus the line-height of its 14px label, hitting 44px exactly.
- **Edge-to-edge images on mobile, contained on desktop.** Images that
  span the column width on phone should have horizontal padding on
  desktop so they don't visually outweigh the column.

---

## Components

The template seeds a small set of example implementations under
`src/components/`. They are *seeds*, not a UI library. Each one is
short enough that Claude can paste the shape verbatim into a new file
when a surface needs a variation; do not import them as if they were
shadcn primitives. The shape matters more than the file.

### `<EditorialHeader>`

Every page surface gets an editorial header. The shape is: optional
eyebrow → H1 → optional italic dek. The header closes with a single
hairline rule.

```tsx
import { EditorialHeader } from "@/components/EditorialHeader";

<EditorialHeader
  eyebrow="Section"
  title="The page's name"
  dek="The one sentence that names why this page exists."
/>
```

Renders:

```
SECTION
The page's name
The one sentence that names why this page exists.
─────────────────────────────────────────
```

The hairline is drawn by a `border-b border-hairline pb-6 mb-8` on the
header's container.

### `<Stamp>`

The gold editorial stamp on a primary CTA. Echoes the iOS
`EditorialStampLabel`. Use it for the *one* primary action per surface —
the submit on a form, the call-to-action on a landing card, the "next"
on a multi-step flow.

```tsx
import { Stamp } from "@/components/Stamp";

<Stamp type="submit">SAVE</Stamp>
<Stamp as="link" href="/somewhere">CONTINUE</Stamp>
```

Renders as a rectangle (no rounded corners), olive-gold background, paper
text, tracked uppercase 12px Inter bold. No shadow. No gradient. No
hover-glow. The hover state is a 1.0 → 0.92 opacity dip — quiet, not
performative.

Secondary actions next to a Stamp use a `<button>` with hairline border,
no fill, ink-muted text:

```tsx
<button className="border border-hairline px-4 py-3 text-sm uppercase tracking-[0.12em] text-ink-muted hover:text-ink">
  CANCEL
</button>
```

### `<Eyebrow>`

The tracked uppercase category label above an H1/H2. Olive-gold by default
because that is the one place the accent earns its keep on every surface.

```tsx
import { Eyebrow } from "@/components/Eyebrow";

<Eyebrow>Section</Eyebrow>
```

### `<Dek>`

The italic serif line beneath a headline that names the why. Always
serif, always italic, always muted ink.

```tsx
import { Dek } from "@/components/Dek";

<Dek>The one sentence that names why this page exists.</Dek>
```

### `<EditorialList>` (pattern, not a component)

A list of rows separated by hairlines, no card backgrounds. Render
inline; do not import a `<ListItem>` primitive.

```tsx
<ul className="divide-y divide-hairline">
  {items.map(item => (
    <li key={item.id} className="py-4">
      <h3 className="font-serif text-lg">{item.title}</h3>
      <p className="font-serif italic text-sm text-ink-muted">{item.dek}</p>
    </li>
  ))}
</ul>
```

If the row is a navigation target, wrap it in a `<a>` and put the
`arrow_outward` material symbol in the trailing corner. No chevron — the
arrow is the editorial equivalent and works in any direction.

### `<FontSizeChooser>` (only when prolonged-reading is in the PRD)

A five-tab segmented control wired to `data-font-size` on `<html>`.
Default is M; the chooser persists the selection to `localStorage`. Render
it in a settings sub-page or in a small affordance near the top of a
long reading surface. Do not render it by default — most apps do not
need it.

```tsx
const sizes = ["xs", "s", "m", "l", "xl"] as const;

export function FontSizeChooser() {
  const [size, setSize] = useState<typeof sizes[number]>("m");

  useEffect(() => {
    const stored = localStorage.getItem("fontSize");
    if (stored && (sizes as readonly string[]).includes(stored)) {
      setSize(stored as typeof sizes[number]);
      document.documentElement.setAttribute("data-font-size", stored);
    }
  }, []);

  function pick(next: typeof sizes[number]) {
    setSize(next);
    document.documentElement.setAttribute("data-font-size", next);
    localStorage.setItem("fontSize", next);
  }

  return (
    <div className="flex gap-2 text-xs uppercase tracking-[0.12em]">
      {sizes.map(s => (
        <button
          key={s}
          onClick={() => pick(s)}
          className={s === size ? "text-olive-gold" : "text-ink-muted"}
        >
          {s.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

---

## Forms and Inputs

Native `<input>`, `<textarea>`, `<select>` elements — styled editorially,
not replaced with custom widgets. The native elements ship with
accessibility, mobile-input quirks, and assistive-tech support that custom
implementations re-implement badly.

```tsx
<label className="block space-y-1">
  <span className="font-sans text-xs uppercase tracking-[0.12em] text-ink-muted">
    Title
  </span>
  <input
    type="text"
    className="w-full border-b border-hairline bg-transparent py-2 font-serif text-lg outline-none focus:border-olive-gold"
  />
</label>
```

Rules:

- **Hairline underlines, not boxed inputs.** A `border-b` is the
  editorial register; a `border` (full box) reads as a form-fill SaaS
  surface.
- **No placeholder text as label.** Always render a label above. The
  placeholder is for the *example* of what to type, not the field name.
- **Focus is olive-gold.** Underline darkens to `--olive-gold` on focus.
  No glow, no shadow.
- **Errors are sentences.** Below the input, in italic serif at muted
  ink: "That email is already in use here. Try signing in." Not "Invalid
  email format" or a red exclamation triangle.

---

## Empty States

There is no "No data," "No results found," or "Nothing here yet." If a
collection is empty, render a sentence in serif that explains what will
appear once the relevant action happens.

A correct empty state names the action and the future state:

> Notes you save will appear here.

A wrong empty state names the absence:

> No notes yet.

The first is editorial; the second is administrative. Always the first.

---

## Latency

This is load-bearing. **Never write "Loading…" anywhere in the app. Never
render a spinner. Never render a progress bar.**

When the app is waiting on Firestore, on a Server Action, on anything at
all — the user-facing surface either:

1. Shows a quiet ellipsis ("…") on its own line in serif at muted ink, OR
2. Shows the phrase **"Olive is thinking."** verbatim. This is the one
   acceptable place to name Olive in the surface, because it frames the
   wait as consideration, not loading.

Either is fine. A spinner is not. A progress bar is not. A skeleton
shimmer is not. The wait is a moment of consideration; do not paper over
it with motion.

```tsx
{isLoading ? (
  <p className="font-serif italic text-ink-muted">Olive is thinking.</p>
) : (
  <ResultsList items={items} />
)}
```

---

## Errors

Server Actions and route handlers can fail. When they do, the surface
should:

- Show one sentence in serif italic at muted ink that names what didn't
  happen and what the reader can do.
- Not show a stack trace. Not show an error code. Not show a red box.
- Use a plain `<p>` or the editorial card pattern — never an alert
  pattern lifted from a UI library.

```tsx
<p className="font-serif italic text-ink-muted">
  The note didn't save. Tap again, or come back in a moment.
</p>
```

---

## What Never Gets Used

- Emoji. Ever. Not in copy, not in placeholder strings, not in error
  messages, not in commit messages, not in code comments. Use Material
  Symbols.
- AI-generated images. No DALL-E, no Imagen, no Stable Diffusion calls,
  no generated illustrations rendered into the surface. If the PRD calls
  for imagery, use a real photograph or omit the image.
- Custom SVG art Claude tries to draw inline. If the surface needs a
  diagram, render it from data (a real chart from real numbers); do not
  hand-write decorative SVG.
- Rounded card backgrounds with shadows. The card-and-shadow register is
  SaaS; the Olive register is hairlines.
- System buttons/toggles/pickers styled to look custom. Use bare
  `<button>`, `<input type="checkbox">`, `<input type="radio">`,
  `<select>` styled editorially.
- Gradient backgrounds. Ever. Not radial, not linear, not "subtle." The
  page background is `--paper`, full stop.
- Chunky display weights above 700. Fraunces tops out at 600 for
  headlines.
- "Loading…" copy. See *Latency* above.
- Hover-glow on CTAs. The Stamp's hover state is an opacity dip;
  everything else is `cursor: pointer` and a slight color shift.
- Hero gradients. There is no hero. There is a masthead and there is
  content.
- Multi-color underlines or rainbow icons. SF/Material Symbols render in
  `--ink` or `--olive-gold`, never else.
- "Made with Olive" badges. The app stands alone.

---

## A surface, end to end

A worked example — what the home page of a generated app should look like
when the design system is being followed:

```tsx
import { EditorialHeader } from "@/components/EditorialHeader";
import { Stamp } from "@/components/Stamp";

export default function HomePage() {
  return (
    <article className="space-y-12">
      <EditorialHeader
        eyebrow="Today"
        title="A small new app."
        dek="The shape of this page will become specific as the first note lands."
      />

      <section className="space-y-6">
        <p className="font-sans text-base leading-relaxed">
          This page is the starting point. Soon it will be the thing it
          should be — drawn from the conversation that built it.
        </p>

        <div className="flex items-center gap-4">
          <Stamp as="link" href="/new">
            BEGIN
          </Stamp>
          <a
            href="#about"
            className="font-sans text-sm text-ink-muted underline decoration-transparent underline-offset-4 hover:decoration-olive-gold"
          >
            About this <span className="material-symbols-outlined align-middle text-[1em]">arrow_outward</span>
          </a>
        </div>
      </section>

      <section className="border-t border-hairline pt-8 space-y-4">
        <p className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-olive-gold">
          II
        </p>
        <h2 className="font-serif text-2xl font-semibold">
          A small section
        </h2>
        <p className="font-serif italic text-ink-muted">
          The dek that names why this section is here.
        </p>
        <p className="font-sans text-base leading-relaxed">
          The first paragraph of body content. Sets the situation, the
          complication, then resolves.
        </p>
      </section>
    </article>
  );
}
```

What this surface gets right: serif H1 with eyebrow + italic dek, body in
Inter, single olive-gold accent on the eyebrow + the stamp, hairline
divider between sections, Material Symbols icon for the "open" link,
generous whitespace, no rounded cards, no gradients, no spinners, no
exclamation points.

---

## When You're About to Break a Rule

Rules exist because the app breaks if every surface invents its own
voice. If you think you need to break one:

1. **Ask the user first.** This doc is canonical; the user is more
   canonical.
2. If you still need to deviate, document the exception in the same file
   as the deviating surface, including *why*. The next session needs to
   know whether the rule or the exception is the load-bearing part.
3. If the exception repeats across surfaces, it is no longer an exception
   — it is a new rule. Update this doc.

---

## How Claude reads this

This document is fetched two ways:

1. **By the build Routine** — `olive-build-pickup-code` (in
   `olive-mcp-server/src/prompts/routinePrompts.ts`) instructs Claude to
   `curl` this file from
   `https://raw.githubusercontent.com/olive-apps/template-next-firestore/main/OLIVE_APPS_DESIGN_LANGUAGE.md`
   before writing any UI. The fetch happens once per build session.
2. **By any Claude Code session** — call the MCP tool
   `olive_get_apps_design_guide` (no arguments). The tool returns the
   same content with a small in-memory cache; the source-of-truth is
   always this file in this repo.

When this document changes, the next routine tick on every user picks up
the new version. No re-deploy, no migration, no per-app prompt update.
The single source of truth is here.
