# billpay-web

A React + TypeScript bill-payment front end used as a **QA training playground**.
There is no backend: every `/api/*` call is served by a Mock Service Worker
(`src/mocks/`), so requests are real `fetch` calls with real statuses and bodies.

## The most important rule

**This repository contains deliberate defects.** Functional, visual,
accessibility and security. They are the training exercise.

Do not fix them. Do not "clean up" code that looks wrong. Do not add validation,
escape output, guard double submissions, or correct spacing and font sizes
unless a task explicitly asks you to fix that specific defect. Silently repairing
a planted defect destroys the exercise for everyone else.

If you notice something wrong while doing unrelated work, mention it and leave it
alone.

## Stack and commands

React 19, TypeScript, Vite, React Router (hash routing), MSW v2. No test runner.

| Command                | What it does                           | Enforced in CI |
| ---------------------- | -------------------------------------- | -------------- |
| `npm run dev`          | Dev server on `http://localhost:5173/` | —              |
| `npm run lint`         | ESLint                                 | yes            |
| `npm run build`        | `tsc -b && vite build`                 | yes            |
| `npm run format:check` | Prettier check                         | no             |

The linter is **ESLint**. There is no oxlint in this project.

Note that the dev server runs React in StrictMode, so every effect fires twice
and each API call appears twice in the network panel. That is the dev server, not
a defect.

## Skills in this repo

| Skill          | Use it for                                                                              |
| -------------- | --------------------------------------------------------------------------------------- |
| `qa-explore`   | Testing the running app: explore, prove a defect, capture evidence, write the ticket    |
| `ready-for-qa` | Before handing your own change onward: spec check, runtime verification, handoff report |

Both are committed for Claude Code (`.claude/skills/`) and for agents reading
`.agents/skills/`. Playwright MCP is preconfigured in `.mcp.json`.

## OpenSpec

`openspec/` holds the change workflow. `/opsx:verify` is committed in
`.claude/commands/opsx/`. Do not run `openspec init` again — the profile that
enables `verify` lives in a global per-machine config, so re-initialising on a
fresh machine drops the command.
