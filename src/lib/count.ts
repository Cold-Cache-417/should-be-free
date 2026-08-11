/*
 * Word Counter engine. Counting is free. The count is not.
 */

export interface CountResult {
  words: number;
  chars: number;
  charsNoSpace: number;
  sentences: number;
  readingMinutes: number;
  topWord: string | null;
}

/** Split text into words — non-letter/digit runs are separators. */
export function countWords(text: string): number {
  const m = text.trim().match(/[A-Za-z0-9\u00C0-\u024F'-]+/g);
  return m ? m.length : 0;
}

export function countSentences(text: string): number {
  const m = text.trim().match(/[^.!?]+[.!?]+(\s|$)/g);
  if (m) return m.length;
  return text.trim().length > 0 ? 1 : 0;
}

/** Reading time at a leisurely 200 wpm — the slower, the more it costs. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

/** The most frequent word (case-insensitive), ties broken alphabetically. */
export function topWord(text: string): string | null {
  const words = text.toLowerCase().match(/[a-z0-9\u00C0-\u024F'-]+/g);
  if (!words || words.length === 0) return null;
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [w, c] of counts) {
    if (c > bestCount || (c === bestCount && (best === null || w < best))) {
      best = w;
      bestCount = c;
    }
  }
  return best;
}

export function analyze(text: string): CountResult {
  const words = countWords(text);
  return {
    words,
    chars: text.length,
    charsNoSpace: text.replace(/\s/g, "").length,
    sentences: countSentences(text),
    readingMinutes: readingMinutes(words),
    topWord: topWord(text),
  };
}
