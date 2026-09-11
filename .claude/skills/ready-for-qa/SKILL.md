---
name: ready-for-qa
description: Verify an implemented change in a real browser before handing it onward. Runs spec verification, then deterministic runtime checks, then adversarial cases, and produces a handoff report. Use when implementation is finished and someone is about to say "done" or "ready for QA".
allowed-tools: mcp__playwright__* Bash(openspec:*) Bash(git:*) Bash(npm:*) Read Grep Glob
---

# Ready for QA

"Implemented" is not "ready for QA". This skill closes that gap: it proves the
change works in a running browser before a human tester ever opens it.

The cost is a few minutes. The cost of a QA round-trip on an obvious defect is a
day.

## 0. What you need

The Playwright MCP server. In Claude Code it comes from the repository's
`.mcp.json`; otherwise `claude mcp add playwright -- npx -y @playwright/mcp@latest`,
or `codex mcp add playwright -- npx -y @playwright/mcp@latest` for Codex, whose
config is global rather than per-repository.

## 1. Identify what changed

You normally run this **before committing**, so the branch diff is empty and the
work lives in the working tree. Look at both:

```bash
git status --short                     # uncommitted work — usually the real answer
git diff                               # unstaged
git diff --cached                      # staged
git diff --stat origin/main...HEAD     # already committed on this branch
```

If all of them are empty, you have nothing to verify — stop and ask what you were
meant to check.

From the diff, list the affected surfaces: routes, screens, components, forms,
API calls. You verify those and nothing else.

## 2. Verify against the description first

If the project uses OpenSpec, the description of expected behaviour already
exists — the acceptance scenarios in the change's specs. Run spec verification
before touching a browser:

```
/opsx:verify <change-name>
```

Resolve anything it reports as missing or uncovered before continuing. A runtime
check cannot tell you a requirement was never implemented; only the comparison
against the description can.

## 3. Plan the checks in three rounds

Write all three out before running anything.

**Round 1 — Functional.** For each affected surface: action → expected result.
Cover the acceptance scenarios verbatim where they exist.

**Round 2 — Adversarial.** Concrete values, not categories. Into numeric fields:
`0`, a negative, `0.005`, `1e3`, `999999999999`, `100,50`, a leading space,
letters. Into free-text fields: `<img src=x onerror="window.__x=1">`, then check
`window.__x`. Then: the same action twice quickly, back/forward navigation,
refresh mid-flow, keyboard-only interaction, loading and error and empty states.
If the change touches a screen that aggregates records, combine records that
differ — currency, status, number of child rows.

**Round 3 — Coverage gaps.** Accessibility, mobile viewport, console output,
failed network calls, visual consistency with neighbouring screens.

## 4. Run the checks — deterministic before judgment

`browser_navigate` to the running app, then `browser_snapshot` for the
accessibility tree and element refs. Refs go stale on any re-render: take a fresh
snapshot immediately before each click or fill.

| Question                             | Tool                                                                                                         | Kind            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------- |
| Did anything throw?                  | `browser_console_messages`                                                                                   | deterministic   |
| Did a request fail or repeat?        | `browser_network_requests`, then `browser_network_request`                                                   | deterministic   |
| What did the API return?             | `browser_network_request` — response body                                                                    | deterministic   |
| **Does the screen match that data?** | compare the body against `browser_evaluate` → `document.body.innerText`                                      | deterministic   |
| Right size, font, spacing?           | `browser_evaluate` → `getBoundingClientRect()`, `getComputedStyle()`, plus the parent's `gap` and `flexWrap` | deterministic   |
| Reachable and named?                 | `browser_snapshot` — role and accessible name                                                                | deterministic   |
| What is in browser storage?          | `browser_evaluate` → `Object.entries(localStorage)`                                                          | deterministic   |
| Does it work on a phone?             | `browser_resize` 375×812, then measure again                                                                 | deterministic   |
| Does the page look right?            | `browser_take_screenshot`                                                                                    | judgment — last |

Never ask a model whether a button is 44px tall. Measure it.

The comparison rung is the one people skip and the one that pays best: read what
the endpoint returned, read what the screen renders, diff them field by field.

**Traps:** key names are case-sensitive (`Tab`, not `tab` — the lowercase form
fails silently); navigation resets the viewport, so navigate before you resize;
the network list is empty right after a navigation, reload once first; a dev
server running React StrictMode double-fires every request, which is not a
defect; and if the app serves its API through a service worker, you cannot force
an error response from the tool layer — make the application produce it.

## 5. Capture evidence at the moment of failure

When a check fails, capture before you fix and before you navigate away:
`browser_take_screenshot`, `browser_console_messages`, `browser_network_requests`.

Record what you expected, what happened, the exact steps, and the evidence.
Separate observation from hypothesis, and label which is which.

## 6. Fix, then prove it stays fixed

Fix the implementation, re-run the failing check, then turn the failure into a
test so it cannot come back. You walked the scenario with the browser tools, so
you know the page's real structure — write the test from what you saw, not from
what you assume the markup to be.

Prefer user-facing locators (`getByRole`, `getByLabel`, `getByText`) and
web-first assertions. Reject `waitForTimeout` and positional selectors.

## 7. Never heal a test into agreeing with a bug

When a test fails, classify the cause before changing anything:

| Cause                                            | Allowed action                        |
| ------------------------------------------------ | ------------------------------------- |
| Locator moved, selector stale, waiting was flaky | Repair the test                       |
| Implementation does not match the description    | Fix the implementation                |
| The description itself looks wrong or outdated   | **Stop. Report it. A human decides.** |

You may repair _how the test reaches the screen_. You may not redefine _what the
screen is supposed to show_. Changing an expected value so the suite turns green
deletes the requirement.

## 8. Produce the handoff

```
READY FOR QA — <change name>

Scenarios verified      <list, each pass/fail>
Defects found and fixed <list, with the test added for each>
Tests added             <files>
Runtime checks          console / network / a11y / responsive — what was run
Not covered             <what you deliberately skipped, and why>
Remaining risks         <known limitations, unverified paths>
```

If anything still fails, say so and do not write "ready". A handoff that hides a
known defect costs more than no handoff at all.
