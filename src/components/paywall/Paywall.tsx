import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  cardBrand,
  formatCardNumber,
  formatExpiry,
  last4,
  moneyFor,
  validateCard,
  type CardErrors,
  type CardFields,
} from "../../lib/card";
import { cn } from "../../lib/cn";

type View = "tiers" | "checkout" | "downloading" | "receipt";

export interface PaywallTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  note?: string;
  badge?: string;
  featured?: boolean;
  cta: string;
}

interface PaywallProps {
  tiers: PaywallTier[];
  /** The revealed value, e.g. "4" or "HEADS". */
  value: string;
  /** Line shown in the locked preview / download / receipt, e.g. "2 + 2 =" or "Flip #2". */
  line?: string;
  /** Masked placeholder while locked, e.g. "••••". */
  masked?: string;
  /** Chip label in the top-left, e.g. "Calculator Pro". */
  brand?: string;
  /** Brand printed on the receipt, e.g. "CALCULATOR PRO". */
  receiptBrand?: string;
  /** Filename used in the "downloading" phase. */
  filename?: string;
  headline?: string;
  subline?: string;
  checkoutNote?: string;
  returnLabel?: string;
  dialogLabel?: string;
  onClose: () => void;
  /** Called the moment the (fake) payment succeeds, so the app can unlock. */
  onUnlock: (tier: PaywallTier) => void;
}

const LockGlyph = (
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
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const CloseGlyph = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export function Paywall({
  tiers,
  value,
  line,
  masked = "••••",
  brand = "Pro",
  receiptBrand = "PRO",
  filename = "answer_encrypted.bin",
  headline = "Your answer is ready.",
  subline = "Your request completed successfully. The result has been encrypted and is awaiting release — a premium feature.",
  checkoutNote = "Your answer is calculated and waiting. Enter payment details to release it.",
  returnLabel = "Return",
  dialogLabel = "Unlock your result",
  onClose,
  onUnlock,
}: PaywallProps) {
  const [view, setView] = useState<View>("tiers");
  const [tier, setTier] = useState<PaywallTier | null>(null);
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState<CardFields>({ name: "", number: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<CardErrors>({});
  /* Capture the locked line/value once on open — the app behind unlocks the
     moment payment succeeds, which would otherwise blank these out. */
  const [meta] = useState(() => ({ line: line ?? "", value }));
  const timers = useRef<number[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const startCheckout = (t: PaywallTier) => {
    setTier(t);
    setErrors({});
    setView("checkout");
  };

  const backToTiers = () => {
    setView("tiers");
    setErrors({});
  };

  const submitPayment = () => {
    if (processing) return;
    const errs = validateCard(card);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setProcessing(true);
    timers.current.push(
      window.setTimeout(() => {
        setProcessing(false);
        setView("downloading");
      }, 1900),
    );
  };

  /* The result is "downloaded" before it can be revealed. */
  const finishDownload = () => {
    if (tier) onUnlock(tier);
    setView("receipt");
  };

  const onCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitPayment();
  };

  const onCheckoutKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Explicit Enter handling so "Press Enter" always pays, even if
    // implicit form submission is interrupted.
    if (e.key === "Enter" && !processing) {
      e.preventDefault();
      submitPayment();
    }
  };

  /* Focus the close button on open; trap Tab inside. */
  useEffect(() => {
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "Tab") {
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])"),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel || active === document.body)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      onKeyDown={onKeyDown}
    >
      {/* backdrop */}
      <motion.button
        type="button"
        aria-label="Close"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[7px]"
        tabIndex={-1}
      />

      {/* panel */}
      <motion.div
        ref={panelRef}
        role="document"
        initial={{ opacity: 0, y: 48, scale: 0.965 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 26, scale: 0.97, transition: { duration: 0.22, ease: "easeIn" } }}
        transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.92 }}
        className="relative z-10 max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-[1.9rem] border border-white/10 bg-[#141419]/[0.97] p-5 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)] sm:p-7"
      >
        {/* top hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {view === "tiers" && (
          <TiersView
            brand={brand}
            line={meta.line}
            masked={masked}
            headline={headline}
            subline={subline}
            tiers={tiers}
            onClose={onClose}
            onSelect={startCheckout}
          />
        )}

        {view === "checkout" && tier && (
          <CheckoutView
            tier={tier}
            note={checkoutNote}
            processing={processing}
            card={card}
            errors={errors}
            setCard={setCard}
            onBack={backToTiers}
            onClose={onClose}
            onSubmit={onCheckoutSubmit}
            onEnterPay={onCheckoutKeyDown}
          />
        )}

        {view === "downloading" && (
          <DownloadingView
            line={meta.line}
            filename={filename}
            onComplete={finishDownload}
            onClose={onClose}
          />
        )}

        {view === "receipt" && tier && (
          <ReceiptView
            tier={tier}
            receiptBrand={receiptBrand}
            line={meta.line}
            value={meta.value}
            cardNumber={card.number}
            returnLabel={returnLabel}
            onClose={onClose}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* tiers                                                               */
/* ------------------------------------------------------------------ */

function TiersView({
  brand,
  line,
  masked,
  headline,
  subline,
  tiers,
  onClose,
  onSelect,
}: {
  brand: string;
  line: string;
  masked: string;
  headline: string;
  subline: string;
  tiers: PaywallTier[];
  onClose: () => void;
  onSelect: (t: PaywallTier) => void;
}) {
  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          {brand}
        </span>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors duration-150 hover:bg-white/[0.1] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-95"
        >
          {CloseGlyph}
        </button>
      </div>

      {/* copy */}
      <div className="mt-5">
        <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-zinc-50 sm:text-[28px]">
          {headline}
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">{subline}</p>
      </div>

      {/* locked result preview — the result itself is never shown */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-400/30 bg-amber-400/15 text-amber-300">
            {LockGlyph}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-zinc-200">Result locked</p>
            <p className="truncate text-[11px] text-zinc-500">{line || "Your request"}</p>
          </div>
        </div>
        <span
          aria-hidden
          className="select-none whitespace-nowrap text-[22px] font-light tracking-[0.2em] text-zinc-400"
        >
          {masked}
        </span>
      </div>

      {/* pricing */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.14 } } }}
        className="mt-5 grid gap-2.5 sm:grid-cols-3 sm:gap-3"
      >
        {tiers.map((t) => (
          <TierCard key={t.id} tier={t} onSelect={() => onSelect(t)} />
        ))}
      </motion.div>

      {/* footer */}
      <p className="mt-5 text-center text-[11px] tracking-wide text-zinc-600">
        Secured by absolutely nothing · No refunds · No mercy
      </p>
    </div>
  );
}

