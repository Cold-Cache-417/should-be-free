/**
 * Mock payment helpers — these only make the checkout feel real. No card
 * data leaves the browser, nothing is validated against a network, and the
 * "payment" always succeeds. That's the joke.
 */

export type CardBrand = "Visa" | "Mastercard" | "Amex" | "Discover" | "Card";

export function cardBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return "Card";
}

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4 6 5). */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const isAmex = /^3[47]/.test(digits);
  const groups = isAmex ? [4, 6, 5] : [4, 4, 4, 4];
  let out = "";
  let idx = 0;
  for (const size of groups) {
    if (idx >= digits.length) break;
    const chunk = digits.slice(idx, idx + size);
    out += out ? ` ${chunk}` : chunk;
    idx += size;
    if (idx >= digits.length) break;
  }
  return out;
}

/** "1228" → "12/28". */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export interface CardFields {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
}

export type CardErrors = Partial<Record<keyof CardFields, string>>;

export function validateCard(fields: CardFields): CardErrors {
  const errors: CardErrors = {};
  const now = new Date();

  if (fields.name.trim().length < 2) {
    errors.name = "Enter the name on the card.";
  }

  const digits = fields.number.replace(/\D/g, "");
  if (digits.length < 13) {
    errors.number = "Card number is incomplete.";
  } else if (!/^\d{13,16}$/.test(digits)) {
    errors.number = "Enter a valid card number.";
  }

  const expiryDigits = fields.expiry.replace(/\D/g, "");
  const month = Number(expiryDigits.slice(0, 2));
  const year = Number(expiryDigits.slice(2));
  if (expiryDigits.length !== 4) {
    errors.expiry = "Use MM/YY.";
  } else if (month < 1 || month > 12) {
    errors.expiry = "Invalid month.";
  } else if (year < Number(String(now.getFullYear()).slice(2))) {
    errors.expiry = "Card has expired.";
  } else if (year === Number(String(now.getFullYear()).slice(2)) && month < now.getMonth() + 1) {
    errors.expiry = "Card has expired.";
  }

  const cvcDigits = fields.cvc.replace(/\D/g, "");
  if (!/^\d{3,4}$/.test(cvcDigits)) {
    errors.cvc = "Enter the security code.";
  }

  return errors;
}

export function last4(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits.slice(-4) || "0000";
}

/** Total due for a tier, rendered as money (grouped, 2 decimals). */
export function moneyFor(price: string): string {
  const digits = price.replace(/[^0-9.]/g, "");
  const value = Number(digits);
  if (!Number.isFinite(value)) return price;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
