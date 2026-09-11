---
name: qa-explore
description: Explore a running web application as a QA engineer would - find defects, prove them, capture evidence, and write reports a developer can act on. Use when asked to test an application, hunt for bugs, do exploratory QA, or turn a vague observation into a filed ticket.
allowed-tools: mcp__playwright__* Read Grep Glob Bash
---

# QA Exploration

Your job is to break the application, then prove it. Finding something suspicious
is the easy half; the half with value is proving it is real, reproducible, and
worth a developer's time.

Two rules govern everything below:

- **Report nothing you have not reproduced.** An unreproduced observation is a
  note to yourself, not a defect.
- **Measure before you judge.** If a browser API can answer the question, an
  opinion is not evidence.

## 0. What you need

The Playwright MCP server. In Claude Code it comes from a `.mcp.json` in the
repository; otherwise:

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest   # Claude Code
codex mcp add playwright -- npx -y @playwright/mcp@latest    # Codex, config is global
```

## 1. Learn the application before hunting

`browser_navigate` to the app, then `browser_snapshot`.

Identify the core user journeys — the three to five flows that, if broken, make
the product useless. Walk each one once, end to end, **without looking for
bugs**. You cannot recognise wrong behaviour until you know what right looks
like. Write the journeys down before continuing.

`browser_snapshot` returns refs like `e13`, and every element action takes the
ref. **Refs go stale on any re-render or navigation** — a stale ref either errors
or silently acts on a different element. Take a fresh snapshot immediately before
every click or fill.

## 2. Plan in three rounds

**Round 1 — Functional.** For each journey: action → expected result.

**Round 2 — Adversarial.** Not categories, values. Into every numeric field:
`0`, a negative, `0.005`, `1e3`, `999999999999`, `100,50` with a comma, a leading
space, letters. Into **every free-text field**, without exception:

```
<img src=x onerror="window.__x=1">
```

then check `window.__x` with `browser_evaluate`. That one string finds the defect
class that matters most, and nothing else in this round will prompt you to try
it.

Then the interaction cases: the same action twice quickly, refresh mid-flow,
back and forward navigation, keyboard-only operation, loading and error and empty
states.

**If a screen aggregates records, combine records that differ** — different
currency, status, number of child rows. Totals break on mixed input far more
often than on uniform input, and a screen of identical fixtures never shows it.

**Round 3 — Coverage gaps.** Accessibility, mobile viewport, console output,
failed network calls, visual consistency between neighbouring screens.

Merge into one numbered plan, then execute it. Stop re-planning.

## 3. Use the right instrument for each question

Work top-down. Everything you can measure, measure. Vision is the last rung.

| Question                             | Tool                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Did anything throw?                  | `browser_console_messages`                                                                                           |
| Did a request fail, or fire twice?   | `browser_network_requests`, then `browser_network_request`                                                           |
| What did the server actually return? | `browser_network_request` — read the response body                                                                   |
| **Does the screen match that data?** | compare the body field by field against `browser_evaluate` → `document.body.innerText`                               |
| Size, font, spacing of an element    | `browser_evaluate` → `getBoundingClientRect()` and `getComputedStyle()`, including the parent's `gap` and `flexWrap` |
| Is the control reachable and named?  | `browser_snapshot` — check role and accessible name                                                                  |
| What is in browser storage?          | `browser_evaluate` → `Object.entries(localStorage)`                                                                  |
| Does it survive a phone viewport?    | `browser_resize` to 375×812, then measure again                                                                      |
| Does the page look right?            | `browser_take_screenshot` — judgment, last resort                                                                    |

A misaligned button is a measurement, not an impression. A duplicated request is
a network entry, not a suspicion.

**The highest-yield technique here is the API-versus-DOM comparison.** Read what
the endpoint returned, read what the screen shows, compare field by field. Wrong
totals, off-by-one dates, values stored at a precision the UI hides — all of them
surface there and nowhere else.

**Always give `browser_take_screenshot` a path under `.playwright-mcp/`.** A bare
filename writes to the project root and silently overwrites a tracked file of the
same name.

### Traps that will cost you time

**Key names are case-sensitive.** `browser_press_key` with `tab` does nothing and
reports no error; `Tab` works. Use `Tab`, `Enter`, `Space`, `ArrowLeft`. Focus an
element before keyboard testing.

**Navigation resets the viewport.** Resize, then navigate, and you are measuring
at desktop width again — a false negative on exactly the screen you meant to
check. Order: navigate, then resize, then measure.

**The network list is empty right after a navigation.** It fills as the page
makes calls; reload once before reading it.

**Development servers double-fire requests.** React StrictMode runs effects twice
in dev, so every API call appears twice. That is the dev server, not a defect. A
real double-submit looks different: one user action, two identical requests.

**You cannot force an error response from the tool layer.** If the application
serves its API through a service worker, the worker answers before anything you
could intercept. To exercise an error path, make the application itself produce
the error, and confirm the status you actually got rather than assuming.

## 4. Prove it before you write it up

For every candidate:

1. Reload and reproduce from a clean state.
2. Reproduce a second time. If it only happens sometimes, record how often (for
   example 2 of 5) and say so — do not call it deterministic.
3. Reduce to the shortest sequence that still triggers it.
4. Capture evidence **at the moment of failure**, before navigating away:
   `browser_take_screenshot`, `browser_console_messages`, `browser_network_requests`.

If a candidate does not reproduce, drop it. A false positive costs a developer
more than a missed minor defect, because it spends their trust as well as their
time.

## 5. Separate what you saw from what you think

```
Observation: the total stays at 20.00 after adding a second item of 20.00.
Hypothesis:  the total may be reading the first item instead of summing.
```

You watched the screen; you did not read the code. Never present a hypothesis as
a cause.

## 6. Write the ticket

State the environment **once at the top of the report** — browser, OS, viewport,
build, timezone. Keep each defect light. One defect per ticket. The title states
the symptom, not the guess.

```
[Screen][Severity] Short factual symptom

Preconditions
- what must exist first

Steps to reproduce
1. ...

Actual
what happened

Expected
what should have happened, and why you believe that — a spec, a neighbouring
screen, a stated convention

Reproducibility
3 of 3

Impact
what a real user loses

Evidence
screenshot, console output, failed request
```

If you cannot state Expected **with a reason**, you have a question, not a
defect. Ask it instead of filing it.

## 7. Turn a confirmed defect into a test

You already walked the scenario with the browser tools, so you know the real
structure of the page — not a guess at it. Write the test from what you saw.

Prefer user-facing locators (`getByRole`, `getByLabel`, `getByText`) and
web-first assertions. Reject `waitForTimeout` and positional selectors such as
`div:nth-child(3)`: they pass today and fail next sprint for unrelated reasons.

This is the step that changes what the agent is for. Finding a defect once is
useful; reproducing it on demand is what keeps it fixed.

## 8. Close out honestly

Report what you covered, what you found, and what you did not look at. A QA pass
that claims coverage it did not perform is worse than one that names its gaps.
