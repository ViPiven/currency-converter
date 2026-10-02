import { describe, expect, it } from "vitest";
import { formatAmount, formatRate } from "./format";

describe("formatAmount", () => {
  it("uses the currency precision", () => {
    expect(formatAmount(1234.5, 2)).toBe("1,234.50");
    expect(formatAmount(1234.5, 0)).toBe("1,235");
    expect(formatAmount(1.5, 3)).toBe("1.500");
  });

  it("keeps tiny values readable instead of rounding them to zero", () => {
    expect(formatAmount(0.000123456, 2)).toBe("0.0001235");
  });

  it("can drop trailing zeros", () => {
    expect(formatAmount(250, 2, { trimZeros: true })).toBe("250");
    expect(formatAmount(0.5, 2, { trimZeros: true })).toBe("0.5");
  });

  it("defaults to two decimals", () => {
    expect(formatAmount(10)).toBe("10.00");
  });
});

describe("formatRate", () => {
  it("shows up to 4 decimals for rates above 1", () => {
    expect(formatRate(151.123456)).toBe("151.1235");
  });

  it("shows significant digits for small rates", () => {
    expect(formatRate(0.0062134)).toBe("0.006213");
  });
});
