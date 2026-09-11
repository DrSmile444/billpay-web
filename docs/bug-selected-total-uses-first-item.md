# [Bills list][Critical] Selected total sums each bill's first line item, not its amount

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

On the bills list, checking a bill's selection checkbox adds a number to the
"Selected" total footer. For a bill whose `amount` is not equal to its first
line item's `amount` (i.e. it has more than one line item, or its single item
has `quantity > 1`), the footer adds the **first line item's raw amount**
instead of the bill's total `amount`.

## Why

`expected-behaviour.md` states: "The selected total sums the amounts of the
selected bills." The amount of a bill is itself defined as "the sum of its
line items, each multiplied by its quantity." The footer does neither — it
reads only `items[0].amount`, ignoring quantity and any other line items.

## Preconditions

- Bill `Kyivenergo Utilities` (id `9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e`),
  amount **4 820,75 грн**, with two line items:
  - "Electricity, August" — amount 1 820.75, quantity 1
  - "Heating, August" — amount 1 500.00, quantity 2 (line value 3 000.00)
  - `1 820.75 + 3 000.00 = 4 820.75`, confirmed against the raw API response
    for `GET /api/bills`.

## Steps to reproduce

1. Go to `https://drsmile444.github.io/billpay-web/#/`.
2. Note the Kyivenergo Utilities row shows **4 820,75 грн**.
3. Check the checkbox for that row only.
4. Read the "Selected" footer.

## Actual

Footer shows `Selected: 1` and **1 820,75 грн** — the amount of the
"Electricity, August" line item alone, not the bill's 4 820,75 грн.

## Expected

Footer should show **4 820,75 грн**, matching the amount shown on the bill's
own row and the bill's `amount` field from the API.

## Reproducibility

2 of 2 — checked in isolation, and again as part of a multi-select sequence
(see `bug-selected-total-mixes-currencies.md`, where the same 1 820.75 value
appears as this bill's contribution to a 3-bill selection: `1 820.75 + 999.90
= 2 820.65`).

## Impact

Any user selecting bills to review or export a combined total sees a number
lower than what they actually owe whenever a selected bill has more than one
line item or a quantity greater than one. In a real deployment this could
understate what is due for payment.

## Evidence

- Snapshot of footer after selecting only Kyivenergo Utilities: `Selected: 1`
  / `1 820,75 грн`.
- API response for the bill (`GET /api/bills`) showing `amount: 4820.75` with
  the two items listed above.
- Screenshot: `docs/bills-list-selected-total-first-item-only.png`

## Not yet checked

- Whether the bill detail page's own "Total" row (which does reconcile
  correctly, see `bug-line-item-amount-not-extended.md`) uses the same or a
  different amount source than this list-page footer.
