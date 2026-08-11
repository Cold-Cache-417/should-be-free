import {
  DivideByZeroError,
  OP_LABEL,
  evaluate,
  formatNumber,
  parseEntry,
  type Operator,
  type Token,
} from "./calculator";

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

/** Lifecycle of a calculation: typed → locked → (unlocked | dismissed). */
export type Phase = "idle" | "locked" | "unlocked" | "error";

export interface CalcState {
  /** Committed part of the expression (numbers + operators). */
  tokens: Token[];
  /** Raw string of the number currently being typed ("" when none). */
  entry: string;
  /** Parsed value of `entry` (null while it's incomplete). */
  entryValue: number | null;
  phase: Phase;
  /** The real result, computed honestly before it gets locked away. */
  answer: number | null;
  errorMessage: string | null;
}

export type CalcAction =
  | { type: "digit"; digit: Digit }
  | { type: "decimal" }
  | { type: "op"; op: Operator }
  | { type: "equals" }
  | { type: "percent" }
  | { type: "sign" }
  | { type: "backspace" }
  | { type: "clear" }
  | { type: "unlock" }
  | { type: "dismissLocked" };

export const MAX_DIGITS = 12;

export function freshState(): CalcState {
  return {
    tokens: [],
    entry: "",
    entryValue: null,
    phase: "idle",
    answer: null,
    errorMessage: null,
  };
}

export function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case "unlock":
      if (state.phase !== "locked" && state.phase !== "unlocked") return state;
      return { ...freshState(), phase: "unlocked", answer: state.answer };
    case "dismissLocked":
      return freshState();
    default:
      break;
  }

  // Input is blocked while the paywall is up.
  if (state.phase === "locked") return state;

  if (state.phase === "error") return applyAfterError(action);
  if (state.phase === "unlocked") return applyUnlocked(state, action);
  return applyIdle(state, action);
}

/* ------------------------------------------------------------------ */
/* idle — normal typing                                               */
/* ------------------------------------------------------------------ */

function applyIdle(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case "digit":
      return typeDigit(state, action.digit);
    case "decimal":
      return typeDecimal(state);
    case "op":
      return typeOperator(state, action.op);
    case "percent":
      return applyPercent(state);
    case "sign":
      return toggleSign(state);
    case "backspace":
      return backspace(state);
    case "clear":
      return clear(state);
    case "equals":
      return evaluateNow(state);
    default:
      return state;
  }
}

function typeDigit(state: CalcState, digit: Digit): CalcState {
  const digitsSoFar = state.entry.replace(/[^0-9]/g, "").length;
  if (digitsSoFar >= MAX_DIGITS) return state;

  if (state.entry === "0") {
    return { ...state, entry: digit, entryValue: Number(digit) };
  }
  if (state.entry === "-0") {
    return { ...state, entry: `-${digit}`, entryValue: Number(`-${digit}`) };
  }
  const next = state.entry + digit;
  return { ...state, entry: next, entryValue: parseEntry(next) };
}

function typeDecimal(state: CalcState): CalcState {
  if (state.entry.includes(".")) return state;
  const next = state.entry === "" ? "0." : `${state.entry}.`;
  return { ...state, entry: next, entryValue: parseEntry(next) };
}

function typeOperator(state: CalcState, op: Operator): CalcState {
  const tokens = commitEntry(state);
  if (tokens.length === 0) return state;

  const next = { ...state, tokens, entry: "", entryValue: null };
  const last = tokens[tokens.length - 1];
  if (last.kind === "op") {
    return { ...next, tokens: [...tokens.slice(0, -1), { kind: "op", op }] };
  }
  return { ...next, tokens: [...tokens, { kind: "op", op }] };
}

function applyPercent(state: CalcState): CalcState {
  if (state.entry !== "" && state.entryValue != null) {
    const value = state.entryValue / 100;
    return { ...state, entry: entryFromNumber(value), entryValue: value };
  }
  // Apply to the most recent number, even if an operator trails it
  // (e.g. "20 + %" → "0.2 +", matching iOS).
  for (let i = state.tokens.length - 1; i >= 0; i--) {
    const t = state.tokens[i];
    if (t.kind === "number") {
      const value = t.value / 100;
      return {
        ...state,
        tokens: [
          ...state.tokens.slice(0, i),
          { kind: "number", value },
          ...state.tokens.slice(i + 1),
        ],
      };
    }
  }
  return state;
}

function toggleSign(state: CalcState): CalcState {
  if (state.entry !== "") {
    let next = state.entry;
    if (next === "0") next = "-0";
    else if (next === "-0") next = "0";
    else next = next.startsWith("-") ? next.slice(1) : `-${next}`;
    return { ...state, entry: next, entryValue: parseEntry(next) };
  }
  const last = state.tokens[state.tokens.length - 1];
  if (last?.kind === "number") {
    const value = -last.value;
    return { ...state, tokens: [...state.tokens.slice(0, -1), { kind: "number", value }] };
  }
  return state;
}

