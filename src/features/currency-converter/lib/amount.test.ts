import { describe, expect, it } from "vitest";
import { roundToPrecision, toPositiveNumber } from "./amount";

describe("toPositiveNumber", () => {
  it.each([
    [10, 10],
    ["2.5", 2.5],
    ["1.", 1],
    [0, null],
    ["", null],
    ["-3", null],
    ["abc", null],
  ])("%j -> %j", (input, expected) => {
    expect(toPositiveNumber(input)).toBe(expected);
  });
});

describe("roundToPrecision", () => {
  it("rounds numbers to the currency precision", () => {
    expect(roundToPrecision(1.55, 0)).toBe(2);
    expect(roundToPrecision(1.2346, 3)).toBe(1.235);
    expect(roundToPrecision(1.005, 2)).toBe(1); // binary float: 1.005 is 1.00499...
    expect(roundToPrecision(10, 2)).toBe(10);
  });

  it("leaves incomplete input untouched", () => {
    expect(roundToPrecision("", 2)).toBe("");
    expect(roundToPrecision("1.", 0)).toBe("1.");
  });
});
