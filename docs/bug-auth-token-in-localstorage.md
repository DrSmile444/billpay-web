# [Everywhere][Critical] Access token kept in localStorage

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

`localStorage` contains a key `billpay.authToken` holding what decodes as a
JWT (`header: {"alg":"HS256","typ":"JWT"}`, `payload: {"sub":"demo-user",
"role":"admin"}`), present from the very first page load — no explicit login
step is needed to observe it.

## Why

`expected-behaviour.md`, "Everything, everywhere": "No access token kept in
browser storage." This token sits in `localStorage`, which is readable by
any script running on the page's origin (including via an XSS payload — see
`docs/bug-xss-recipient-name-stored.md`, which is on this same origin) and
persists across reloads and browser restarts.

## Preconditions

- None — present on a fresh load of the app.

## Steps to reproduce

1. Go to `#/`.
2. Run `Object.entries(localStorage)` in the page context.
3. Reload and repeat.

## Actual

```json
[["billpay.authToken","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJyb2xlIjoiYWRtaW4ifQ.8dQe1s0Kx2Yb4mVJ0nQz3rTfWq7uLpAcS1hGdN9vXyE"]]
```

present on every check, including a completely fresh page load with no prior
interaction.

## Expected

An access token, if the app needs one, should not be kept in a persistent,
script-readable store like `localStorage`. This is compounded by the
existing stored-XSS defect on the bill detail page: any script injected via
that vector (or any other) can read this token directly.

## Reproducibility

2 of 2 — present immediately after a fresh navigation to `#/`, and again
after reload, with no login action performed either time.

## Impact

Combined with the stored XSS defect already reported (recipient name
rendered as HTML on the bill detail page), an attacker's injected script has
a same-origin path straight to a token carrying `role: admin`. Even taken
alone, storing a bearer token in `localStorage` is the pattern this
`expected-behaviour.md` rule is written to rule out.

## Evidence

- `browser_evaluate` result: `Object.entries(localStorage)` returning the
  key/value above, checked on two separate fresh loads.
- Screenshot: `docs/app-root-authtoken-context.png` — the app immediately
  after the load the token was captured on (visual context only; the token
  itself lives in `localStorage`, not on screen, so the DOM evidence above is
  the actual proof).
