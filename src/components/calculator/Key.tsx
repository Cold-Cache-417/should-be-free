import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type KeyVariant = "digit" | "fn" | "op" | "eq";

interface KeyProps {
  id: string;
  label: ReactNode;
  variant: KeyVariant;
  onPress: () => void;
  /** Operator key highlighted because it's the pending operator. */
  isActive?: boolean;
  /** Visual feedback driven by a keyboard press. */
  isPressed?: boolean;
  span?: 1 | 2;
  disabled?: boolean;
  ariaLabel?: string;
  /** Stagger entrance index, passed as a CSS var. */
  index?: number;
}

export function Key({
  id,
  label,
  variant,
  onPress,
  isActive = false,
  isPressed = false,
  span = 1,
  disabled = false,
  ariaLabel,
  index = 0,
}: KeyProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isActive ? true : undefined}
      className={cn(
        "key key-in",
        `key--${variant}`,
        isActive && "is-active",
        isPressed && "is-pressed",
        span === 2 && "col-span-2",
        "flex aspect-[1.5/1] items-center justify-center sm:aspect-square",
      )}
      style={{ "--i": index } as CSSProperties}
    >
      <span className="key__label">{label}</span>
    </button>
  );
}
