// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "@/test/http";
import { convert, getCurrencies, UpstreamError } from "./currencybeacon";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("CURRENCYBEACON_API_KEY", "test-key");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("getCurrencies", () => {
  it("maps the `response` node using the ISO alpha code, deduplicated and sorted", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        meta: { code: 200 },
        response: [
          { id: 2, name: "US Dollar", short_code: "USD", code: "840", symbol: "$", precision: 2 },
          { id: 1, name: "Euro", short_code: "EUR", code: "978", symbol: "€", precision: 2 },
          { id: 3, name: "US Dollar", short_code: "USD", code: "840", symbol: "$", precision: 2 },
          { id: 4, name: "Yen", short_code: "JPY", code: "392", symbol: null },
        ],
      }),
    );

    await expect(getCurrencies()).resolves.toEqual([
      { code: "EUR", name: "Euro", symbol: "€", precision: 2 },
      { code: "JPY", name: "Yen", symbol: "", precision: 2 },
      { code: "USD", name: "US Dollar", symbol: "$", precision: 2 },
    ]);
  });

  it("sends the API key as a bearer token, not in the URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ response: [] }));
    await getCurrencies();

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).not.toContain("test-key");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
  });

  it("fails clearly when the API key is missing", async () => {
    vi.stubEnv("CURRENCYBEACON_API_KEY", "");
    await expect(getCurrencies()).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("convert", () => {
  it("reads the converted value from the `response` node", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        meta: { code: 200 },
        response: {
          timestamp: 1710515400,
          date: "2024-03-15",
          from: "USD",
          to: "GBP",
          amount: 100,
          value: 78.42,
        },
        // v1 back-compat duplicates at the top level must be ignored.
        value: 0,
      }),
    );

    await expect(convert({ from: "USD", to: "GBP", amount: 100 })).resolves.toEqual({
      from: "USD",
      to: "GBP",
      amount: 100,
      value: 78.42,
      timestamp: 1710515400,
    });
    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(Object.fromEntries(url.searchParams)).toEqual({ from: "USD", to: "GBP", amount: "100" });
  });

  it.each([
    [401, 500],
    [429, 429],
    [500, 503],
  ])("maps upstream %i to %i", async (upstream, expected) => {
    fetchMock.mockResolvedValue(jsonResponse({ meta: { code: upstream } }, upstream));
    const error = await convert({ from: "USD", to: "EUR", amount: 1 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UpstreamError);
    expect(error).toMatchObject({ status: expected });
  });

  it("treats an error code in `meta` of a 200 response as a failure", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ meta: { code: 422, error_detail: "Invalid currency" }, response: [] }),
    );
    await expect(convert({ from: "USD", to: "XXX", amount: 1 })).rejects.toMatchObject({
      status: 400,
      message: "Invalid currency",
    });
  });

  it("reports a missing rate instead of converting to 0", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        meta: { code: 200 },
        response: { timestamp: 1, from: "USD", to: "XXX", amount: 100, value: 0 },
      }),
    );
    await expect(convert({ from: "USD", to: "XXX", amount: 100 })).rejects.toMatchObject({
      status: 422,
      message: "No exchange rate available for USD to XXX.",
    });
  });

  it("rejects malformed payloads", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ response: { value: "n/a" } }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(convert({ from: "USD", to: "EUR", amount: 1 })).rejects.toMatchObject({
      status: 502,
    });
  });
});
