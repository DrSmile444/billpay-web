# [New bill][Critical] Amount charged does not equal amount displayed for sub-kopeck input

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/new
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

The New bill form accepts an amount with more decimal places than the
currency's smallest unit allows (e.g. `0.005` for UAH, which only has kopecks,
two decimal places). The value is stored and later charged exactly as
entered, but every screen that shows it rounds it for display, so the
displayed amount and the actual amount differ.

## Why

`expected-behaviour.md` states: "The amount is a positive number in the
currency's smallest unit — the amount charged equals the amount displayed."
Here the charged amount (0.005) and the displayed amount (0.01) are not the
same number — a 100% relative difference on this bill.

## Preconditions

- New bill form reachable at `#/bills/new`.

## Steps to reproduce

1. Go to `#/bills/new`.
2. Fill Name = "Fraction Test", Email = "a@b.com", Amount = `0.005`,
   Currency = UAH.
3. Click "Create bill".
4. Read the line item, Total, and Pay button on the resulting bill detail
   page.
5. Compare against the raw API response for that bill.

## Actual

- Bill detail page shows the line item, the Total, and the Pay button all as
  **"0,01 грн"**.
- `GET /api/bills/:id` for the created bill returns `"amount":0.005,...
  "items":[{"amount":0.005,"quantity":1}]` — the real stored/charged value is
  0.005, not 0.01.
- Paying the bill logs (see `bug-console-logs-payment-details.md`) `[billpay]
  submitting payment a@b.com 0.005 UAH` — confirming 0.005 is what is actually
  submitted for payment — while the Pay button the user clicked read "Pay
  0,01 грн" and the receipt afterwards also reads "0,01 грн".

## Expected

Either the form should reject an amount with more precision than the
currency's smallest unit (reject `0.005` for UAH), or, if accepted, every
display of the amount (line item, total, Pay button, receipt) must show the
exact value that will be charged. Showing "0,01 грн" everywhere while
actually charging 0,005 грн breaks the "charged equals displayed" guarantee
outright.

## Reproducibility

2 of 2 — repeated with a second bill and a different fractional amount; same
rounding-without-adjusting-the-charge behaviour observed both times.

## Impact

A user is shown and told they are paying one amount while a different amount
is actually recorded as charged. In a real payment system this is a billing
integrity defect: statements, receipts, and reconciliation would not match
what was actually withdrawn.

## Evidence

- Bill id `a5253545-f684-4f80-8b6f-2ee6cf5b387b`: entered 0.005 UAH, API
  amount `0.005`, all UI surfaces read "0,01 грн".
- Console log line: `[billpay] submitting payment a@b.com 0.005 UAH`.
- Screenshot: `docs/bill-detail-amount-precision-mismatch.png`
