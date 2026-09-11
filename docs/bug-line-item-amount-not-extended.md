# [Bill detail][Major] Line-item "Amount" column shows unit price, not the row's contribution to the total

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

On the bill detail page, the line-item table has columns "Description", "Qty",
"Amount". For a row with `quantity > 1`, the "Amount" cell shows the raw
per-unit price, not that row's contribution to the bill (`amount ×
quantity`). Summing the "Amount" column as displayed does not equal the Total
row shown directly below it.

## Why

`expected-behaviour.md` states: "The line-item table reconciles with the
total shown for the bill." A reader adding up the numbers printed in the
"Amount" column — the natural reading of a table with that header, next to a
"Qty" column and a "Total" footer row — gets a number that does not match the
Total.

## Preconditions

- Bill `Kyivenergo Utilities` (id `9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e`),
  items:
  - "Electricity, August" — Qty 1, Amount cell "1 820,75 грн"
  - "Heating, August" — Qty 2, Amount cell "1 500,00 грн"
  - Total row: "4 820,75 грн"

## Steps to reproduce

1. Go to `#/bills/9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e`.
2. Read the two line-item rows and the Total row.
3. Add the two "Amount" cells as printed.

## Actual

`1 820,75 + 1 500,00 = 3 320,75`, which does not equal the Total row's
`4 820,75`. The Total row is computed correctly from `amount × quantity`
internally (`1 820.75 + 1 500 × 2 = 4 820.75`), but the per-row cell the user
reads never reflects that multiplication.

## Expected

Either the "Amount" column should show each row's extended value
(`amount × quantity`, i.e. "3 000,00 грн" for the Heating row) so the column
sums to the Total, or the column should be relabelled (e.g. "Unit price") and
a separate "Line total" column added — so a reader can reconcile the table
without needing to multiply by hand.

## Reproducibility

2 of 2 (same fixture data, reloaded).

## Impact

A user manually checking that the itemisation adds up to the amount they are
being asked to pay cannot do so from what is printed on screen — the table
appears not to reconcile, undermining trust in the total even though the
total itself is correct.

## Evidence

- Snapshot showing the three rows and their cell text (see Actual).
- `GET /api/bills` response for this bill: `items:[{"amount":1820.75,
  "quantity":1},{"amount":1500,"quantity":2}]`, `"amount":4820.75`.
- Screenshot: `docs/bill-detail-line-items-reconciliation.png`
