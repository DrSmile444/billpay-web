## Context

See `proposal.md` for motivation. Relevant current state:

- No test runner, no test config, no test-related devDependencies exist today.
- The app is Vite-based (React 19, MSW v2 for `/api/*`). `src/mocks/handlers.ts`
  has no browser-only dependency — it only imports `msw`, `../types`, and
  `./db` — so it is reusable outside the browser Service Worker.
- CI (`.github/workflows/deploy.yml`) runs only `npm run lint` and
  `npm run build`; nothing else gates a push to `main`.
- 12 defects are already filed in `docs/bug-*.md` against the behaviour
  described in `docs/expected-behaviour.md`. One of them
  (`bug-xss-recipient-name-stored.md`) has an unrelated, separately committed
  fix (`e0afa37`, in `src/screens/BillDetail.tsx`); this change does not
  touch that file.

## Goals / Non-Goals

**Goals:**
- Stand up Vitest + React Testing Library as the test layer, reusing the
  existing MSW handlers so tests exercise the same request/response contract
  the app uses in the browser.
- Encode 11 of the 12 known defects as tests against
  `docs/expected-behaviour.md`, accepting that most of them fail today.
- Make "write tests + hit 80% coverage on touched files" a required task in
  every future change, without making today's known-red tests block CI.

**Non-Goals:**
- Fixing any of the 12 defects (see `proposal.md` — Non-goals).
- Enforcing tests or a coverage threshold in `.github/workflows/deploy.yml`.
- A repo-wide coverage number today — most existing files have zero test
  coverage and will stay that way until a future change touches them.
- Specifying app screens as OpenSpec capabilities beyond the
  `test-coverage-gate` process capability itself.

## Decisions

**Vitest over Jest.** The project already runs on Vite; Vitest reuses
`vite.config.ts`'s transform pipeline (React plugin, TS, ESM) with no second
build pipeline to maintain. The user's own prior experience is with Vitest.
Jest would need its own transform config (ts-jest or babel) duplicating what
Vite already does. Decision: Vitest, in a separate `vitest.config.ts` (kept
separate from `vite.config.ts` so `test` options never affect the production
build config).

**React Testing Library over shallow rendering / snapshot testing.** The
specs above are written in terms of what renders and what accessible name a
control has — RTL's queries (`getByRole`, `findByText`, etc.) map directly to
that. Snapshot tests would not express "has an accessible name" or "shows the
line item's Amount cell" as a pass/fail assertion tied to the spec.

**`msw/node` `setupServer` reusing `src/mocks/handlers.ts` over hand-written
`fetch` mocks.** The handlers already encode the exact API contract
(status codes, delays, idempotency behaviour) the real app talks to. Mocking
`fetch` per test would duplicate that contract and drift from it over time.
One risk: the history handler's fixed 500 and the pay handler's `delay()`
calls make some tests slower or require `waitFor`/fake timers — accepted,
see Risks below.

**Known-defect tests are red on purpose, not skipped or marked `.todo`.**
Decided with the user: a red test is the point — it turns a markdown bug
report into something CI-visible and automatically re-checked, and it will
flip green automatically the day someone fixes the underlying defect. A
`.skip`/`.todo` test would hide the defect from every test run's output.

**Coverage enforcement lives in the OpenSpec task checklist, not CI.**
Given the previous decision, `npm test` cannot be a blocking CI step yet —
several tests are expected to fail on `main` (7 known-red + 2 interpretive
ones below) until each underlying defect is fixed as its own change. Adding
`npm test` to `deploy.yml` today would block every deploy for reasons
unrelated to the change being deployed. Instead, `openspec/config.yaml`
gets a new `tasks` rule requiring every future change to add/update tests
and report ≥80% coverage on the files it touches, checked as part of the
existing pre-`ready-for-qa` task sequence (human- or agent-verified per
change, the same way `ready-for-qa` itself is not a CI job).

**Two defects get an explicit, minimal interpretation instead of a literal
"encode the current invariant" test**, because `expected-behaviour.md`
states the invariant but the bug report leaves more than one valid fix:

1. *`selected-total-mixes-currencies`* — `expected-behaviour.md` only says
   amounts in different currencies must not be added into one number. The
   spec above requires a **separate total per currency**, rather than e.g.
   picking one currency and hiding the rest, or refusing to show a total at
   all. This is the smallest change consistent with the invariant and with
   the existing "Selected: N" + total-bar layout already in `BillsList.tsx`.
   Alternative considered: convert everything to one reference currency —
   rejected, there is no exchange rate in this app's data model, so any
   number produced that way would be fabricated.
