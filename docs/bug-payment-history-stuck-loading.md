# [Bill detail][Major] Payment history never leaves "Loading history…" after the request fails

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

`GET /api/bills/:id/history` always returns `500 Internal Server Error` (by
design of the mock fixture — this is the seeded scenario, not the defect).
The "Payment history" section on the bill detail page is supposed to react to
that failure. Instead it shows "Loading history…" indefinitely and never
changes.

## Why

`expected-behaviour.md` states: "The payment-history section either lists
previous payments or says that it could not load them. It does not wait
forever." Ten-plus seconds after the request has already failed (visible in
the console and network panel), the section still reads "Loading history…".

## Preconditions

- Any bill detail page (reproduced on `9d3f1b22-6c74-4a1f-9c8e-1f2a3b4c5d6e`
  and on freshly created bills).

## Steps to reproduce

1. Go to any `#/bills/:id` page.
2. Watch the "Payment history" section.
3. Wait at least 10 seconds after page load.

## Actual

- Network panel: `GET .../history` → `500` within ~200ms of page load.
- Console: `Failed to load resource: ... 500` and an `Error: Internal server
  error` thrown from the app bundle.
- "Payment history" section: still "Loading history…" after 10+ seconds, on
  every bill checked.

## Expected

Once the request settles (fails), the section should show either a list of
payments or an explicit "could not load payment history" message — never an
indefinite loading state.

## Reproducibility

2 of 2 (fresh page load each time, waited 10s both times).

## Impact

A user checking whether a bill has prior payment activity gets no answer at
all and no indication that anything went wrong — the UI looks frozen rather
than failed.

## Evidence

- Console log: `[ERROR] Failed to load resource: the server responded with a
  status of 500 (Internal Server Error) @ .../history:0` followed by `Error:
  Internal server error at A (.../index-CiSFXZ69.js:11:24021)`.
- Screenshot: `docs/bill-detail-history-stuck-loading.png`.
