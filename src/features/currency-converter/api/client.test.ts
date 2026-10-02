import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "@/test/http";
import { ApiError, fetchConversion, fetchCurrencies, shouldRetry } from "./client";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

const params = { from: "USD", to: "EUR", amount: 1 };

describe("API client", () => {
  it("surfaces the server's error message", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: "Rate limit reached." } }, 429));
    await expect(fetchConversion(params)).rejects.toMatchObject({
      kind: "http",
      status: 429,
      message: "Rate limit reached.",
    });
  });

  it("turns a failed request into a friendly network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchCurrencies()).rejects.toMatchObject({
      kind: "network",
      message: "Couldn't reach the server. Check your connection and try again.",
    });
  });

  it("rethrows aborts untouched so cancelled queries aren't reported as errors", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("Aborted", "AbortError");
    fetchMock.mockRejectedValue(abort);
    await expect(fetchCurrencies(controller.signal)).rejects.toBe(abort);
  });

  it("rejects responses that don't match the contract", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ value: "oops" }));
    await expect(fetchConversion(params)).rejects.toMatchObject({ kind: "invalid-response" });
  });
});

describe("shouldRetry", () => {
  it.each([
    ["network failure", new ApiError("network", "offline"), true],
    ["provider temporarily down", new ApiError("http", "down", 503), true],
    ["rate limit", new ApiError("http", "slow down", 429), false],
    ["unsupported pair", new ApiError("http", "no rate", 422), false],
    ["misconfigured key", new ApiError("http", "bad key", 500), false],
    ["malformed response", new ApiError("invalid-response", "bad"), false],
    ["unknown error", new Error("bug"), false],
  ])("%s -> %s", (_, error, expected) => {
    expect(shouldRetry(0, error)).toBe(expected);
  });

  it("gives up after two retries", () => {
    expect(shouldRetry(2, new ApiError("network", "offline"))).toBe(false);
  });
});