2. *`amount-precision-display-mismatch`* — the bug report itself names two
   valid fixes: reject sub-unit precision at entry, or display the exact
   charged value everywhere. The spec above requires **rejecting the input**
   at the New bill form, because it is a single, deterministic assertion
   point (one form, one validation rule) versus the display-exact-value
   route, which would require every amount-rendering surface (line item,
   total, Pay button, receipt) to agree on precision — four places to keep
   in sync versus one. It also mirrors the pattern already used for the
   email requirement (reject bad input at the form).

Both interpretations are recorded here so that whoever implements the actual
fix later has a documented, already-agreed starting point rather than having
to re-derive one from the bug report.

**`auth-token-in-localstorage` is tested at the bootstrap level, not as a
screen render.** The token is set by a module-level side effect in
`src/main.tsx` (`localStorage.setItem('billpay.authToken', ...)`), run
before `App` ever mounts, alongside `worker.start()` (MSW's browser Service
Worker registration, which does not run under jsdom). The test for this
defect mocks `./mocks/browser` (so `bootstrap()` never calls
`worker.start()`) and `react-dom/client`'s `createRoot` (so it does not need
a real `#root` DOM node), then dynamically imports `../main` after
`vi.resetModules()` and asserts `localStorage.getItem('billpay.authToken')`
is `null`. This is the only test in the suite that exercises an entry point
rather than a screen or a pure function.

**`bill-detail-mobile-horizontal-scroll` is out of scope for this test
layer.** jsdom (Vitest's default DOM) does not perform real CSS layout —
`getBoundingClientRect`, `min-width` resolution against a viewport, and
`scrollWidth`/`clientWidth` are exactly the browser layout engine behaviour
jsdom does not implement. This defect stays covered by the existing
Playwright-based `ready-for-qa` check, which already measures it.

**Capability name: `test-coverage-gate`.** Chosen over per-screen capability
specs (`bills-list`, `bill-detail`, ...) because `openspec/specs/` currently
has zero capabilities — writing per-screen specs for the whole app is a
separate, much larger effort than this change, and the requirements here are
about the testing process itself (what must be tested, what bar future
changes must meet), not a new piece of product behaviour.

**`@testing-library/react`'s automatic cleanup needs an explicit `afterEach`.**
Because `vitest.config.ts` does not set `test.globals: true` (see the
"no globals" reasoning implicit in every test file's explicit `import {
describe, it, expect } from 'vitest'`), RTL's own auto-cleanup detection
(which checks for a global `afterEach`) never fires. `src/test/setup.ts`
therefore calls `@testing-library/react`'s `cleanup()` explicitly in a
global `afterEach`, alongside `server.resetHandlers()`. Without it, a
previous test's mounted component (and its pending timers/fetches) stays
alive into the next test — this was caught empirically when a test
correctly failed in isolation but falsely passed inside the full suite.

**Vitest's v8 coverage report is skipped by default when any test fails.**
Since this suite ships with tests that are red on purpose, `vitest.config.ts`
sets `coverage.reportOnFailure: true` so a report is still produced.

## Risks / Trade-offs

- **Red tests in the suite could be mistaken for a broken test setup by a
  future contributor.** Mitigation: each failing test's description/name
  references the corresponding `docs/bug-*.md` file, and `tasks.md` records
  the expected pass/fail state per test so a first-time reader can tell
  "expected red" from "something I broke."
- **`npm test` not running in CI means a future contributor could forget to
  run it locally.** Mitigation: this is the same trust model the repo
  already uses for `ready-for-qa` (also not a CI job), and the new
  `openspec/config.yaml` rule makes "add tests, hit 80% on touched files" an
  explicit, checked task in every change's `tasks.md`, not an honor-system
  ask.
- **The two interpretive requirements (currency split, precision rejection)
  could turn out to conflict with a real design decision made when those
  defects are actually fixed.** Mitigation: documented here with alternatives
  considered, so a future change can deliberately supersede this spec via a
  `MODIFIED Requirements` delta instead of silently drifting from it.
- **MSW handler delays (`delay(400)` on pay, `delay(200)` on history, etc.)
  make the suite slower and require `waitFor`/`findBy*` queries rather than
  synchronous assertions.** Accepted — using the real handlers (see
  Decisions) was judged more valuable than shaving milliseconds off a small
  suite.

## Open Questions

- Exact coverage-reporting command/format contributors use to confirm the
  80% figure per change (e.g. `vitest run --coverage` output read manually
  vs. a saved report file) can be decided during implementation; it does not
  change any requirement above or the task breakdown.
