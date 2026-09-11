## 1. Test infrastructure setup

- [x] 1.1 Add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `@vitest/coverage-v8` as devDependencies in `package.json`; verify `npm install` completes without errors.
- [x] 1.2 Create `vitest.config.ts` (jsdom environment, `src/test/setup.ts` as `setupFiles`, v8 coverage provider), kept separate from `vite.config.ts`; verify `npx vitest run` exits cleanly (reporting no test files) before any test file exists.
- [x] 1.3 Create `src/test/setup.ts` importing `@testing-library/jest-dom`, and `src/mocks/server.ts` (`setupServer(...handlers)` from `msw/node`, reusing `src/mocks/handlers.ts`) wired into the setup file's `beforeAll`/`afterEach`/`afterAll`; verify a throwaway smoke test that calls `listBills()` resolves with the seeded fixture data from the mocked `/api/bills` handler, then delete the throwaway test.
- [x] 1.4 Add `"test": "vitest run"` and `"test:coverage": "vitest run --coverage"` scripts to `package.json`; verify both commands run to completion.

## 2. Pure-function regression tests (`src/lib/format.ts`)

- [x] 2.1 Add `selectedTotal` tests: a bill with a single, quantity-1 line item (baseline, passes), and a bill with a line item where quantity > 1 or more than one line item (expect the bill's full amount) — the second case is RED against `docs/bug-selected-total-uses-first-item.md` today; verify with `npx vitest run src/lib/format.test.ts` and record which case fails.

## 3. `BillsList` component tests (`#/`)

- [x] 3.1 Add a test asserting the refresh control is queryable via `getByRole('button', { name: /refresh/i })` — RED against `docs/bug-refresh-button-no-accessible-name.md`.
- [x] 3.2 Add a test selecting a multi-line-item bill and asserting the displayed "Selected" total equals the bill's full amount, not its first line item — RED against `docs/bug-selected-total-uses-first-item.md` (rendered-footer level, complementing 2.1's pure-function assertion).
- [x] 3.3 Add a test selecting bills across two currencies (using the existing seeded fixture bills) and asserting the footer shows a separate total per currency rather than one combined number — RED against `docs/bug-selected-total-mixes-currencies.md`, per the "separate total per currency" interpretation recorded in `design.md`.
- [x] 3.4 Run `npx vitest run src/screens/BillsList.test.tsx` and record that 3.1-3.3 fail as expected.

## 4. `BillDetail` component tests (`#/bills/:id`)

- [x] 4.1 Add a test asserting a line item with quantity > 1 renders its "Amount" cell as unit amount × quantity, matching the displayed Total — RED against `docs/bug-line-item-amount-not-extended.md`.
- [x] 4.2 Add a test that, once `GET /api/bills/:id/history` settles (the existing handler always returns 500), the payment-history section shows a "could not load" message instead of remaining on "Loading history…" — RED against `docs/bug-payment-history-stuck-loading.md`; use `findBy*`/`waitFor` given the handler's built-in delay.
- [x] 4.3 Add a test asserting a recipient name containing HTML markup (e.g. `<img src=x onerror=...>`) renders as literal text on the bill detail page, not interpreted markup — expected to PASS today, since the `dangerouslySetInnerHTML` removal was already committed separately (`e0afa37`) in `src/screens/BillDetail.tsx`; note in the test that it documents `docs/bug-xss-recipient-name-stored.md`.
- [x] 4.4 Add a test that pays an unpaid bill through to the receipt page rendering and asserts (a) no uncaught exception is thrown during the flow, and (b) no `console.log`/`console.error` call made during that action contains the recipient's email or the payment amount — RED against both `docs/bug-uncaught-typeerror-after-payment.md` and `docs/bug-console-logs-payment-details.md` (same user action, both asserted in one flow test).
- [x] 4.5 Run `npx vitest run src/screens/BillDetail.test.tsx` and record that 4.1, 4.2 and 4.4 fail as expected and 4.3 passes.

## 5. `NewBill` component tests (`#/bills/new`)

- [x] 5.1 Add a test submitting the form with a non-empty, syntactically invalid email (e.g. `not-an-email`) and asserting a validation message is shown and `POST /api/bills` is never sent — RED against `docs/bug-new-bill-email-not-validated.md`.
- [x] 5.2 Add a test submitting the form with an amount carrying more decimal places than the currency's smallest unit (e.g. `0.005` for UAH) and asserting a validation message is shown and `POST /api/bills` is never sent — RED against `docs/bug-amount-precision-display-mismatch.md`, per the "reject at entry" interpretation recorded in `design.md`.
- [x] 5.3 Run `npx vitest run src/screens/NewBill.test.tsx` and record that both fail as expected.

## 6. Application bootstrap test (`src/main.tsx`)

- [x] 6.1 Add a test that mocks `./mocks/browser` and `react-dom/client`'s `createRoot`, then dynamically imports `../main` after `vi.resetModules()`, and asserts `localStorage.getItem('billpay.authToken')` is `null` — RED against `docs/bug-auth-token-in-localstorage.md`; verify with `npx vitest run src/main.test.ts`.

## 7. Coverage and process rule

