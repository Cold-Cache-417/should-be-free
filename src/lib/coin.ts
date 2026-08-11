export type CoinFace = "heads" | "tails";

export const COIN_FACES: readonly CoinFace[] = ["heads", "tails"];

/**
 * A fair coin. The result is decided instantly and honestly — it is the
 * paywall that is absurd, not the odds.
 */
export function flipCoin(rng: () => number = Math.random): CoinFace {
  return rng() < 0.5 ? "heads" : "tails";
}

export function faceLabel(face: CoinFace): string {
  return face === "heads" ? "HEADS" : "TAILS";
}
