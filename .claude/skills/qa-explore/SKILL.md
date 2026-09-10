---
name: qa-explore
description: Explore a running web application as a QA engineer would - find defects, prove them, capture evidence, and write reports that a developer can act on. Use when asked to test an application, hunt for bugs, do exploratory QA, or turn a vague observation into a filed ticket.
allowed-tools: Bash(playwright-cli:*) Read Grep Glob
---

# QA Exploration

Your job is to break the application, then prove it. Finding something suspicious
is the easy half; the half that has value is proving it is real, reproducible,
and worth a developer's time.

Two rules govern everything below:

- **Report nothing you have not reproduced.** An unreproduced observation is a
  note to yourself, not a defect.
- **Measure before you judge.** If a browser API can answer the question, a
  model's opinion is not evidence.

## 1. Learn the application before hunting

```bash
playwright-cli open <url>
playwright-cli snapshot
```

Identify the core user journeys — the three to five flows that, if broken, make
the product useless. Walk each one once, end to end, without looking for bugs.
You cannot recognise wrong behaviour until you know what right looks like.

Write down the journeys before continuing.

## 2. Plan in three rounds

**Round 1 — Functional.** For each journey: action → expected result.

**Round 2 — Adversarial.** Empty input, boundary values, invalid formats, the
same action twice in quick succession, refresh mid-flow, back and forward
navigation, keyboard-only operation, loading and error and empty states.

**Round 3 — Coverage gaps.** Accessibility, mobile viewport, console output,
failed network calls, visual consistency between neighbouring screens.

Merge into one numbered plan. Then execute it — do not keep re-planning.

## 3. Use the right instrument for each question

Work top-down. Everything you can measure, measure. Vision is the last rung.

| Question | Command |
|---|---|
| Did anything throw? | `playwright-cli console` |
| Did a request fail, or fire twice? | `playwright-cli requests` then `request <n>` |
| What did the server actually return? | `playwright-cli response-body <n>` |
| Size, font, spacing, colour of an element | `playwright-cli eval "el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return {h:r.height, w:r.width, fontSize:s.fontSize, gap:s.gap}; }" <ref>` |
| Is the control reachable and correctly named? | `playwright-cli snapshot` — check role and accessible name |
| Does it survive a phone viewport? | `playwright-cli resize 375 812` then re-measure |
| What happens on a server error? | `playwright-cli route "<path>" --status 500` — see the note below |
| What happens with no network? | `playwright-cli network-state-set offline` |
| Does the page look right? | `playwright-cli screenshot` — judgment, last resort |

A misaligned button is a measurement, not an impression. A duplicated request is
a network entry, not a suspicion.

### Where `route` works, and where it silently does not

`playwright-cli route <pattern> --status 500` rewrites a response — but only for
requests that actually reach the browser's network layer. If the application
runs a **service worker** that already answers that path (Mock Service Worker,
an offline cache, a PWA shell), the service worker responds first and the route
handler never fires. Nothing errors; you simply get the original response and
may conclude the error path works when it was never exercised.

Verified behaviour on a page with a service worker mocking `/api/bills`:

| Target | Result |
|---|---|
| `route "**/api/bills"` — path the worker handles | route ignored, worker's 200 returned |
| `route "**/api/other"` — path the worker ignores | route applied, forced 500 returned |

So: to test an error path in an app with a service worker, make the **worker**
return the error, or unregister it first. Always confirm the status you got
(`playwright-cli requests`) rather than assuming the route took effect.


## 4. Prove it before you write it up

For every candidate defect:

1. Reload the page and reproduce it from a clean state.
2. Reproduce it a second time. If it only happens sometimes, record how often
   (for example 2 of 5) and say so — do not describe it as deterministic.
3. Reduce the steps to the shortest sequence that still triggers it.
4. Capture evidence **at the moment of failure**, before navigating away:

```bash
playwright-cli screenshot
playwright-cli console
playwright-cli requests
```

If a candidate does not reproduce, drop it. A false positive costs a developer
more than a missed minor defect, because it spends their trust as well as their
time.

## 5. Separate what you saw from what you think

Write findings in two labelled parts:

```
Observation: the total stays at 20.00 UAH after adding a second bill of 20.00.
Hypothesis:  the total may be reading the first item instead of summing.
```

Never present a hypothesis as a cause. You did not read the code; you watched
the screen.

## 6. Write the ticket

One defect per ticket. Title states the symptom, not the guess.

```
[Screen][Browser] Short factual symptom

Environment
- browser + version, OS, viewport, URL/build

Preconditions
- what must exist first

Steps to reproduce
1. ...
2. ...

Actual
what happened

Expected
what should have happened, and why you believe that (spec, neighbouring
screen, common convention)

Reproducibility
3 of 3

Impact
what a real user loses because of this

Evidence
- screenshot, console output, failed request, trace
```

If you cannot state Expected with a reason, you have a question, not a defect.
Ask it instead of filing it.

## 7. Turn the important ones into tests

For defects that must never return, record the flow and keep the generated code:

```bash
playwright-cli recording-start
# reproduce the defect path by hand
playwright-cli recording-stop
```

Keep the user-facing locators the recorder emits (`getByRole`, `getByLabel`,
`getByText`). Reject `waitForTimeout` and positional selectors such as
`div:nth-child(3)` — they pass today and fail next sprint for unrelated reasons.

## 8. Close out honestly

Report what you covered, what you found, and what you did not look at. A QA pass
that claims full coverage it did not perform is worse than one that names its
gaps.
