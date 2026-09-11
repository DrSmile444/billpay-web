# [Pay][Critical] Recipient email and payment amount are written to the console

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/:id
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

Clicking "Pay" on a bill logs a line to the browser console containing the
recipient's email address and the exact payment amount and currency.

## Why

`expected-behaviour.md`, "Everything, everywhere" section, states: "No
recipient details or payment amounts written to the console." This is
exactly that: `[billpay] submitting payment <email> <amount> <currency>`
fires on every payment.

## Preconditions

- Any unpaid bill.

## Steps to reproduce

1. Open an unpaid bill's detail page.
2. Open the browser console.
3. Click the "Pay ..." button.
4. Read the console output.

## Actual

Console shows, e.g.:

```
[LOG] [billpay] submitting payment a@b.com 0.005 UAH @ .../index-CiSFXZ69.js:10
[LOG] [billpay] submitting payment leak-repro@example.com 75.5 UAH @ .../index-CiSFXZ69.js:10
```

Both the recipient's real email and the precise amount being charged are
printed in plain text.

## Expected

No payment submission log line should include the recipient's email or the
amount. If a log line is needed for debugging, it should reference the bill
by id only, or be removed entirely in production builds.

## Reproducibility

2 of 2 — reproduced on two separate bills with two different
recipients/amounts, identical log format both times.

## Impact

Anyone with access to a user's browser console (a shared machine, a support
screen-share, a browser extension reading console output, a crash/log
aggregator that captures console output) can read who was paid and how much,
even though this data is never shown in any UI that requires elevated
permissions.

## Evidence

- Console log lines quoted above, captured via `browser_console_messages`.
- Also note: for the 0.005 UAH bill, the console log is the only place the
  *true* amount (0.005) appears — every UI surface shows the rounded 0.01,
  see `bug-amount-precision-display-mismatch.md`.
- Screenshot: `docs/receipt-after-payment-console-issues.png` — the receipt
  page as rendered immediately after the payment that produced the console
  log quoted above (a third reproduction: email `test@@nowhere`, amount 50
  UAH; the log itself is text, not visible in a page screenshot, and is
  captured via `browser_console_messages` instead).
