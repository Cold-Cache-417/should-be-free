/**
 * Tally — calculator engine.
 *
 * Pure, side-effect-free arithmetic. The UI layer feeds it tokens and it
 * returns results. All "premium" locking logic lives outside this file; the
 * math here is completely real.
 */

export type Operator = "+" | "−" | "×" | "÷";

export type Token =
  | { kind: "number"; value: number }
  | { kind: "op"; op: Operator };

export class DivideByZeroError extends Error {
  constructor() {
    super("Division by zero");
    this.name = "DivideByZeroError";
  }
}

export class InvalidExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidExpressionError";
  }
}

const PRECEDENCE: Record<Operator, number> = {
  "+": 1,
  "−": 1,
  "×": 2,
  "÷": 2,
};

/** Human display glyphs for each operator. */
export const OP_LABEL: Record<Operator, string> = {
  "+": "+",
  "−": "−",
  "×": "×",
  "÷": "÷",
};

/** The operator a user's keyboard key maps to. */
export const KEY_TO_OP: Record<string, Operator> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

/**
 * Evaluate an infix token stream using standard operator precedence
 * (shunting-yard). Throws on division by zero or malformed input.
 */
export function evaluate(tokens: Token[]): number {
  const output: number[] = [];
  const operators: Operator[] = [];

  for (const token of tokens) {
    if (token.kind === "number") {
      output.push(token.value);
      continue;
    }
    const op = token.op;
    while (
      operators.length > 0 &&
      PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[op]
    ) {
      applyOp(output, operators.pop()!);
    }
    operators.push(op);
  }

  while (operators.length > 0) {
    applyOp(output, operators.pop()!);
  }

  if (output.length !== 1 || !Number.isFinite(output[0])) {
    throw new InvalidExpressionError("Malformed expression");
  }
  return output[0];
}

function applyOp(output: number[], op: Operator): void {
  const b = output.pop();
  const a = output.pop();
  if (a === undefined || b === undefined) {
    throw new InvalidExpressionError("Malformed expression");
  }
  switch (op) {
    case "+":
      output.push(a + b);
      break;
    case "−":
      output.push(a - b);
      break;
    case "×":
      output.push(a * b);
      break;
    case "÷":
      if (b === 0) throw new DivideByZeroError();
      output.push(a / b);
      break;
  }
}

/** Nicely format a number for display — no float noise, grouped digits. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  if (n === 0) return "0";

  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-9) {
    return cleanExponential(n.toExponential(8));
  }

  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 12,
    useGrouping: true,
  }).format(n);
}

function cleanExponential(exp: string): string {
  let out = exp.replace(/\.?0+e/, "e");
  if (out.includes("e") && !out.includes(".") && !out.startsWith("-")) {
    // nothing to trim
  }
  return out;
}

/** Parse a raw entry string ("", "-", "12.", ".5") into a number or null. */
export function parseEntry(entry: string): number | null {
  if (entry === "" || entry === "-" || entry === "." || entry === "-.") {
    return null;
  }
  const value = Number(entry);
  return Number.isFinite(value) ? value : null;
}
