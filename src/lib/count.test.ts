import { describe, expect, it } from "vitest";
import { analyze, countSentences, countWords, readingMinutes, topWord } from "./count";

describe("countWords", () => {
  it("counts words, ignoring punctuation and whitespace", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("hello world")).toBe(2);
    expect(countWords("Hello, brave new world! It works.")).toBe(6);
    expect(countWords("don't stop — it's fine")).toBe(4);
  });
});

describe("countSentences", () => {
  it("counts sentence terminators", () => {
    expect(countSentences("")).toBe(0);
    expect(countSentences("One sentence")).toBe(1);
    expect(countSentences("Two. Sentences.")).toBe(2);
    expect(countSentences("Three! Are. There?")).toBe(3);
  });
});

describe("readingMinutes", () => {
  it("bills a minimum of one minute", () => {
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(199)).toBe(1);
    expect(readingMinutes(200)).toBe(1);
    expect(readingMinutes(201)).toBe(2);
    expect(readingMinutes(1000)).toBe(5);
  });
});

describe("topWord", () => {
  it("finds the most frequent word, ties broken alphabetically", () => {
    expect(topWord("")).toBeNull();
    expect(topWord("the the and and and")).toBe("and");
    expect(topWord("Apples apples APPLES")).toBe("apples");
  });
});

describe("analyze", () => {
  it("returns the full report", () => {
    const r = analyze("Hello there. Hello again.");
    expect(r.words).toBe(4);
    expect(r.chars).toBe(25);
    expect(r.charsNoSpace).toBe(22);
    expect(r.sentences).toBe(2);
    expect(r.topWord).toBe("hello");
  });
});
