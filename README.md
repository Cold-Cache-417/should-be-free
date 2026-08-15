# Should Be Free

**Normal apps. Absurd prices.**

A collection of beautifully engineered everyday apps — fully functional, absurdly
polished, and completely paywalled at the exact moment the result is ready.

Every app here does one simple thing and charges you for the outcome.

## Apps

| App | What it does | The joke |
| --- | --- | --- |
| **Calculator** | A real calculator: precedence, decimals, %, ±, keyboard input. | The answer costs $20. |
| **Coin Flip** | A fair coin with Epstein/Diddy engravings, riggable. | The result costs $5 — the rig costs $25. |
| **Stopwatch** | Bills you $10/minute the whole time it runs. | Pausing the meter costs $10. |
| **Weather** | Real forecasts in °C from Open-Meteo, every layer paywalled. | The temperature costs $5. The conditions cost $10. The details cost $15. |
| **Word Counter** | Counts your words as you type. | The count costs $8. |
| **Hacker Prank** | Reads the visitor's own browser back to them, live. | Nothing is stored — the scare is the prank. |

## The flow

Every app shares the same machinery, tuned per-app:

1. Use the app normally — it computes the result honestly in the background.
2. The moment the result is ready, it is **locked**: masked dots, a "Result
   locked" chip, and a glassmorphic paywall springs in.
3. Pick a tier (Quick Answer / Pro Monthly / Pro Yearly — the yearly is always
   "cheaper").
4. **Secure Checkout**: type your name, card, expiry, CVC. All manual, all
   validated, nothing leaves the browser.
5. "Processing payment…" → **Downloading your result** (Encrypting →
   Transmitting → Decrypting → Unlocking) with a progress bar.
6. A receipt with a receipt number, the card's last 4, the result — and the
   punchline: *"Our payment gateway is currently on a well-deserved coffee
   break."*
7. The result unlocks anyway. Then the next result costs you again.

No real payments. No tracking. No refunds. Not even for your dignity.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- `motion` for spring animation (with `prefers-reduced-motion` support)
- Zero payment code — the checkout is a faithful mock

## Dev

```bash
npm install
npm run dev      # local dev server
npm run test     # vitest (engine + reducer + coin + card)
npm run build    # typecheck + production build → dist/
```

## Admin analytics

Type **`admin`** anywhere on the site (or open `/#/admin`) for the full
console — total visits, sessions, engaged time, pages per session, per-app
usage and fake paywall purchases, 14-day / 24-hour / weekday / hour-of-day
series, countries, browsers, devices, OS families, device models, referrers,
screens, languages, sharing signals, and a searchable recent-visits table.
All anonymous aggregates: no names, no fingerprints, no per-visitor profiles.
Sessions are bucketed server-side from a transient hash of IP + UA with a
30-minute inactivity window — no identifiers stored or exposed. Bots and
crawlers are excluded from every human counter; messenger link previews
(WhatsApp / Telegram) are counted separately as a sharing signal.

The dashboard reads from a serverless API (`api/analytics.ts`) backed by
Upstash Redis. To turn it on:

1. Create a free [Upstash](https://upstash.com) Redis database.
2. In Vercel → your project → **Settings → Environment Variables**, add:
   - `UPSTASH_REDIS_REST_URL` — e.g. `https://xxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` — the REST token
3. Redeploy. Visits and app usage now count globally, from every visitor.
   Without the env vars the API answers 503 and the site silently falls back
   to per-browser localStorage counts.

## Deploy

`vercel.json` is already configured (framework: vite, output: `dist`). Import
the repo on Vercel and it just works — `should-be-free.vercel.app`.

Made by @lxqmxn_24. DM me if you like this.