- [x] 7.1 Run `npm run test:coverage` and record the statement-coverage percentage for `src/lib/format.ts`, `src/screens/BillsList.tsx`, `src/screens/BillDetail.tsx`, `src/screens/NewBill.tsx`, and `src/main.tsx` (the files this change adds tests for) in the change's handoff notes. See "Handoff notes" at the end of this file.
- [x] 7.2 Add a new `tasks` rule to `openspec/config.yaml` requiring every future change's task list to include adding/updating tests for the behaviour it touches and confirming ≥80% coverage on touched files, ordered before the existing "run ready-for-qa" task; verify by re-reading the file and confirming the rule text sits alongside the existing three `tasks` rules.

## 8. Quality gate

- [x] 8.1 Run `npm run lint` and `npm run build`; record that both pass. This change adds only test files, test config, and one `openspec/config.yaml` edit — no production `src/` logic changes.
- [x] 8.2 Run `npm test` with the full suite in place and record the full pass/fail breakdown by `docs/bug-*.md` name: expected RED — `selected-total-uses-first-item`, `refresh-button-no-accessible-name`, `selected-total-mixes-currencies`, `line-item-amount-not-extended`, `payment-history-stuck-loading`, `uncaught-typeerror-after-payment`, `console-logs-payment-details`, `new-bill-email-not-validated`, `amount-precision-display-mismatch`, `auth-token-in-localstorage`; expected PASS — `xss-recipient-name-stored`. Confirm no test fails or passes unexpectedly relative to this list. Confirmed: matches exactly, see "Handoff notes" below.

## 9. Ready for QA

- [x] 9.1 Run the repo's `ready-for-qa` skill (`.claude/skills/ready-for-qa/SKILL.md`) against a running dev server (`npm run dev`) and produce its handoff report, confirming the new tooling/config causes no regression in the running app (no new console errors, no broken navigation). Record that the report exists and shows no unresolved failures.

## Handoff notes

**Coverage** (`npm run test:coverage`, statement %, on the files this change adds tests for):

| File | % Stmts |
|---|---|
| `src/lib/format.ts` | 82.35% |
| `src/screens/BillsList.tsx` | 90.9% |
| `src/screens/BillDetail.tsx` | 83.78% |
| `src/screens/NewBill.tsx` | 81.25% |
| `src/main.tsx` | not measurable — see note below |

All four measurable files clear the ≥80% bar from `proposal.md`/`specs/test-coverage-gate/spec.md`.

`src/main.tsx` does not appear in the v8 coverage report at all, even though `src/main.test.ts` genuinely exercises it (the test's assertion fails against the real, unguarded `localStorage.setItem` call, proving the code path runs). The v8 coverage provider does not attribute coverage to this file because it is loaded via a dynamic `await import('./main')` after `vi.doMock(...)`, outside Vitest's normal static module graph — a tooling limitation, not a test gap. Worth knowing if a future change tries to push this file's reported number specifically.

**Full suite breakdown** (`npm test`): 11 failed, 2 passed (13 total), stable across repeated runs. RED failures map 1:1 to `docs/bug-*.md`, exactly as predicted in `proposal.md`:

| `docs/bug-*.md` | Result |
|---|---|
| `selected-total-uses-first-item` | RED (2 tests: `format.test.ts` + `BillsList.test.tsx`) |
| `refresh-button-no-accessible-name` | RED |
| `selected-total-mixes-currencies` | RED |
| `line-item-amount-not-extended` | RED |
| `payment-history-stuck-loading` | RED |
| `console-logs-payment-details` | RED |
| `uncaught-typeerror-after-payment` | RED |
| `new-bill-email-not-validated` | RED |
| `amount-precision-display-mismatch` | RED |
| `auth-token-in-localstorage` | RED |
| `xss-recipient-name-stored` | PASS (fix already committed separately, `e0afa37`, not part of this change) |
| `bill-detail-mobile-horizontal-scroll` | not unit-tested (see `specs/test-coverage-gate/spec.md` — "Not covered by this capability") |

No test failed or passed unexpectedly relative to this list.

**Implementation-time additions beyond the original task text** (small, in scope, recorded for transparency):
- `vitest.config.ts`: added `coverage.reportOnFailure: true`. Vitest's v8 provider silently skips the coverage report when any test fails; since this suite ships with tests that are red by design, the report would never have been produced without this.
- `src/test/setup.ts`: added `@testing-library/react`'s `cleanup()` to the global `afterEach` (alongside `server.resetHandlers()`). Without `test.globals: true` in `vitest.config.ts` (a deliberate choice, see `design.md`), React Testing Library's automatic cleanup does not self-register, so previous tests' mounted components and pending timers/fetches were bleeding into later tests — this was caught empirically (a test falsely passed inside the full run but correctly failed in isolation) and fixed before any task was marked complete.
- `tsconfig.app.json`: added `"node"` to `types` (alongside the existing `"vite/client"`) so `process.on('uncaughtException', ...)` in `BillDetail.test.tsx` type-checks under `npm run build`. `@types/node` was already a devDependency.
- `.gitignore` and `eslint.config.js`: added `coverage` (the `vitest run --coverage` output directory), since `npm run lint` was otherwise linting generated report files under `coverage/`.
- `BillDetail.test.tsx`'s history test uses `server.use(...)` to override the `/history` handler with a neutral, successful response for every test except the dedicated payment-history test, which calls `server.resetHandlers()` to restore the repo's real always-500 handler. Without this, every `BillDetail` test triggered the same unrelated, already-covered unhandled-rejection defect and failed for the wrong reason.
