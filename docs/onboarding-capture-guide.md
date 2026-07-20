# Onboarding Capture and Annotation Guide

## Purpose

This document defines how to prepare service screenshots for the UFO onboarding
flow when a slide needs to explain an exact button or UI control.

The onboarding must use static captures made from the real service UI. Do not
render live service pages behind onboarding copy. Static captures prevent API,
loading, personal-data, and interaction states from changing the onboarding
experience.

## Core Decision

Use a fixed-aspect-ratio capture canvas and render the complete image with
`object-contain` whenever an annotation must point to an exact control.

Do not use `object-cover` for annotated screenshots. Cropping changes with the
viewport height and can move the visible control away from its annotation.

```tsx
<div className="relative aspect-[430/932] w-full overflow-hidden bg-ufo-surface">
  <Image
    src={slide.imageSrc}
    alt=""
    fill
    sizes="(max-width: 430px) 100vw, 430px"
    className="object-contain"
  />
</div>
```

The screenshot canvas and annotation layer must be children of the same
positioned container.

## Capture Specification

- Reference viewport: `430 × 932px`
- Recommended Retina output: `860 × 1864px`
- Format: PNG for review and source preservation
- Browser zoom: 100%
- Device pixel ratio: consistent across all slides
- Theme: light only
- Data: stable mock data only
- Personal data: prohibited
- Loading, error, and transient toast states: prohibited unless the slide
  explicitly explains that state

Capture only after fonts and images finish loading.

## Annotation Coordinate Model

Store annotation geometry as percentages of the original screenshot canvas.
Never store viewport pixel coordinates.

```ts
type OnboardingAnnotation = {
  x: number;
  y: number;
  width: number;
  height: number;
  placement: "top" | "right" | "bottom" | "left";
  label: string;
};
```

Example:

```ts
const annotation = {
  x: 72,
  y: 11,
  width: 12,
  height: 6,
  placement: "bottom",
  label: "Open the pattern chat room here.",
} satisfies OnboardingAnnotation;
```

Render the focus area using the same percentages:

```tsx
<div
  className="absolute rounded-xl ring-4 ring-ufo-brand"
  style={{
    left: `${annotation.x}%`,
    top: `${annotation.y}%`,
    width: `${annotation.width}%`,
    height: `${annotation.height}%`,
  }}
/>
```

Percentage coordinates are calculated from the source capture:

```text
x (%)      = control left / capture width × 100
y (%)      = control top / capture height × 100
width (%)  = control width / capture width × 100
height (%) = control height / capture height × 100
```

## Overlay Structure

Use separate HTML layers instead of editing explanations into the PNG.

```text
Screenshot
→ dim overlay
→ clear spotlight around the target
→ target ring
→ connector or arrow
→ explanation bubble
→ onboarding navigation
```

Benefits:

- Korean copy remains sharp and accessible.
- Copy can change without regenerating the screenshot.
- Focus rings and bubbles can adapt to smaller screens.
- Screen readers can announce the explanation.

The highlighted control in the screenshot remains non-interactive. The
annotation explains the real service control but must not imitate a working
button.

## Spotlight and Explanation Rules

- Dim non-target areas enough to make the target obvious.
- Keep the target itself visible at close to its original brightness.
- Add `8–12px` of visual padding around the target control.
- Use `ufo-brand` for the focus ring.
- Use `ufo-surface` for a light explanation bubble.
- Keep explanation text to two or three short lines.
- Do not place a bubble over the highlighted control.
- Prefer a short connector line over a large decorative arrow.
- Keep onboarding navigation outside the screenshot annotation layer.

If the bubble cannot fit beside the target on a short screen, place the bubble
in a fixed explanation area below the screenshot instead of moving the focus
ring.

## Responsive Layout

The annotated screenshot must preserve its aspect ratio at every supported
width. Extra vertical space belongs to the explanation and navigation areas,
not to screenshot stretching or cropping.

Recommended structure:

```text
┌────────────────────────┐
│ UFO GUIDE              │
├────────────────────────┤
│ Fixed-ratio screenshot │
│ + focus annotation     │
├────────────────────────┤
│ Explanation            │
│ Progress / navigation  │
└────────────────────────┘
```

Validate each annotated slide at:

- `375px`
- `390px`
- `402px`
- `430px`
- A short viewport such as `375 × 667px`
- Desktop width with the `430px` mobile surface centered

The target ring must remain aligned with the same screenshot control at every
size.

## Capture Workflow

1. Prepare the real route with stable mock data.
2. Set the viewport to `430 × 932px`.
3. Wait for fonts and images to finish loading.
4. Capture the required service state.
5. Remove or replace personal and unstable data.
6. Save the source PNG under `public/onboarding/`.
7. Measure the target control against the original capture dimensions.
8. Record percentage-based geometry in onboarding slide data.
9. Add the HTML spotlight, connector, and explanation.
10. Verify all supported widths and the short viewport.

## Current Asset Replacement

The current onboarding background images are temporary. When replacing them
with real service captures:

- Keep filenames stable when possible to avoid unrelated code changes.
- Replace one slide at a time and verify its annotation immediately.
- Do not reuse screenshots containing real user profiles or chat messages.
- Update the slide's image alternative description when the visible service
  state changes.
- Add annotation metadata only after the final crop and capture dimensions are
  fixed.
