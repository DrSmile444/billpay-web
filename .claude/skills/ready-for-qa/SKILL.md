---
name: ready-for-qa
description: Verify an implemented change in a real browser before handing it to QA. Runs spec verification, then deterministic runtime checks, then adversarial cases, and produces a QA handoff report. Use when implementation is finished and someone is about to say "done" or "ready for QA".
allowed-tools: Bash(playwright-cli:*) Bash(openspec:*) Bash(git:*) Bash(npm:*) Read Grep Glob
---

# Ready for QA

"Implemented" is not "ready for QA". This skill closes that gap: it proves the
change works in a running browser before a human tester ever opens it.

Do not skip steps because the change "looks small". The cost of this skill is a
few minutes; the cost of a QA round-trip on an obvious defect is a day.

## 0. Install the browser driver

The commands below need `playwright-cli`. Install it and its agent skill once:

```bash
npx @playwright/cli@latest install --skills          # Claude Code  -> .claude/skills/
npx @playwright/cli@latest install --skills=agents   # Codex/others -> .agents/skills/
```

It reuses an installed Chrome, so there is no separate browser download. If you
work through the Playwright MCP server instead, the same ladder applies — only
the command syntax differs.

## 1. Identify what changed

You normally run this skill **before committing**, so the branch diff is empty
and only the working tree holds your change. Look at both:

```bash
git status --short                     # uncommitted work — usually the real answer
git diff                               # unstaged changes
git diff --cached                      # staged changes
git diff --stat origin/main...HEAD     # already-committed work on this branch
```

If `git status --short` and `git diff` are both empty _and_ the branch diff is
empty, you have nothing to verify — stop and ask what you were meant to check.

From the diff, list the affected surfaces: routes, screens, components, forms,
API calls. You will verify these and nothing else — scope the work to the change.

If the project uses OpenSpec, also load the change artifacts:

```bash
openspec list --json
openspec status --change "<name>" --json
```

## 2. Verify against the spec first

If an OpenSpec change is active, run spec verification before touching a browser:

```
/opsx:verify <change-name>
```

Resolve anything it reports as missing or uncovered before continuing. A runtime
check cannot tell you that a requirement was never implemented — only the spec
comparison can.

## 3. Plan the checks in three rounds

Write all three rounds out before running anything. Do not merge them into one
pass; each round exists to catch what the previous one missed.

**Round 1 — Functional.** For each affected surface: action → expected result.
Cover the acceptance scenarios from the spec verbatim where they exist.

**Round 2 — Adversarial.** Re-read round 1 and use concrete values, not
categories. Into every numeric field: `0`, a negative, `0.005`, `1e3`,
`999999999999`, `100,50`, a leading space, letters. Into every free-text field:
`<img src=x onerror="window.__x=1">`, then check `window.__x`. Then the
interaction cases: the same action twice quickly, back/forward navigation,
refresh mid-flow, keyboard-only interaction, loading and error and empty states.
If the change touches a screen that aggregates records, combine records that
differ — currency, status, number of child rows.

**Round 3 — Coverage gaps.** Re-read rounds 1-2 and ask what neither covers:
accessibility, mobile viewport, console output, failed network calls, visual
consistency with neighbouring screens.

Deduplicate into one numbered list. That list is your test plan.

## 4. Run the checks — deterministic before judgment

Open the running application:

```bash
playwright-cli open http://localhost:5173/          # use the app's real base path
playwright-cli snapshot                             # accessibility tree
```

`snapshot` prints refs like `[ref=e13]`, and **every command that targets an
element takes that ref, not its text**:

```bash
playwright-cli click e13                 # correct
playwright-cli click "Show paid bills"   # error: does not match any elements
playwright-cli find "Show paid"          # use find to locate, then click its ref
```

**Refs go stale on any re-render or navigation.** A stale ref either errors or
acts on the wrong element silently. Run `snapshot` immediately before every
`click`, `fill` or `select`.

**`open` resets the viewport**, so a resize done before it is lost — you will
measure at desktop width and report no overflow on a page that overflows. Order:
`open` → `resize` → measure.

To read the page quickly after an action:

```bash
playwright-cli eval "() => document.body.innerText" --raw
```

Work down this ladder. Every rung you can answer with a measurement, you MUST
answer with a measurement. Visual judgment is the last resort, never the first.

| Question                                         | Command                                                                                                                                                                                                                                                                                                                                 | Kind            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Did anything throw?                              | `playwright-cli console`                                                                                                                                                                                                                                                                                                                | deterministic   |
| Did a request fail?                              | `playwright-cli requests`, `request <n>`                                                                                                                                                                                                                                                                                                | deterministic   |
| What did the API return?                         | `playwright-cli response-body <n>`                                                                                                                                                                                                                                                                                                      | deterministic   |
| **Does the screen match that data?**             | compare the response body field by field against `eval "() => document.body.innerText" --raw`                                                                                                                                                                                                                                           | deterministic   |
| Is this element the right size / font / spacing? | `playwright-cli eval "() => { const el = document.querySelector('<css>'); const r = el.getBoundingClientRect(); const p = getComputedStyle(el.parentElement); return {h:r.height, right:r.right, fontSize:getComputedStyle(el).fontSize, parentGap:p.gap, parentWrap:p.flexWrap}; }"` — a CSS selector is more reliable here than a ref | deterministic   |
| Does it work on a phone?                         | `playwright-cli resize 375 812` then re-measure                                                                                                                                                                                                                                                                                         | deterministic   |
| Is the control reachable and named?              | `playwright-cli snapshot` — check role and accessible name                                                                                                                                                                                                                                                                              | deterministic   |
| How does it behave offline / on a 500?           | `playwright-cli network-state-set offline`; for a forced error see the note below                                                                                                                                                                                                                                                       | deterministic   |
| Does the page _look_ right?                      | `playwright-cli screenshot`                                                                                                                                                                                                                                                                                                             | judgment — last |