function backspace(state: CalcState): CalcState {
  if (state.entry !== "") {
    const next = state.entry.slice(0, -1);
    return { ...state, entry: next, entryValue: parseEntry(next) };
  }
  const tokens = state.tokens;
  if (tokens.length === 0) return state;
  const last = tokens[tokens.length - 1];
  if (last.kind === "op") {
    return { ...state, tokens: tokens.slice(0, -1) };
  }
  // Pop the last number back into the entry so it stays editable.
  return {
    ...state,
    tokens: tokens.slice(0, -1),
    entry: entryFromNumber(last.value),
    entryValue: last.value,
  };
}

function clear(state: CalcState): CalcState {
  if (state.entry !== "") return { ...state, entry: "", entryValue: null };
  if (state.tokens.length > 0) return { ...state, tokens: [] };
  return state;
}

function evaluateNow(state: CalcState): CalcState {
  const tokens = [...commitEntry(state)];
  if (tokens.length === 0) return state;

  // "2 + =" → "2 + 2" (repeat the last operand, like iOS).
  if (tokens[tokens.length - 1].kind === "op") {
    let operand: number | null = null;
    for (let i = tokens.length - 2; i >= 0; i--) {
      const t = tokens[i];
      if (t.kind === "number") {
        operand = t.value;
        break;
      }
    }
    if (operand == null) return state;
    tokens.push({ kind: "number", value: operand });
  }

  try {
    const answer = evaluate(tokens);
    return {
      ...state,
      tokens,
      entry: "",
      entryValue: null,
      phase: "locked",
      answer,
      errorMessage: null,
    };
  } catch (err) {
    if (err instanceof DivideByZeroError) {
      return {
        ...state,
        tokens,
        entry: "",
        entryValue: null,
        phase: "error",
        errorMessage: "Cannot divide by zero",
      };
    }
    return {
      ...state,
      tokens,
      entry: "",
      entryValue: null,
      phase: "error",
      errorMessage: "Malformed expression",
    };
  }
}

/** Fold the current entry into the token list as a number token. */
function commitEntry(state: CalcState): Token[] {
  if (state.entry === "" || state.entryValue == null) return state.tokens;
  return [...state.tokens, { kind: "number", value: state.entryValue }];
}

/* ------------------------------------------------------------------ */
/* unlocked — the (paid) result is on screen                           */
/* ------------------------------------------------------------------ */

function applyUnlocked(state: CalcState, action: CalcAction): CalcState {
  const fresh = freshState();
  switch (action.type) {
    case "digit":
      return { ...fresh, entry: action.digit, entryValue: Number(action.digit) };
    case "decimal":
      return { ...fresh, entry: "0.", entryValue: 0 };
    case "op":
      if (state.answer == null) return state;
      return {
        ...fresh,
        tokens: [
          { kind: "number", value: state.answer },
          { kind: "op", op: action.op },
        ],
      };
    case "sign":
      return state.answer == null ? state : { ...state, answer: -state.answer };
    case "percent":
      return state.answer == null ? state : { ...state, answer: state.answer / 100 };
    case "backspace":
    case "clear":
      return fresh;
    case "equals":
      return state; // nothing new to compute on a bare answer
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* error — any key recovers                                            */
/* ------------------------------------------------------------------ */

function applyAfterError(action: CalcAction): CalcState {
  const fresh = freshState();
  if (action.type === "digit") {
    return { ...fresh, entry: action.digit, entryValue: Number(action.digit) };
  }
  if (action.type === "decimal") {
    return { ...fresh, entry: "0.", entryValue: 0 };
  }
  return fresh;
}

/* ------------------------------------------------------------------ */
/* display derivation                                                  */
/* ------------------------------------------------------------------ */

export type MainTone = "normal" | "error" | "locked" | "unlocked";

export function tokensToString(tokens: Token[]): string {
  return tokens
    .map((t) => (t.kind === "number" ? formatNumber(t.value) : OP_LABEL[t.op]))
    .join(" ");
}

export function expressionText(state: CalcState): string {
  const expr = tokensToString(state.tokens);
  if (state.phase === "locked" || state.phase === "error") {
    return expr ? `${expr} =` : "";
  }
  return expr;
}

export function deriveMain(state: CalcState): { text: string; tone: MainTone } {
  switch (state.phase) {
    case "error":
      return { text: "Error", tone: "error" };
    case "locked":
      // The answer is computed and held in state, but never rendered — not
      // even blurred. The user sees masked dots until they "pay".
      return { text: "••••", tone: "locked" };
    case "unlocked":
      return { text: state.answer != null ? formatNumber(state.answer) : "0", tone: "unlocked" };
    case "idle": {
      if (state.entry !== "") return { text: state.entry, tone: "normal" };
      for (let i = state.tokens.length - 1; i >= 0; i--) {
        const t = state.tokens[i];
        if (t.kind === "number") return { text: formatNumber(t.value), tone: "normal" };
      }
      return { text: "0", tone: "normal" };
    }
  }
}

/** Font size for the main display, shrinking as the number grows. */
export function displayFontSize(text: string): number {
  const len = text.length;
  if (len <= 7) return 76;
  if (len <= 10) return 60;
  if (len <= 13) return 48;
  if (len <= 17) return 38;
  return 30;
}

/** Compact decimal string for re-entering computed values. */
function entryFromNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-9) return String(n);
  return String(parseFloat(n.toPrecision(12)));
}
