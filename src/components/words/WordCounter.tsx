import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paywall } from "../paywall/Paywall";
import { analyze } from "../../lib/count";

const REVEAL_TIERS = [
  {
    id: "wc-count",
    name: "Reveal the Count",
    price: "$8",
    period: "one-time",
    description: "Your numbers, released from custody.",
    badge: "Your words",
    featured: true,
    cta: "Reveal my count",
  },
  {
    id: "wc-monthly",
    name: "Count Monthly",
    price: "$500",
    period: "/month",
    description: "Unlimited counting, all month.",
    cta: "Count monthly",
  },
  {
    id: "wc-yearly",
    name: "Count Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of numbers.",
    note: "Yes, it's cheaper.",
    cta: "Count yearly",
  },
];

const SAMPLE = `The counter is free. The count is not.

Type anything — your words are counted instantly, stored in memory, and locked behind a very small fee. The math has been done. It always was.

This is the joke: you wrote the words, you can feel how many there are, and yet the number is premium. Words: four hundred and eighty seven, probably. We're not telling.`;

function Metric({ label, value, locked }: { label: string; value: string; locked: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3.5">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      {locked ? (
        <motion.p
          key="locked"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-1 flex items-center gap-2 text-[26px] font-light tracking-[0.25em] text-zinc-500"
          aria-hidden
        >
          ••••
        </motion.p>
      ) : (
        <motion.p
          key="revealed"
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="font-display mt-1 text-[26px] font-semibold tabular-nums tracking-[-0.01em] text-amber-300"
        >
          {value}
        </motion.p>
      )}
    </div>
  );
}

export function WordCounter() {
  const [text, setText] = useState(SAMPLE);
  const [unlocked, setUnlocked] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const r = useMemo(() => analyze(text), [text]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.9, delay: 0.08 }}
        className="relative w-full max-w-[400px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3.5rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(255,159,10,0.07),transparent_70%)]"
        />

        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.09] bg-[linear-gradient(180deg,#181820_0%,#121218_45%,#0e0e12_100%)] p-5 shadow-[0_40px_90px_-24px_rgba(0,0,0,0.75),0_16px_40px_-20px_rgba(0,0,0,0.55)] sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />

          {/* header */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
              Word Counter
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Counting free · Count $8
            </span>
          </div>

          <h2 className="font-display mt-4 text-[26px] font-semibold tracking-[-0.01em] text-zinc-50">
            Your words, in custody.
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
            The counter is free. The count is not. Type away — the math is
            done the moment you hit a key.
          </p>

          {/* the editor */}
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/25 focus-within:border-amber-400/40 focus-within:ring-2 focus-within:ring-amber-400/20">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              spellCheck={false}
              aria-label="Your text"
              placeholder="Start typing — your count is being held hostage."
              className="h-full w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 text-[13.5px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none"
            />
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
              <span className="text-[10.5px] text-zinc-600">
                {unlocked ? `${r.chars} characters in the room` : "Text is being counted…"}
              </span>
              <span className="flex items-center gap-1 text-[10.5px] font-medium text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                Live
              </span>
            </div>
          </div>

          {/* metrics */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Words" value={String(r.words)} locked={!unlocked} />
            <Metric label="Characters" value={String(r.chars)} locked={!unlocked} />
            <Metric label="Sentences" value={String(r.sentences)} locked={!unlocked} />
            <Metric label="Read time" value={`~${r.readingMinutes} min`} locked={!unlocked} />
          </div>

          <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
            <span className="text-[11.5px] font-medium text-zinc-300">Most-used word</span>
            {unlocked ? (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
                className="font-display text-[15px] font-semibold italic text-amber-300"
              >
                “{r.topWord ?? "—"}”
              </motion.span>
            ) : (
              <span className="text-[14px] tracking-[0.25em] text-zinc-600" aria-hidden>
                ••••
              </span>
            )}
          </div>

          {/* unlock */}
          {!unlocked && (
            <button
              type="button"
              onClick={() => setPaywallVisible(true)}
              className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] text-[14px] font-semibold text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
            >
              Reveal the count — $8
            </button>
          )}
          {unlocked && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-4 text-center text-[12px] leading-relaxed text-zinc-500"
            >
              You paid $8 to count words <em className="text-zinc-300">you just typed</em>. Baller.
            </motion.p>
          )}

          <p className="mt-3 text-center text-[10.5px] text-zinc-600">
            Zero words stored. The count lives in RAM, then in your wallet.
          </p>
        </div>
      </motion.section>

      <AnimatePresence>
        {paywallVisible && (
          <Paywall
            key="wc-paywall"
            tiers={REVEAL_TIERS}
            value={String(r.words)}
            line="Word count"
            masked="••••"
            brand="Word Counter"
            receiptBrand="WORD COUNTER"
            filename="word_count.bin"
            headline="Your count is ready."
            subline="We counted your words the instant you typed them. The number is encrypted and awaiting release — a premium feature."
            checkoutNote="Your count has been computed and is waiting. Enter payment details to release it."
            returnLabel="Back to my words"
            dialogLabel="Unlock your word count"
            onClose={() => setPaywallVisible(false)}
            onUnlock={() => setUnlocked(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
