# [Bills list][Minor] Refresh button has no accessible name

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

The icon-only refresh control next to the "Bills" heading has no text
content, `aria-label`, or `title`, so assistive technology has no name to
announce for it.

## Why

`expected-behaviour.md` states: "Every control has an accessible name,
including icon-only buttons." This one has none.

## Preconditions

- Bills list page loaded.

## Steps to reproduce

1. Go to `#/`.
2. Take an accessibility snapshot, or inspect the button in DevTools.

## Actual

- Accessibility snapshot shows the element only as `button [ref=...]
  [cursor=pointer]` — no accessible name string, unlike every other control
  on the page.
- DOM: `<button class="icon-btn" data-testid="refresh"><svg aria-hidden="true"
  ...></svg></button>` — `textContent` is empty, `aria-label` is `null`,
  `title` is `null`.

## Expected

The button should have an accessible name describing its action, e.g.
`aria-label="Refresh bills"`.

## Reproducibility

Deterministic — confirmed via DOM inspection (`getAttribute('aria-label')`,
`getAttribute('title')`, `textContent`), not just visual impression.

## Impact

A screen-reader user cannot tell what this control does; it announces only
as "button" with no label.

## Evidence

- `browser_evaluate` result: `{"text":"","ariaLabel":null,"title":null,
  "outerHTML":"<button class=\"icon-btn\" data-testid=\"refresh\">..."}`.
- Screenshot: `docs/bills-list-refresh-button-no-label.png` — the icon-only
  control in question, next to "New bill" (visual only; the missing name is
  not something a screenshot can show by itself, see the DOM evidence above).
