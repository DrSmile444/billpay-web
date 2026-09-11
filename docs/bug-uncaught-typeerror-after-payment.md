# [Pay][Major] Uncaught TypeError right after a successful payment

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/:id
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

Clicking "Pay" successfully moves the bill to `paid` and navigates to the
receipt page, but a `TypeError` is thrown to the console immediately after,
from the app's own bundle.

## Why

`expected-behaviour.md`, "Everything, everywhere": "No uncaught exceptions
in the console." This one fires on the normal, successful pay path — not an
edge case.

## Preconditions

- Any unpaid bill.

## Steps to reproduce

1. Open an unpaid bill's detail page.
2. Click "Pay ...".
3. Read the console after the receipt page loads.

## Actual

```
TypeError: Cannot read properties of undefined (reading 'toUpperCase')
    at https://drsmile444.github.io/billpay-web/assets/index-CiSFXZ69.js:11:33389
```

This appears roughly 400-450ms after the `[billpay] submitting payment ...`
log line, i.e. right as the pay response comes back and the receipt renders.

## Expected

No exception should reach the console on the successful payment path. If
some field is genuinely optional at that point (e.g. currency or status not
yet populated when the `.toUpperCase()` call runs), the code should guard
for it.

## Reproducibility

2 of 2 — reproduced paying two different bills (amounts 0.005 UAH and 75.5
UAH); identical stack trace both times.

## Impact

Indicates a real code path is dereferencing a value that can be undefined at
that point in the payment flow. The receipt still renders correctly in both
observed cases, so no visible breakage yet, but an uncaught exception on the
success path of the core "get paid" flow is a fragile place for one to exist.

## Evidence

- Console stack trace (above), captured via `browser_console_messages` on
  two separate payment attempts.
- A second, likely unrelated exception was also observed in the same
  console session, from anonymous (non-app) script: `TypeError: Cannot read
  properties of undefined (reading 'startTime') at et.reportAllChanges
  (<anonymous>:2:19429)`. Not yet attributed to the app bundle — noted here
  for completeness but not confirmed as an app defect.
- Screenshot: `docs/receipt-after-payment-console-issues.png` — the receipt
  page renders correctly despite the exception; the stack trace itself is
  console text, captured via `browser_console_messages`, not visible in a
  page screenshot.
