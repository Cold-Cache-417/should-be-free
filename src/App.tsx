import { MotionConfig, motion } from "motion/react";
import { Aurora } from "./components/Aurora";
import { Calculator } from "./components/calculator/Calculator";
import { Footer } from "./components/Footer";

const LogoMark = (
  <span
    aria-hidden
    className="grid h-7 w-7 place-items-center rounded-[9px] border border-white/10 bg-[#181820] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.6)]"
  >
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <rect x="2" y="6.2" width="12" height="1.6" rx="0.8" fill="#ff9f0a" />
      <rect x="2" y="9.6" width="12" height="1.6" rx="0.8" fill="#ff9f0a" />
    </svg>
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
      <div className="flex items-center gap-2.5">
        {LogoMark}
        <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-zinc-100">
          Tally
        </h1>
        <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Pro
        </span>
      </div>
      <p className="mt-2 text-[12.5px] text-zinc-500">
        The calculator for people who take numbers seriously.
      </p>
    </motion.header>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:py-12">
        <Aurora />
        <Header />
        <Calculator />
        <Footer />
      </div>
    </MotionConfig>
  );
}
