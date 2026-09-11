## Why

There is no test runner in this repo, so regressions and the defects QA already
found in `docs/bug-*.md` are only caught by manual browser exploration, after
the fact. We want an automated unit/component test layer that catches
regressions before a change is handed to QA, plus a standing rule that every
future OpenSpec change ships tests for the behaviour it touches.

## What Changes

- Add Vitest, React Testing Library, `@testing-library/jest-dom`,
  `@testing-library/user-event`, jsdom, and `@vitest/coverage-v8` as
  devDependencies, with a test config (jsdom environment, MSW `setupServer`
  wired to the existing `src/mocks/handlers.ts`).
- Add `npm test` and `npm run test:coverage` scripts. **Not** added to
  `.github/workflows/deploy.yml` — that stays lint+build only (see Non-goals).
- Add a baseline regression suite that encodes 11 of the 12 defects already
  filed in `docs/bug-*.md` as executable tests, asserting the behaviour in
  `docs/expected-behaviour.md`, not current behaviour:
  - 8 straightforward RED tests (fail today, documenting a real, unfixed defect):
    `selected-total-uses-first-item`, `console-logs-payment-details`,
    `line-item-amount-not-extended`, `new-bill-email-not-validated`,
    `payment-history-stuck-loading`, `refresh-button-no-accessible-name`,
    `uncaught-typeerror-after-payment`, `auth-token-in-localstorage` (this
    last one tests `src/main.tsx`'s bootstrap side effect directly, with
    `./mocks/browser` and `react-dom/client` mocked out, since it is not a
    screen/component render).
  - 1 test expected to pass immediately: `xss-recipient-name-stored` — the fix
    was already committed separately (`e0afa37`, "fix: stop rendering
    recipient name as HTML on bill detail"; `src/screens/BillDetail.tsx` no
    longer uses `dangerouslySetInnerHTML`); this change does not touch that
    file, it only adds a test that happens to already be green.
  - 2 tests written against a minimal, explicitly-documented interpretation of
    the expected behaviour, recorded in `design.md` before the test is
    written (because `expected-behaviour.md` states the invariant but not the
    exact shape of the fix): `selected-total-mixes-currencies`,
    `amount-precision-display-mismatch`.
  - 1 defect, `bill-detail-mobile-horizontal-scroll`, is explicitly **not**
    unit-tested — it is a real CSS layout measurement (`min-width: 420px`
    inside a `flex-wrap: nowrap` row) that jsdom does not lay out. It stays
    covered by the existing `ready-for-qa` Playwright-based check.
- Add a process rule to `openspec/config.yaml` (`tasks` rule) requiring every
  future change's task list to include writing/updating tests for the
  behaviour it touches, with ≥80% coverage on the files it touches, as a task
  that runs before the existing "run ready-for-qa" final task.

## Capabilities

### New Capabilities

- `test-coverage-gate`: the requirement that (a) this repo has an automated
  unit/component test layer, (b) a baseline regression suite exists for the
  defects already found by QA, and (c) every future change's task list must
  add or update tests for the behaviour it touches and confirm ≥80% coverage
  on touched files before handing the change to `ready-for-qa`.

### Modified Capabilities

None — `openspec/specs/` currently has no capability specs at all; the
screens' actual behaviour is documented informally in `docs/expected-behaviour.md`,
not as OpenSpec capability specs, so there is nothing existing to modify.

## Impact

- **Screens touched by new tests (read-only, no behaviour changes)**:
  `BillsList` (`#/`), `BillDetail` (`#/bills/:id`), `NewBill` (`#/bills/new`),
  `ReceiptScreen` (`#/bills/:id/receipt`).
- **Pure helpers touched by new tests**: `src/lib/format.ts`
  (`selectedTotal`, `validateEmail`, `formatMoney`).
- **Entry point touched by a new test (read-only)**: `src/main.tsx` (the
  `localStorage.setItem('billpay.authToken', ...)` bootstrap side effect).
- **MSW handlers**: none change. All six existing handlers in
  `src/mocks/handlers.ts` (`GET/POST /api/bills`, `GET /api/bills/:id`,
  `GET /api/bills/:id/history`, `POST /api/bills/:id/pay`,
  `GET /api/bills/:id/receipt`) are reused as-is via `msw/node`
  `setupServer` in tests.
- **Config**: `package.json` (new devDependencies + scripts), a new Vitest
  config, `openspec/config.yaml` (`tasks` rule addition).
- **CI**: unchanged. `.github/workflows/deploy.yml` still runs only
  `npm run lint` and `npm run build`.
- **No production `src/` logic changes** other than test files themselves —
  this change does not fix any of the 12 documented defects, including the
  XSS fix, which is a separate, unrelated, pre-existing commit (`e0afa37`).

## Non-goals

- **Not fixing any planted defect.** All 12 `docs/bug-*.md` items stay
  unfixed by this change (the one already-fixed XSS defect was fixed by a
  separate, pre-existing commit, `e0afa37`, not by this change). Tests are
  written to be red where the defect is real, per the project's training-
  playground rule in `CLAUDE.md`/`openspec/config.yaml`.
- **Not enforcing tests or coverage in CI.** `deploy.yml` is not modified.
  The 80% coverage requirement is enforced at the OpenSpec task level (a
  human/agent checklist item per change), not as an automated CI gate, so
  that known-red baseline tests never block a deploy.
- **Not writing product-behaviour capability specs** (e.g. `bills-list`,
  `bill-detail`) for the whole application. This change only specs the
  testing-process requirement itself; spec'ing each screen's full behaviour
  as OpenSpec capabilities is a separate, larger effort.
- **Not unit-testing `bill-detail-mobile-horizontal-scroll`** — it requires
  real browser CSS layout, out of scope for jsdom-based tests.
