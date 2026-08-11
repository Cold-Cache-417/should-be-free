import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Aurora } from "./components/Aurora";
import { Footer } from "./components/Footer";
import { Home } from "./components/home/Home";
import { Calculator } from "./components/calculator/Calculator";
import { CoinFlip } from "./components/coin/CoinFlip";
import { Stopwatch } from "./components/stopwatch/Stopwatch";
import { Weather } from "./components/weather/Weather";
import { WordCounter } from "./components/words/WordCounter";
import { HackerPrank } from "./components/hack/HackerPrank";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ANALYTICS_KEY, loadAnalytics, saveAnalytics, withApp, withVisit } from "./lib/analytics";
import { useHashRoute } from "./lib/useHashRoute";

const LogoMark = (
  <span
    aria-hidden
    className="grid h-7 w-7 place-items-center rounded-full border border-amber-400/40 bg-[linear-gradient(155deg,#ffd98a,#f5a623_40%,#c97f0a)] shadow-[0_4px_14px_-4px_rgba(255,159,10,0.6)]"
  >
    <span className="text-[13px] font-extrabold text-[#5b3400]">$</span>
  </span>
);

function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="mb-7 flex flex-col items-center sm:mb-8"
    >
      <a
        href="#/"
        className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      >
        <span className="transition-transform duration-200 group-hover:scale-105">{LogoMark}</span>
        <h1 className="font-display text-[21px] font-semibold tracking-[-0.01em] text-zinc-100">
          Should Be Free
        </h1>
        <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Pro
        </span>
      </a>
      <p className="mt-2 text-[12.5px] text-zinc-500">
        Normal apps. Absurd prices.
      </p>
    </motion.header>
  );
}

/** Small "back to all apps" affordance on app pages. */
function BackLink() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mb-4 w-full max-w-[400px]"
    >
      <a
        href="#/"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path d="M19 12H5m6-6-6 6 6 6" />
        </svg>
        All apps
      </a>
    </motion.div>
  );
}

export default function App() {
  const route = useHashRoute();
  const [adminOpen, setAdminOpen] = useState(false);
  const visitedRef = useRef(false);
  const lastAppRef = useRef<string | null>(null);
  const adminBuf = useRef("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const page =
    route === "/calculator"
      ? "calculator"
      : route === "/flip"
        ? "flip"
        : route === "/stopwatch"
          ? "stopwatch"
          : route === "/weather"
            ? "weather"
            : route === "/words"
              ? "words"
              : route === "/hack"
                ? "hack"
                : "home";

  const store = {
    get: () => localStorage.getItem(ANALYTICS_KEY),
    set: (v: string) => localStorage.setItem(ANALYTICS_KEY, v),
  };

  /* Aggregate analytics — one visit per page load. */
  useEffect(() => {
    if (visitedRef.current) return;
    visitedRef.current = true;
    saveAnalytics(withVisit(loadAnalytics(store)), store);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Which app was used, on every route change. */
  useEffect(() => {
    if (lastAppRef.current === page) return;
    lastAppRef.current = page;
    saveAnalytics(withApp(loadAnalytics(store), page), store);
  }, [page]);

  /* Type "admin" anywhere to open the dashboard. */
  useEffect(() => {
    const target = "admin";
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      adminBuf.current = (adminBuf.current + e.key.toLowerCase()).slice(-target.length);
      if (adminBuf.current === target) {
        adminBuf.current = "";
        setAdminOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Read fresh counts whenever the dashboard opens. */
  const analytics = useMemo(() => loadAnalytics(store), [adminOpen]);

  const dashboard = (
    <AnimatePresence>
      {adminOpen && <AdminDashboard analytics={analytics} onClose={() => setAdminOpen(false)} />}
    </AnimatePresence>
  );

  /* The prank takes over the whole screen — no header, no footer. */
  if (page === "hack") {
    return (
      <MotionConfig reducedMotion="user">
        <HackerPrank />
        {dashboard}
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:py-12">
        <Aurora />
        <Header />
        <motion.main
          key={page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="flex w-full flex-col items-center"
        >
          {page === "home" && <Home />}
          {page === "calculator" && (
            <>
              <BackLink />
              <Calculator />
            </>
          )}
          {page === "flip" && (
            <>
              <BackLink />
              <CoinFlip />
            </>
          )}
          {page === "stopwatch" && (
            <>
              <BackLink />
              <Stopwatch />
            </>
          )}
          {page === "weather" && (
            <>
              <BackLink />
              <Weather />
            </>
          )}
          {page === "words" && (
            <>
              <BackLink />
              <WordCounter />
            </>
          )}
        </motion.main>
        <Footer />
        {dashboard}
      </div>
    </MotionConfig>
  );
}
