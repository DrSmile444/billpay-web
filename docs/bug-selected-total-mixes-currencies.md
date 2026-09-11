# [Bills list][Critical] Selected total adds USD and UAH amounts into one number

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

Selecting bills in different currencies adds their raw numeric amounts
together into a single figure, formatted and labelled as UAH (`грн`), instead
of keeping currencies separate.

## Why

`expected-behaviour.md` states: "Amounts in different currencies are not
added together into a single number." A number that silently combines UAH and
USD amounts under one currency label is meaningless and, in a real payment
context, dangerously misleading about how much is actually owed.

## Preconditions

- Bill `Kyivenergo Utilities` (UAH) and bill `Acme Cleaning ...` (UAH)
  already selected (see `bug-selected-total-uses-first-item.md` for the first
  part of this sequence — footer read `2 820,65 грн` for those two).
- Bill `Northwind Hosting`, id `2a7e5c10-88b4-4d2e-a9f1-7c6b5a4d3e2f`, amount
  **$1,234.50 (USD)**.

## Steps to reproduce

1. Go to `https://drsmile444.github.io/billpay-web/#/`.
2. Check "Kyivenergo Utilities" (UAH). Footer: `Selected: 1`, `1 820,65
   грн` region (see companion ticket for why this is already wrong).
3. Check "Acme Cleaning ..." (UAH). Footer: `Selected: 2`, `2 820,65 грн`.
4. Check "Northwind Hosting" (USD, `$1,234.50`).
5. Read the footer.

## Actual

Footer shows `Selected: 3` and **4 055,15 грн** — i.e. `2 820.65 + 1234.50 =
4055.15`, the USD amount added straight into the UAH-formatted total with no
separation, conversion, or warning.

## Expected

The three currencies present among selected bills should be shown as
distinct totals (e.g. one line per currency), never combined into a single
number under one currency symbol.

## Reproducibility

2 of 2 (repeated the 3-bill selection from a fresh page load; footer showed
`4 055,15 грн` both times).

## Impact

A user selecting bills across currencies is shown a single confident-looking
total that is not a real amount in any currency. If this number were used to
initiate a combined payment or export, it would misrepresent what is owed by
a wide margin (all of the USD amount, at face value, added into a UAH sum).

## Evidence

- Footer snapshot: `Selected: 3` / `4 055,15 грн`.
- Bill amounts from `GET /api/bills`: Kyivenergo 4820.75 UAH (see companion
  ticket for why only 1820.75 of it is counted), Acme 999.90 UAH, Northwind
  1234.50 USD.
- Screenshot: `docs/bills-list-selected-total-mixed-currency.png`
