# BillPay Web

A small React front-end for a bill-payment flow: list bills, open a bill, pay it, read the receipt.

**Live demo:** https://drsmile444.github.io/billpay-web/

> ⚠️ **This is a QA training playground.** The application contains deliberate defects — functional, visual, accessibility and security. Do not use any of this code as a reference implementation, and do not copy it into a real product. The defects are not listed here on purpose: finding them is the exercise.

## Setup for the workshop

Clone the repo. Everything an agent needs is already committed — nothing else to configure.

```bash
git clone https://github.com/DrSmile444/billpay-web.git
cd billpay-web
npm install          # only needed for the developer exercise; QA testing needs the live URL only
```

**Browser control for your agent.** The workshop runs on the Playwright MCP server,
which gives the agent a real browser: it can navigate, read the accessibility tree,
inspect the console and the network, measure elements and take screenshots.

Claude Code picks the server up from the committed `.mcp.json` when you open the
repo — nothing to do. **Codex does not read `.mcp.json`**; its MCP config is global,
so add the server once:

```bash
codex mcp add playwright -- npx -y @playwright/mcp@latest
```

If you need it in Claude Code outside this repo:

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

**Workshop skills** ship in this repo for both agents:

| Skill          | Use it for                                                                             |
| -------------- | -------------------------------------------------------------------------------------- |
| `qa-explore`   | Testing the running app: explore, prove a defect, capture evidence, write the ticket   |
| `ready-for-qa` | Before handing your own change to QA: spec check, runtime verification, handoff report |

## What it is

A browser-only application. There is no backend to install or run: every HTTP call is intercepted by
[Mock Service Worker](https://mswjs.io) v2 in a service worker, so the requests are real `fetch`
calls that appear in the browser network panel with real status codes, headers and JSON bodies.

The API contract mirrors the NestJS `billpay-lab` service:

| Method | Path                     | Purpose                                          |
| ------ | ------------------------ | ------------------------------------------------ |
| GET    | `/api/bills`             | List bills                                       |
| POST   | `/api/bills`             | Create a bill                                    |
| GET    | `/api/bills/:id`         | Read one bill                                    |
| GET    | `/api/bills/:id/history` | Payment history for a bill                       |
| POST   | `/api/bills/:id/pay`     | Pay a bill (accepts an `Idempotency-Key` header) |
| GET    | `/api/bills/:id/receipt` | Receipt for a paid bill                          |

A bill has `id`, `amount`, `currency` (`UAH` / `USD`), `recipient` (`id`, `name`, `email`),
`status` (`unpaid` / `paid`), `createdAt` and `paidAt`. State lives in memory in the service worker
mock, so it resets when the page reloads.

## Screens

`Bills list` → `Bill detail` → `Pay` → `Receipt`, plus a `New bill` form.
Routing is hash based (`#/bills/:id`), which keeps deep links working on GitHub Pages.

## Run locally

```bash
npm install
npm run dev
```

Open the URL that Vite prints. Other scripts:

```bash
npm run build        # type-check and build to dist/
npm run preview      # serve the production build
npm run lint         # ESLint
npm run format       # Prettier
```

## Deployment

Pushing to `main` builds the app and publishes `dist/` to GitHub Pages through
`.github/workflows/deploy.yml`. Two things make the mocks work on a project subpath:

- `vite.config.ts` sets `base: '/billpay-web/'`;
- the worker is started from that same subpath, so its service-worker scope covers the app:

  ```ts
  worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
  ```

The app renders only after `worker.start()` resolves, so the first request on a cold load is
already intercepted.

## Stack

React 19, TypeScript, Vite, React Router, MSW v2, ESLint, Prettier.
