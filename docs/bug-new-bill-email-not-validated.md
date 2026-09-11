# [New bill][Major] Recipient email accepts any text, not just valid addresses

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/new
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

The New bill form checks that Email is *present* (an empty field is
rejected with "Email is required"), but never checks that it is a
syntactically valid address. Any non-empty string is accepted and the bill
is created.

## Why

`expected-behaviour.md` states: "The email must be a syntactically valid
address." No format check is applied at all — only a required-field check.

## Preconditions

- New bill form reachable at `#/bills/new`.

## Steps to reproduce

1. Go to `#/bills/new`.
2. Fill Name = "Test Recipient", Email = `not-an-email`, Amount = `100`.
3. Click "Create bill".

## Actual

The bill is created (`POST /api/bills` → `201 Created`) and navigates
straight to its detail page, showing `Email: not-an-email` under Recipient.
No validation message is ever shown for the Email field in this case.

## Expected

Submitting a syntactically invalid email (no `@`, no domain, etc.) should be
blocked client-side the same way an empty email or a non-positive amount is,
with a message such as "Enter a valid email address".

## Reproducibility

2 of 2, with two different invalid strings:

- `not-an-email` → bill `a332b09c-50d3-4778-bb43-5fbe43fa6d05` created.
- `test@@nowhere` → bill `9d475b68-bd17-4643-80c2-1454cbe06e11` created (this
  attempt also had the Amount field showing a validation error for a
  different reason at first; once Amount was corrected, the invalid email
  still produced no error and the bill was created).

## Impact

Bills can be created with recipient contact information that cannot receive
a receipt or notification, silently breaking any downstream email-based
communication for that bill.

## Evidence

- Bill detail snapshot for `not-an-email`: `Email` definition text is exactly
  `not-an-email`.
- Network: `POST /api/bills` → `201 Created` for both attempts, with the
  invalid email in the request payload's `recipient.email`.
- Screenshot: `docs/bill-detail-invalid-email-accepted.png`
