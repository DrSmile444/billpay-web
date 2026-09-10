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

## 0. Install the browser driver

```bash
npx @playwright/cli@latest install --skills          # Claude Code
npx @playwright/cli@latest install --skills=agents   # Codex/others
```

It reuses an installed Chrome — no separate browser download. If you use the
Playwright MCP server instead, the ladder below is identical; only the syntax
differs.

## 1. Learn the application before hunting

```bash
playwright-cli open <url>
playwright-cli snapshot
```

`snapshot` prints refs like `[ref=e13]`. **Every element command takes the ref,
not the text:**

```bash
playwright-cli click e13                 # correct
playwright-cli click "Pay bill"          # error: does not match any elements
playwright-cli find "Pay"                # locate first, then click the ref
```

**Refs go stale, and that is the single biggest time sink.** Any re-render or
navigation invalidates them. A stale ref either errors (`Ref e11 not found`) or,
worse, acts on a different element and you never notice. Rule: **run `snapshot`
immediately before every `click`, `fill` or `select`.**

**`open` resets the viewport.** If you resize to a phone width and then call
`open`, you are measuring at 1280px again and will report "no overflow" on a page
that overflows. Order is always `open` → `resize` → measure.

Fastest way to read the page after an action:

```bash
playwright-cli eval "() => document.body.innerText" --raw
```

Use `--raw` whenever you want greppable output instead of a formatted block.

Identify the core user journeys — the three to five flows that, if broken, make
the product useless. Walk each one once, end to end, without looking for bugs.
You cannot recognise wrong behaviour until you know what right looks like.

Write down the journeys before continuing.

## 2. Plan in three rounds

**Round 1 — Functional.** For each journey: action → expected result.

**Round 2 — Adversarial.** Not a list of nouns — a list of values. Into every
numeric field: `0`, a negative, `0.005`, `1e3`, `999999999999`, `100,50` with a
comma, a leading space, and letters. Into **every free-text field**, without
exception:

```
<img src=x onerror="window.__x=1">
```

then check `window.__x` afterwards. That one string finds the defect class that
matters most in a payments app, and nothing else in this round will prompt you
to try it.

Then the interaction cases: the same action twice in quick succession, refresh
mid-flow, back and forward navigation, keyboard-only operation, and loading,
error and empty states.

**If a screen aggregates records, combine records that differ** — different
currency, different status, different number of child rows. Totals and summaries
break on mixed input far more often than on uniform input, and a screen full of
identical fixtures will never show it.

**Round 3 — Coverage gaps.** Accessibility, mobile viewport, console output,
failed network calls, visual consistency between neighbouring screens.

Merge into one numbered plan. Then execute it — do not keep re-planning.

## 3. Use the right instrument for each question

Work top-down. Everything you can measure, measure. Vision is the last rung.

| Question                                      | Command                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Did anything throw?                           | `playwright-cli console`                                                                                                                                                                                                                                                                                      |
| Did a request fail, or fire twice?            | `playwright-cli requests` then `request <n>`                                                                                                                                                                                                                                                                  |
| What did the server actually return?          | `playwright-cli response-body <n>`                                                                                                                                                                                                                                                                            |
| **Does the screen match the data?**           | compare `response-body <n>` field by field against `eval "() => document.body.innerText" --raw`                                                                                                                                                                                                               |
| Size, font, spacing of an element             | `playwright-cli eval "() => { const el = document.querySelector('<css>'); const r = el.getBoundingClientRect(); const s = getComputedStyle(el); const p = getComputedStyle(el.parentElement); return {h:r.height, w:r.width, right:r.right, fontSize:s.fontSize, parentGap:p.gap, parentWrap:p.flexWrap}; }"` |
| Is the control reachable and correctly named? | `playwright-cli snapshot` — check role and accessible name                                                                                                                                                                                                                                                    |
| Does it survive a phone viewport?             | `playwright-cli resize 375 812` then re-measure                                                                                                                                                                                                                                                               |
| What happens on a server error?               | `playwright-cli route "<path>" --status 500` — see the note below                                                                                                                                                                                                                                             |
| What happens with no network?                 | `playwright-cli network-state-set offline`                                                                                                                                                                                                                                                                    |
| Does the page look right?                     | `playwright-cli screenshot` — judgment, last resort                                                                                                                                                                                                                                                           |

A misaligned button is a measurement, not an impression. A duplicated request is
a network entry, not a suspicion.

**Prefer a CSS selector over a ref inside `eval`.** `eval "<fn>" <ref>` is
fragile even on a ref a fresh snapshot just produced; `eval "() =>
document.querySelector('…')…"` is reliable.

**The highest-yield technique in this list is the API-versus-DOM comparison.**
Read what the endpoint returned, then read what the screen shows, and compare
field by field. Wrong totals, wrong dates, values stored at a precision the UI
does not display — all of them surface here and nowhere else.

### Traps that will cost you time

**Key names are case-sensitive.** `press tab` does nothing — no error, exit 0.
`press Tab` works. Use `Tab`, `Enter`, `Space`, `ArrowLeft`. Focus an element
before keyboard testing; a freshly opened page starts with focus nowhere useful.

**`requests` is empty right after `goto`.** Reload once before reading it, and
pass `--static` for anything beyond XHR/fetch.

**Development servers double-fire requests.** React StrictMode runs effects
twice in dev, so every API call shows up twice. That is the dev server, not a
defect — do not file it. A real double-submit differs: one user action, two
identical requests to the same endpoint.

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

State the environment **once at the top of your report** — browser, OS,
viewport, build, timezone — and keep each defect block light:

```
[Screen][Severity] Short factual symptom

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

## 7. Turn the important ones into tests (optional)

Skip this while you are hunting; come back to it once a defect is confirmed and
someone has decided it must never return. Then record the flow and keep the
generated code:

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
