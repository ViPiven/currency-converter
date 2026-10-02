// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { convert, UpstreamError } from "@/server/currencybeacon";
import { GET } from "./route";

vi.mock("@/server/currencybeacon", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/currencybeacon")>()),
  convert: vi.fn(),
}));

const convertMock = vi.mocked(convert);

function get(query: string) {
  return GET(new NextRequest(`http://localhost/api/convert?${query}`));
}

beforeEach(() => {
  convertMock.mockReset();
});

describe("GET /api/convert", () => {
  it("validates and normalizes query params before calling the provider", async () => {
    const conversion = { from: "USD", to: "EUR", amount: 5, value: 4.6, timestamp: 1 };
    convertMock.mockResolvedValue(conversion);

    const res = await get("from=usd&to=eur&amount=5");

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(conversion);
    expect(convertMock).toHaveBeenCalledWith({ from: "USD", to: "EUR", amount: 5 });
  });

  it.each([
    "from=USD&to=EUR",
    "from=USD&to=EUR&amount=-1",
    "from=USD&to=EUR&amount=abc",
    "to=EUR&amount=1",
  ])("returns 400 for invalid params: %s", async (query) => {
    const res = await get(query);
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty("error.message");
    expect(convertMock).not.toHaveBeenCalled();
  });

  it("forwards provider errors with a safe message", async () => {
    convertMock.mockRejectedValue(new UpstreamError("Rate limit reached.", 429));
    const res = await get("from=USD&to=EUR&amount=1");
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: { message: "Rate limit reached." } });
  });
});
