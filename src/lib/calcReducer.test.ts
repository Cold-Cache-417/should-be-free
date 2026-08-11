import { describe, expect, it } from "vitest";
import { calcReducer, freshState } from "./calcReducer";

const drive = (keys: Array<string | { op: "+" | "−" | "×" | "÷" }>) => {
  let state = freshState();
  for (const key of keys) {
    if (typeof key === "string") {
      if (/^[0-9]$/.test(key)) state = calcReducer(state, { type: "digit", digit: key as "0" });
      else if (key === ".") state = calcReducer(state, { type: "decimal" });
      else if (key === "=") state = calcReducer(state, { type: "equals" });
      else if (key === "%") state = calcReducer(state, { type: "percent" });
      else if (key === "±") state = calcReducer(state, { type: "sign" });
      else if (key === "⌫") state = calcReducer(state, { type: "backspace" });
      else if (key === "C") state = calcReducer(state, { type: "clear" });
    } else {
      state = calcReducer(state, { type: "op", op: key.op });
    }
  }
  return state;
};

describe("reducer — typing", () => {
  it("replaces leading zero", () => {
    const s = drive(["0", "5"]);
    expect(s.entry).toBe("5");
  });

  it("handles decimal entry", () => {
    expect(drive(["."]).entry).toBe("0.");
    expect(drive(["1", ".", "5"]).entry).toBe("1.5");
    expect(drive(["1", ".", ".", "5"]).entry).toBe("1.5"); // second dot ignored
  });

  it("caps at 12 digits", () => {
    const s = drive(Array(15).fill("9"));
    expect(s.entry.replace(/[^0-9]/g, "").length).toBe(12);
  });

  it("negates the current entry", () => {
    expect(drive(["5", "±"]).entry).toBe("-5");
    expect(drive(["5", "±", "±"]).entry).toBe("5");
  });
});

describe("reducer — operators", () => {
  it("replaces a trailing operator", () => {
    const s = drive(["2", { op: "+" }, { op: "×" }]);
    expect(s.tokens.map((t) => (t.kind === "op" ? t.op : t.value))).toEqual([2, "×"]);
  });

  it("ignores a leading operator", () => {
    const s = drive([{ op: "+" }, "5"]);
    expect(s.entry).toBe("5");
    expect(s.tokens.length).toBe(0);
  });

  it("commits entry when an operator is pressed", () => {
    const s = drive(["2", ".", "5", { op: "+" }, "3"]);
    expect(s.tokens.map((t) => (t.kind === "op" ? t.op : t.value))).toEqual([2.5, "+"]);
    expect(s.entry).toBe("3");
  });
});

describe("reducer — percent and backspace", () => {
  it("turns the current operand into its hundredth", () => {
    expect(drive(["5", "0", "%"]).entry).toBe("0.5");
  });

  it("percent applies to the most recent number even with a trailing op", () => {
    const s = drive(["2", "0", { op: "+" }, "%"]);
    expect(s.tokens.map((t) => (t.kind === "number" ? t.value : t.op))).toEqual([0.2, "+"]);
    const s2 = drive(["2", { op: "+" }, "3", "%"]);
    expect(s2.tokens.map((t) => (t.kind === "number" ? t.value : t.op))).toEqual([2, "+"]);
    expect(s2.entry).toBe("0.03");
  });

  it("backspace pops entry chars, then operators, then numbers back into the entry", () => {
    const s1 = drive(["1", "2", ".", "5", "⌫"]);
    expect(s1.entry).toBe("12.");
    const s2 = drive(["2", { op: "+" }, "3", "⌫"]);
    expect(s2.entry).toBe("");
    expect(s2.tokens.map((t) => (t.kind === "op" ? t.op : t.value))).toEqual([2, "+"]);
    const s3 = drive(["2", { op: "+" }, "3", "⌫", "⌫"]);
    expect(s3.tokens.map((t) => (t.kind === "op" ? t.op : t.value))).toEqual([2]);
    // a committed number pops back into the entry so it stays editable
    const s4 = drive(["1", "2", { op: "+" }, "⌫", "⌫"]);
    expect(s4.tokens.length).toBe(0);
    expect(s4.entry).toBe("12");
  });

  it("clear (C) drops the entry, AC clears everything", () => {
    const s = drive(["5", "C"]);
    expect(s.entry).toBe("");
    const s2 = drive(["5", { op: "+" }, "C"]);
    expect(s2.tokens.length).toBe(0);
  });
});

describe("reducer — equals", () => {
  it("evaluates with precedence and locks the answer immediately", () => {
    const s = drive(["2", { op: "+" }, "3", { op: "×" }, "4", "="]);
    expect(s.phase).toBe("locked");
    expect(s.answer).toBe(14);
  });

  it("repeats the last operand on a dangling operator", () => {
    const s = drive(["2", { op: "+" }, "="]);
    expect(s.answer).toBe(4);
    const s2 = drive(["5", { op: "÷" }, "="]);
    expect(s2.answer).toBe(1);
  });

  it("is a no-op when nothing was entered", () => {
    const s = drive(["="]);
    expect(s.phase).toBe("idle");
  });

  it("flags division by zero", () => {
    const s = drive(["5", { op: "÷" }, "0", "="]);
    expect(s.phase).toBe("error");
  });

  it("blocks input while locked", () => {
    const s = drive(["2", { op: "+" }, "2", "="]);
    expect(s.phase).toBe("locked");
    expect(calcReducer(s, { type: "digit", digit: "9" })).toBe(s);
  });

  it("unlock keeps the answer; dismiss resets", () => {
    const s = drive(["2", { op: "+" }, "2", "="]);
    const locked = s;
    const unlocked = calcReducer(locked, { type: "unlock" });
    expect(unlocked.phase).toBe("unlocked");
    expect(unlocked.answer).toBe(4);
    expect(calcReducer(locked, { type: "dismissLocked" }).phase).toBe("idle");
  });
});

describe("reducer — error recovery", () => {
  it("any key clears the error; digits start fresh", () => {
    const err = drive(["5", { op: "÷" }, "0", "="]);
    expect(err.phase).toBe("error");
    const next = calcReducer(err, { type: "digit", digit: "7" });
    expect(next.phase).toBe("idle");
    expect(next.entry).toBe("7");
  });
});

describe("reducer — chaining after unlock", () => {
  it("starts a new expression from the answer", () => {
    const s = drive(["2", { op: "+" }, "2", "="]);
    const unlocked = calcReducer(s, { type: "unlock" });
    const chained = calcReducer(unlocked, { type: "op", op: "×" });
    expect(chained.tokens.map((t) => (t.kind === "number" ? t.value : t.op))).toEqual([4, "×"]);
    const result = calcReducer(drive2(chained, ["2", "="]), { type: "equals" });
    expect(result.answer).toBe(8);
  });
});

function drive2(state: ReturnType<typeof calcReducer>, keys: string[]) {
  let s = state;
  for (const key of keys) {
    if (/^[0-9]$/.test(key)) s = calcReducer(s, { type: "digit", digit: key as "0" });
    else if (key === "=") s = calcReducer(s, { type: "equals" });
  }
  return s;
}
