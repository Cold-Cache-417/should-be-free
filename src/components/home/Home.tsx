import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/cn";

interface AppCardData {
  id: string;
  name: string;
  description: string;
  price: string;
  href: string;
  available: boolean;
  icon: ReactNode;
}

const Apps: AppCardData[] = [
  {
    id: "calculator",
    name: "Calculator",
    description: "The most over-engineered calculator ever built. Every answer, for a small fee.",
    price: "Answers from $20",
    href: "#/calculator",
    available: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect x="3" y="2.5" width="18" height="19" rx="4" fill="none" stroke="currentColor" strokeWidth={2} />
        <rect x="7" y="6" width="4" height="4" rx="1" fill="currentColor" />
        <rect x="13" y="6" width="4" height="4" rx="1" fill="currentColor" />
        <rect x="7" y="12" width="4" height="4" rx="1" fill="currentColor" />
        <rect x="13" y="12" width="4" height="4" rx="1" fill="currentColor" />
        <rect x="7" y="18" width="10" height="1.6" rx="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "flip",
    name: "Coin Flip",
    description: "A coin, a flip, and a very expensive outcome. Perfectly fair odds. Unfair price.",
    price: "Results from $5",
    href: "#/flip",
    available: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="8.5" fill="currentColor" />
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="6" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
        <text
          x="12"
          y="15.4"
          textAnchor="middle"
          fontSize="10"
          fontWeight="800"
          fill="#5b3400"
          fontFamily="inherit"
        >
          $
        </text>
      </svg>
    ),
  },
  {
    id: "stopwatch",
    name: "Stopwatch",
    description: "Time is money. The timer is free — pausing it costs you.",
    price: "Pauses from $10",
    href: "#/stopwatch",
    available: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="13" r="8" />
        <path d="M9 2h6M12 5V2M12 13l3-2" />
      </svg>
    ),
  },
  {
    id: "weather",
    name: "Weather",
    description: "Today's forecast, free. Tomorrow's forecast, premium. The future costs money.",
    price: "Tomorrow from $10",
    href: "#/weather",
    available: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M12 2.5v1.5M12 12v1.5M5.5 8H4M20 8h-1.5M6.8 3.8l1 1M17.2 3.8l-1 1" />
        <path d="M6 17.5a3.5 3.5 0 0 1 .7-6.9A5 5 0 0 1 16.4 12 3 3 0 0 1 16 18.5H7" />
      </svg>
    ),
  },
  {
    id: "words",
    name: "Word Counter",
    description: "Counts your words. All of them. The counting is free, the count is not.",
    price: "Counts from $8",
    href: "#/words",
    available: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor" fontFamily="inherit">
          Aa
        </text>
        <path d="M5 19.5 9.5 5h1L15 19.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14.5h6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "hack",
    name: "Hacker Prank",
    description: "Send this link to a friend. It reads their own browser back to them, live. Nothing is stored. Send it anyway.",
    price: "Scares from $0",
    href: "#/hack",
    available: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 7 5 5-5 5" />
        <path d="M13 5l6 7-6 7" />
        <path d="M5 4.5l.01.01M7.5 3h.01" />
      </svg>
    ),
  },
];

const CoinMark = (
  <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full border border-amber-400/40 bg-[linear-gradient(155deg,#ffd98a,#f5a623_34%,#c97f0a_68%,#9a5c00)] shadow-[0_10px_30px_-8px_rgba(255,159,10,0.5)]">
    <span className="grid h-10 w-10 place-items-center rounded-full border border-[#8a5a00]/40 text-[22px] font-extrabold text-[#5b3400]">
      $
    </span>
  </span>
);

export function Home() {
  return (
    <div className="w-full max-w-[680px]">
      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          {CoinMark}
        </motion.div>
        <h1 className="font-display mt-5 text-[40px] font-semibold tracking-[-0.02em] text-zinc-50 sm:text-[48px]">
          Should Be Free
        </h1>
        <p className="mt-2 text-[15px] font-medium tracking-wide text-amber-300/90">
          Normal apps. Absurd prices.
        </p>
        <p className="mt-3 max-w-[420px] text-[13.5px] leading-relaxed text-zinc-500">
          A collection of beautifully engineered everyday tools. Free to open.
          Results are not. Every app here does one simple thing, and charges
          you for the outcome.
        </p>
      </motion.div>

      {/* apps */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } } }}
        className="mt-9 grid gap-3 sm:grid-cols-2"
      >
        {Apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </motion.div>

      {/* footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-8 text-center text-[11.5px] text-zinc-600"
      >
        No ads. No tracking. Just good apps, locked behind a very bad idea.
      </motion.p>
    </div>
  );
}

function AppCard({ app }: { app: AppCardData }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
      }}
      className={cn(app.available ? "" : "opacity-45")}
    >
      {app.available ? (
        <a
          href={app.href}
          className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-200 hover:border-amber-400/35 hover:bg-white/[0.055] hover:shadow-[0_16px_44px_-18px_rgba(255,159,10,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          <CardBody app={app} available />
        </a>
      ) : (
        <div
          aria-disabled
          className="flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <CardBody app={app} available={false} />
        </div>
      )}
    </motion.div>
  );
}

function CardBody({ app, available }: { app: AppCardData; available: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.05] text-amber-300 transition-transform duration-200 group-hover:scale-105">
          {app.icon}
        </span>
        {available ? (
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-amber-300">
            {app.price}
          </span>
        ) : (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Coming soon
          </span>
        )}
      </div>
      <h2 className="font-display mt-4 text-[19px] font-semibold tracking-[-0.01em] text-zinc-100">{app.name}</h2>
      <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-zinc-500">{app.description}</p>
      {available && (
        <span className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-amber-300 transition-transform duration-200 group-hover:translate-x-0.5">
          Open app
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      )}
    </>
  );
}
