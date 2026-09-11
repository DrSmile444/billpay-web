# [Bill details][Critical] Recipient name renders as HTML — stored XSS

## Environment

- URL: https://drsmile444.github.io/billpay-web/#/bills/5b1c9d4e-3f2a-4e6b-8a7c-0d1e2f3a4b5c
- Build: GitHub Pages deployment (MSW-mocked API, fixture data)
- Browser: Chromium (Playwright MCP)
- Date tested: 2026-09-11

## What

On the **Bill details** page, the recipient's `Name` field is inserted into the
DOM as raw HTML instead of text. A recipient name containing a `<img
onerror="...">` payload executes arbitrary JavaScript in the viewer's browser
the moment the page renders.

## Why

This is a stored XSS: the payload lives in bill/recipient data and fires for
every user who opens that bill's detail page, with no interaction required.
Depending on what a real backend would expose to page scripts, this could be
used to steal session data, act on the victim's behalf, or redirect/phish from
inside a trusted page.

It is also an inconsistency bug: the **same field**, sourced from the same
data, is rendered safely (escaped) on the bills list page and unsafely
(as HTML) on the bill details page — see Expected below.

## Preconditions

- A bill exists whose recipient name contains HTML markup. Reproduced with the
  seeded fixture bill for `office@acme-cleaning.example`
  (id `5b1c9d4e-3f2a-4e6b-8a7c-0d1e2f3a4b5c`), whose name is:
  `Acme Cleaning <img src=x onerror="window.__xssFired=(window.__xssFired||0)+1">`

## Steps to reproduce

1. Go to `https://drsmile444.github.io/billpay-web/#/`.
2. Observe the "Acme Cleaning ..." row: the payload shows as literal escaped
   text, not as markup (baseline — this page is safe).
3. Click that row, or navigate directly to
   `#/bills/5b1c9d4e-3f2a-4e6b-8a7c-0d1e2f3a4b5c`.
4. Inspect the `Recipient → Name` field.

## Actual

The name renders as live HTML. DOM at the field:

```html
<dd data-testid="recipient-name">
  Acme Cleaning <img src="x" onerror="window.__xssFired=(window.__xssFired||0)+1">
</dd>
```

The injected handler executes: `window.__xssFired === 1` after page load.
Browser console confirms the `<img>` was really inserted and the browser tried
to fetch it:

```
[ERROR] Failed to load resource: the server responded with a status of 404 () @ https://drsmile444.github.io/billpay-web/x
```

## Expected

The recipient name should render as plain text, exactly as the bills list page
already does for the identical value:

```html
<a href="#/bills/5b1c9d4e-...">Acme Cleaning &lt;img src=x onerror="..."&gt;</a>
```

The list page proves the correct behavior is achievable with the same data —
the details page is the outlier.

## Reproducibility

2 of 2 (fresh page load each time, `window.__xssFired` set on both attempts;
list page stayed escaped on both checks).

## Impact

Any user who opens a bill whose recipient name (or, potentially, any other
free-text field rendered the same way) contains a script payload runs
attacker-controlled JavaScript in their own session. In a real deployment with
a live backend and authentication, this is a session-compromise vector, not
just a cosmetic defect.

## Evidence

- Screenshot: `docs/xss-recipient-name-bill-detail.png`
- DOM snapshot of the affected field (see Actual, above)
- Console error confirming the injected `<img>` attempted a network request:
  `Failed to load resource: the server responded with a status of 404 () @ .../billpay-web/x`
- `window.__xssFired === 1` after navigating to the bill details page, `undefined` on the bills list page

## Not yet checked

- Whether other free-text fields (line item descriptions, email) are rendered
  the same unsafe way.

## Confirmed since (2026-09-11)

- The same payload survives into `New bill` → created bill's detail view.
  Submitted `<img src=x onerror="window.__xssFired2=(window.__xssFired2||0)+1">`
  as the recipient Name on `#/bills/new`; the form accepted it (no name-format
  validation), created the bill via `POST /api/bills`, navigated to its detail
  page, and the handler fired: `window.__xssFired2 === 1`. Same root cause,
  same fix as the stored bill above — the New bill form is simply another way
  to get attacker-controlled markup into the same unescaped render path.
