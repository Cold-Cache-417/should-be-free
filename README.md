# Tally — The most beautiful calculator

A fully functional, premium-looking calculator whose only crime is charging
**$20 to reveal the answer to 2 + 2**.

The calculator is real: full precedence arithmetic, decimals, percentage,
sign toggle, keyboard input, error handling. The prank is that pressing `=`
completes the calculation honestly — then locks the answer behind an
absurdly convincing paywall.

## The prank

1. Type a completely normal calculation.
2. Press `=`. The display blurs, "Calculating" pulses, the answer is computed
   and then locked behind a blurred mask.
3. A glassmorphic paywall springs in: *"Your answer is ready."*
4. Quick Answer **$20** · Pro Monthly **$250/mo** · Pro Yearly **$2,000/yr**
   *(Yes, I'm generous. I made it cheaper.)*
5. Any purchase triggers the same response:
   *"Payment infrastructure is currently experiencing a severe lack of
   common sense."* — and unlocks the answer anyway.

No payments are processed. No Stripe. No reality.

## Run it

```bash
npm install
npm run dev        # dev server
npm run test       # calculator engine + reducer unit tests
npm run build      # production build (also emits a self-contained dist/index.html)
npm run preview    # serve the production build
```

## Tech

- React 19 + TypeScript + Vite
- Tailwind CSS v4 design tokens
- `motion` for spring-based animation (reduced-motion aware)
- React Bits–style primitives written in-house: an ambient aurora
  background, spring sheet/modal choreography, staggered entrances
- Pure, tested calculator engine (`src/lib/calculator.ts`) with
  shunting-yard precedence evaluation

## Layout

```
src/
  lib/
    calculator.ts        # engine: tokenize, evaluate, format (pure)
    calcReducer.ts       # UI state machine (typing → revealing → locked → unlocked)
  components/
    Aurora.tsx           # ambient background
    calculator/          # Display, Keypad, Key, Calculator (orchestrator)
    paywall/             # Paywall modal + pricing tiers + reveal panel
    Footer.tsx
```

Made by @lxqmxn_24. DM me if you like this.