Never ask a model whether a button is 44px tall. Measure it.

The comparison rung is the one people skip and the one that pays best: read what
the endpoint returned, read what the screen renders, and diff them field by
field. Wrong totals, off-by-one dates and values stored at a precision the UI
hides all surface there and nowhere else.

### Four traps that cost people the most time

**Key names are case-sensitive.** `playwright-cli press tab` does nothing at all
— no error, exit code 0, focus unchanged. `press Tab` works. Use Playwright key
names: `Tab`, `Enter`, `Space`, `ArrowLeft`. Before keyboard testing, click or
focus an element first; a freshly opened page leaves focus somewhere useless.

**`requests` is empty right after `goto`.** The list fills as the page makes
calls, so reload once before reading it, and pass `--static` if you want more
than XHR/fetch entries.

**A dev server double-fires every request.** React StrictMode mounts effects
twice in development, so each API call appears twice in `requests`. That is the
dev server, not a defect. Confirm against a production build before reporting a
duplicate request — unlike a real double-submit, which fires from one user
action and reaches the same endpoint twice with the same payload.

**A dev server URL is not the deployed URL.** If the app is built with a base
path, `localhost:5173` may redirect while `npm run preview` and the deployed
site need the full path. Check the URL bar after `open`.

### Where `route` works, and where it silently does not

`playwright-cli route <pattern> --status 500` rewrites a response — but only for
requests that actually reach the browser's network layer. If the application
runs a **service worker** that already answers that path (Mock Service Worker,
an offline cache, a PWA shell), the service worker responds first and the route
handler never fires. Nothing errors; you simply get the original response and
may conclude the error path works when it was never exercised.

Verified behaviour on a page with a service worker mocking `/api/bills`:

| Target                                           | Result                               |
| ------------------------------------------------ | ------------------------------------ |
| `route "**/api/bills"` — path the worker handles | route ignored, worker's 200 returned |
| `route "**/api/other"` — path the worker ignores | route applied, forced 500 returned   |

So: to test an error path in an app with a service worker, make the **worker**
return the error, or unregister it first. Always confirm the status you got
(`playwright-cli requests`) rather than assuming the route took effect.

## 5. Capture evidence at the moment of failure

When a check fails, capture before you fix, and before you navigate away:

```bash
playwright-cli screenshot
playwright-cli console
playwright-cli requests
```

For anything non-obvious, record a trace:

```bash
playwright-cli tracing-start
# reproduce
playwright-cli tracing-stop
```

Record for each failure: what you expected, what actually happened, the exact
steps, and the evidence files. Separate what you observed from what you think
caused it. Write the observation as fact and the cause as a hypothesis, labelled.

## 6. Fix, then prove it stays fixed

Fix the implementation, re-run the failing check, then turn the failure into a
deterministic test so it cannot come back:

```bash
playwright-cli recording-start
# perform the flow once, by hand
playwright-cli recording-stop      # prints Playwright code with real locators
```

Prefer the locators the recorder produces (`getByRole`, `getByLabel`,
`getByText`, `getByTestId`) and web-first assertions. Reject generated code that
uses `waitForTimeout` or positional CSS selectors such as `div:nth-child(3)` —
those pass today and break next sprint.

## 7. Never heal a test into agreeing with a bug

When a test fails, classify the cause before changing anything:

| Cause                                            | Allowed action                                     |
| ------------------------------------------------ | -------------------------------------------------- |
| Locator moved, selector stale, waiting was flaky | Repair the test                                    |
| Implementation does not match the spec           | Fix the implementation                             |
| The spec itself looks wrong or outdated          | **Stop. Report the discrepancy. A human decides.** |

You may repair _how the test interacts with the application_. You may not
redefine _what the application is expected to do_. Changing an expected value so
the suite turns green is not healing — it is deleting the requirement.

## 8. Produce the handoff

End with a report, not a claim of success:

```
READY FOR QA — <change name>

Scenarios verified      <list, each with pass/fail>
Defects found and fixed <list, with the regression test added for each>
Tests added             <files>
Runtime checks          console / network / a11y / responsive — what was run
Not covered             <what you deliberately did not check, and why>
Remaining risks         <known limitations, flaky areas, unverified paths>
```

If anything is still failing, say so plainly and do not write "ready". A handoff
that hides a known defect costs more than no handoff at all.
