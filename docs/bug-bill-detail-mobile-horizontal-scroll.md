# [Bill detail][Major] Page requires horizontal scrolling at 375px width

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP), viewport 375×812
- Date tested: 2026-09-11

## What

At a 375px-wide viewport, the bill detail page's document is 518px wide,
143px wider than the viewport, causing horizontal scrolling.

## Why

`expected-behaviour.md` states: "The interface is usable at 375px wide
without horizontal scrolling." Measured with
`document.documentElement.scrollWidth` vs `clientWidth`, this is violated.

## Preconditions

- Any bill detail page, viewport resized to 375×812 (mobile width).

## Steps to reproduce

1. Go to `#/bills/9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e`.
2. Resize the viewport to 375×812.
3. Read `document.documentElement.scrollWidth` and `.clientWidth`.

## Actual

- `scrollWidth: 518`, `clientWidth: 375`.
- Root cause, found by walking the DOM for the widest offending elements: the
  `.btn-pay` button ("Pay 4 820,75 грн") has a computed `min-width: 420px`
  and `width: 420px` — wider than the entire viewport — inside a `.row`
  flex container with `flex-wrap: nowrap`.

## Expected

No element should carry a `min-width` wider than the viewport at 375px; the
Pay button and its sibling "Back to bills" link should fit within, or wrap
within, 375px with no horizontal scroll.

## Reproducibility

2 of 2 (measured on two separate loads of the same page).

## Impact

Mobile users must scroll sideways to see or reach parts of the bill detail
page, including potentially the Pay button itself depending on scroll
position — a usability defect on the platform's primary payment screen.

## Evidence

- Measurements above via `browser_evaluate` (`getBoundingClientRect`,
  `getComputedStyle`).
- Screenshot: `docs/bill-detail-375px-horizontal-overflow.png`.
