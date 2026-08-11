import { Key, type KeyVariant } from "./Key";
import type { CalcAction, CalcState } from "../../lib/calcReducer";
import type { Operator } from "../../lib/calculator";

interface KeyDef {
  id: string;
  label: string;
  aria: string;
  variant: KeyVariant;
  action: CalcAction;
  span?: 1 | 2;
}

interface KeypadProps {
  state: CalcState;
  disabled: boolean;
  pressedKey: string | null;
  onPress: (keyId: string, action: CalcAction) => void;
}

export function Keypad({ state, disabled, pressedKey, onPress }: KeypadProps) {
  const clearLabel = state.entry !== "" ? "C" : "AC";

  const keys: KeyDef[] = [
    { id: "key-ac", label: clearLabel, aria: clearLabel, variant: "fn", action: { type: "clear" } },
    { id: "key-sign", label: "±", aria: "Toggle sign", variant: "fn", action: { type: "sign" } },
    { id: "key-percent", label: "%", aria: "Percent", variant: "fn", action: { type: "percent" } },
    { id: "key-div", label: "÷", aria: "Divide", variant: "op", action: { type: "op", op: "÷" } },
    { id: "key-7", label: "7", aria: "7", variant: "digit", action: { type: "digit", digit: "7" } },
    { id: "key-8", label: "8", aria: "8", variant: "digit", action: { type: "digit", digit: "8" } },
    { id: "key-9", label: "9", aria: "9", variant: "digit", action: { type: "digit", digit: "9" } },
    { id: "key-mul", label: "×", aria: "Multiply", variant: "op", action: { type: "op", op: "×" } },
    { id: "key-4", label: "4", aria: "4", variant: "digit", action: { type: "digit", digit: "4" } },
    { id: "key-5", label: "5", aria: "5", variant: "digit", action: { type: "digit", digit: "5" } },
    { id: "key-6", label: "6", aria: "6", variant: "digit", action: { type: "digit", digit: "6" } },
    { id: "key-sub", label: "−", aria: "Subtract", variant: "op", action: { type: "op", op: "−" } },
    { id: "key-1", label: "1", aria: "1", variant: "digit", action: { type: "digit", digit: "1" } },
    { id: "key-2", label: "2", aria: "2", variant: "digit", action: { type: "digit", digit: "2" } },
    { id: "key-3", label: "3", aria: "3", variant: "digit", action: { type: "digit", digit: "3" } },
    { id: "key-add", label: "+", aria: "Add", variant: "op", action: { type: "op", op: "+" } },
    { id: "key-0", label: "0", aria: "0", variant: "digit", action: { type: "digit", digit: "0" }, span: 2 },
    { id: "key-dot", label: ".", aria: "Decimal point", variant: "digit", action: { type: "decimal" } },
    { id: "key-eq", label: "=", aria: "Equals", variant: "eq", action: { type: "equals" } },
  ];

  const lastToken = state.tokens[state.tokens.length - 1];
  const activeOp: Operator | null =
    lastToken?.kind === "op" ? lastToken.op : null;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5" role="group" aria-label="Keypad">
      {keys.map((key, i) => (
        <Key
          key={key.id}
          id={key.id}
          index={i}
          label={key.label}
          ariaLabel={key.aria}
          variant={key.variant}
          span={key.span}
          disabled={disabled}
          isActive={key.variant === "op" && activeOp === (key.action as { op: Operator }).op}
          isPressed={pressedKey === key.id}
          onPress={() => onPress(key.id, key.action)}
        />
      ))}
    </div>
  );
}