function TierCard({ tier, onSelect }: { tier: PaywallTier; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.97 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 320, damping: 26 },
        },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn(
        "relative flex flex-col rounded-2xl border p-3.5 transition-colors duration-200",
        tier.featured
          ? "border-amber-400/35 bg-[linear-gradient(180deg,rgba(255,159,10,0.13),rgba(255,159,10,0.04))]"
          : "border-white/[0.08] bg-white/[0.03]",
      )}
      style={{
        boxShadow: hovered
          ? tier.featured
            ? "0 12px 32px -12px rgba(255,159,10,0.35)"
            : "0 12px 32px -16px rgba(0,0,0,0.6)"
          : undefined,
      }}
    >
      {tier.badge && (
        <span className="mb-2.5 inline-flex w-fit items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-300">
          {tier.badge}
        </span>
      )}

      <p className="text-[12.5px] font-semibold text-zinc-100">{tier.name}</p>

      <div className="mt-1.5 flex items-baseline gap-1">
        <span
          className={cn(
            "text-[24px] font-semibold tracking-[-0.02em]",
            tier.featured ? "text-amber-300" : "text-zinc-100",
          )}
        >
          {tier.price}
        </span>
        <span className="text-[11px] text-zinc-500">{tier.period}</span>
      </div>

      <p className="mt-2 flex-1 text-[11.5px] leading-relaxed text-zinc-400">
        {tier.description}
      </p>

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "mt-3.5 flex h-9 w-full items-center justify-center rounded-xl text-[12.5px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
          tier.featured
            ? "bg-[linear-gradient(180deg,#ffb340,#ff9505)] text-[#2a1800] hover:brightness-110 active:scale-[0.97]"
            : "border border-white/[0.12] bg-white/[0.05] text-zinc-100 hover:bg-white/[0.1] active:scale-[0.97]",
        )}
      >
        {tier.cta}
      </button>

      {tier.note && (
        <p className="mt-2.5 text-center text-[10.5px] italic text-zinc-500">{tier.note}</p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* checkout                                                            */
/* ------------------------------------------------------------------ */

function CheckoutView({
  tier,
  note,
  processing,
  card,
  errors,
  setCard,
  onBack,
  onClose,
  onSubmit,
  onEnterPay,
}: {
  tier: PaywallTier;
  note: string;
  processing: boolean;
  card: CardFields;
  errors: CardErrors;
  setCard: (c: CardFields) => void;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onEnterPay: (e: React.KeyboardEvent<HTMLFormElement>) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const panelInputs = useRef<Record<keyof CardFields, HTMLInputElement | null>>({
    name: null,
    number: null,
    expiry: null,
    cvc: null,
  });

  /* autofocus the first field — everything is typed by hand */
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  /* focus the first invalid field when a submit fails */
  useEffect(() => {
    const order: Array<keyof CardFields> = ["name", "number", "expiry", "cvc"];
    const first = order.find((k) => errors[k]);
    if (!first) return;
    panelInputs.current?.[first]?.focus();
  }, [errors]);

  const set = (key: keyof CardFields, value: string) => setCard({ ...card, [key]: value });

  const inputCls = (invalid: boolean) =>
    cn(
      "h-11 w-full rounded-xl border bg-black/25 px-3.5 text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors duration-150",
      "focus-visible:border-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400/25",
      invalid
        ? "border-red-400/50 focus-visible:border-red-400/70 focus-visible:ring-red-400/25"
        : "border-white/[0.09]",
    );

  const labelCls = "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          Secure checkout
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors duration-150 hover:bg-white/[0.1] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-95"
        >
          {CloseGlyph}
        </button>
      </div>

      <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.02em] text-zinc-50">
        Almost there.
      </h2>
      <p className="mt-1.5 text-[13px] text-zinc-400">{note}</p>

      {/* order summary */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-zinc-200">{tier.name}</p>
          <p className="text-[11px] text-zinc-500">{tier.description}</p>
        </div>
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-zinc-50">
          {moneyFor(tier.price)}
        </span>
      </div>

      <form onSubmit={onSubmit} onKeyDown={onEnterPay} noValidate className="mt-4 space-y-3.5">
        <div>
          <label htmlFor="cc-name" className={labelCls}>
            Name on card
          </label>
          <input
            id="cc-name"
            ref={(el) => {
              nameRef.current = el;
              panelInputs.current.name = el;
            }}
            autoComplete="cc-name"
            placeholder="Ada Lovelace"
            value={card.name}
            disabled={processing}
            aria-invalid={!!errors.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls(!!errors.name)}
          />
          {errors.name && <p className="mt-1.5 text-[11px] text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="cc-number" className={labelCls}>
            Card number
          </label>
          <div className="relative">
            <input
              id="cc-number"
              ref={(el) => {
                panelInputs.current.number = el;
              }}
              autoComplete="cc-number"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={card.number}
              disabled={processing}
              aria-invalid={!!errors.number}
              onChange={(e) => set("number", formatCardNumber(e.target.value))}
              className={cn(inputCls(!!errors.number), "pr-14 tabular-nums")}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[9.5px] font-bold uppercase tracking-[0.12em] text-zinc-500"
            >
              {cardBrand(card.number)}
            </span>
          </div>
          {errors.number && <p className="mt-1.5 text-[11px] text-red-400">{errors.number}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cc-exp" className={labelCls}>
              Expiry
            </label>
            <input
              id="cc-exp"
              ref={(el) => {
                panelInputs.current.expiry = el;
              }}
              autoComplete="cc-exp"
              inputMode="numeric"
              placeholder="MM/YY"
              value={card.expiry}
              disabled={processing}
              aria-invalid={!!errors.expiry}
              onChange={(e) => set("expiry", formatExpiry(e.target.value))}
              className={cn(inputCls(!!errors.expiry), "tabular-nums")}
            />
            {errors.expiry && <p className="mt-1.5 text-[11px] text-red-400">{errors.expiry}</p>}
          </div>
          <div>
            <label htmlFor="cc-cvc" className={labelCls}>
              CVC
            </label>
            <input
              id="cc-cvc"
              ref={(el) => {
                panelInputs.current.cvc = el;
              }}
              autoComplete="cc-csc"
              inputMode="numeric"
              placeholder="123"
              value={card.cvc}
              disabled={processing}
              aria-invalid={!!errors.cvc}
              onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={cn(inputCls(!!errors.cvc), "tabular-nums")}
            />
            {errors.cvc && <p className="mt-1.5 text-[11px] text-red-400">{errors.cvc}</p>}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-zinc-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            aria-hidden
          >
            <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
          </svg>
          256-bit encryption · PCI-DSS pending
        </div>

        <button
          type="submit"
          disabled={processing}
          className={cn(
            "mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
            processing
              ? "cursor-progress bg-[#8a5c10] text-amber-100/80"
              : "bg-[linear-gradient(180deg,#ffb340,#ff9505)] text-[#2a1800] hover:brightness-110 active:scale-[0.98]",
          )}
        >
          {processing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing payment…
            </>
          ) : (
            <>Pay {moneyFor(tier.price)} · Press Enter ↵</>
          )}
        </button>

        <p className="text-center text-[10.5px] text-zinc-600">
          Charged in USD · No trial · No mercy
        </p>
      </form>

      <button
        type="button"
        onClick={onBack}
        disabled={processing}
        className="mt-3 rounded text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
      >
        ← Back to plans
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* downloading — the result is "transmitted" to the client            */
/* ------------------------------------------------------------------ */

const DownloadGlyph = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden
  >
    <path d="M12 3v10.5m0 0-4-4m4 4 4-4" />
    <path d="M4.5 17.5v1a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-1" />
  </svg>
);

function DownloadingView({
  line,
  filename,
  onComplete,
  onClose,
}: {
  line: string;
  filename: string;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const completeRef = useRef(onComplete);
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 500 : 2000;
    const start = performance.now();
    let raf = 0;
    let interval: number | undefined;

    /* Advance by wall-clock elapsed time. rAF drives the smooth updates;
       the interval is a safety net so a clamped/throttled rAF (background
       tab, heavy load) can never freeze the download forever. */
    const advance = () => {
      const p = Math.min(100, ((performance.now() - start) / duration) * 100);
      setProgress(p);
      if (p >= 100 && holdTimer.current === null) {
        holdTimer.current = window.setTimeout(() => completeRef.current(), 500);
      }
      return p >= 100;
    };

    const tick = () => {
      if (advance()) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(tick);
    interval = window.setInterval(() => {
      if (advance()) window.clearInterval(interval);
    }, 250);

    return () => {
      cancelAnimationFrame(raf);
      if (interval !== undefined) window.clearInterval(interval);
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
    };
  }, []);

  const stage =
    progress < 34 ? "Encrypting" : progress < 70 ? "Transmitting" : progress < 100 ? "Decrypting" : "Unlocking";

  return (
    <div className="flex flex-col items-center pb-4 pt-2 text-center">
      {/* header */}
      <div className="mb-6 flex w-full items-center justify-between">
        <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          Secure vault
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors duration-150 hover:bg-white/[0.1] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-95"
        >
          {CloseGlyph}
        </button>
      </div>

      <span className="grid h-14 w-14 place-items-center rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-300">
        {DownloadGlyph}
      </span>

      <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-zinc-50">
        Downloading your result
      </h2>

      <p className="mt-1.5 font-mono text-[11.5px] tabular-nums text-zinc-500">
        {line || "request"} · {filename} · 512 B
      </p>

      {/* progress bar */}
      <div className="mt-5 w-full max-w-[280px]">
        <div className="flex items-center justify-between text-[11px] tabular-nums">
          <span className="font-medium text-zinc-400">{stage}…</span>
          <span className="text-zinc-500">{Math.round(progress)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ffb340,#ff9505)] transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-5 text-[11px] text-zinc-600">
        AES-256 · TLS 1.3 · fueled entirely by vibes
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* receipt                                                             */
/* ------------------------------------------------------------------ */

function ReceiptView({
  tier,
  receiptBrand,
  line,
  value,
  cardNumber,
  returnLabel,
  onClose,
}: {
  tier: PaywallTier;
  receiptBrand: string;
  line: string;
  value: string;
  cardNumber: string;
  returnLabel: string;
  onClose: () => void;
}) {
  const receiptNo = useRef(`#${String(Math.floor(1000 + Math.random() * 9000))}`).current;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="flex flex-col items-center py-4 text-center"
    >
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.05 }}
        className="grid h-14 w-14 place-items-center rounded-full border border-green-400/30 bg-green-400/15 text-green-300"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </motion.span>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-green-300">
        Payment successful
      </p>

      {/* receipt */}
      <div className="mt-4 w-full max-w-[300px] rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3.5 text-left">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>{receiptBrand}</span>
          <span>Receipt {receiptNo}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[12.5px] text-zinc-300">{tier.name}</span>
          <span className="text-[13px] font-semibold text-zinc-100">
            {moneyFor(tier.price)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Paid with •••• {last4(cardNumber)}</span>
          <span>Instant</span>
        </div>
        <div className="mt-2.5 border-t border-dashed border-white/[0.1] pt-2 text-center text-[10px] text-zinc-600">
          No refunds. Ever. Not even for your dignity.
        </div>
      </div>

      {/* the result */}
      {line && <p className="mt-4 text-[13px] text-zinc-500">{line}</p>}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
        className="mt-1 text-[52px] font-light tabular-nums tracking-[-0.03em] text-zinc-50"
      >
        {value}
      </motion.p>

      <p className="mt-4 max-w-[300px] text-[13px] leading-relaxed text-zinc-400">
        Our payment gateway is currently on a well-deserved coffee break.
      </p>
      <p className="mt-1.5 text-[12px] text-zinc-500">
        Your result has been unlocked anyway. That&rsquo;ll be {moneyFor(tier.price)}.
      </p>

      <button
        type="button"
        data-autofocus
        onClick={onClose}
        className="mt-6 h-10 w-full max-w-[220px] rounded-xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] text-[13px] font-semibold text-[#2a1800] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.97]"
      >
        {returnLabel}
      </button>
    </motion.div>
  );
}
