import "server-only";
import { z } from "zod";
import type {
  Conversion,
  ConvertParams,
  Currency,
} from "@/features/currency-converter/api/contracts";

const BASE_URL = "https://api.currencybeacon.com/v1/";
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_PRECISION = 2;

// The message is shown to users as is. The client retries 503 only, so keep it
// for transient failures (500 = our config, 502 = malformed provider response).
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

// Payloads come as `{ meta, response }` plus legacy copies of the fields at the
// top level - only `response` is read. `short_code` is "USD", `code` is the
// numeric "840", and /convert expects the former.

const upstreamMetaSchema = z
  .object({
    code: z.number().optional(),
    error_detail: z.string().optional(),
  })
  .optional();

const upstreamCurrencySchema = z.object({
  short_code: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().nullish(),
  precision: z.number().int().nonnegative().nullish(),
});

const currenciesEnvelopeSchema = z.object({
  response: z.array(upstreamCurrencySchema),
});

const convertEnvelopeSchema = z.object({
  response: z.object({
    timestamp: z.number(),
    from: z.string(),
    to: z.string(),
    amount: z.coerce.number(),
    value: z.coerce.number(),
  }),
});

type FetchInit = RequestInit & { next?: { revalidate?: number | false } };

async function request(path: string, params: Record<string, string>, init: FetchInit) {
  const apiKey = process.env.CURRENCYBEACON_API_KEY;
  if (!apiKey) {
    throw new UpstreamError("Currency service is not configured (missing API key).", 500);
  }

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      // Bearer header keeps the key out of URLs (and therefore out of logs).
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new UpstreamError("Currency service is unreachable. Please try again.", 503);
  }

  const body: unknown = await res.json().catch(() => null);
  const meta = upstreamMetaSchema.safeParse((body as { meta?: unknown } | null)?.meta).data;
  // Errors may come as a non-2xx status or as a 200 with an error code in `meta`.
  const errorStatus = !res.ok ? res.status : meta?.code && meta.code >= 400 ? meta.code : null;
  if (errorStatus !== null) {
    throw toUpstreamError(errorStatus, meta?.error_detail);
  }
  return body;
}

function toUpstreamError(status: number, detail?: string) {
  if (status === 401 || status === 403) {
    return new UpstreamError("Currency service rejected our credentials.", 500);
  }
  if (status === 429) {
    return new UpstreamError("Rate limit reached. Please wait a moment and try again.", 429);
  }
  if (status >= 400 && status < 500 && detail) {
    return new UpstreamError(detail, 400);
  }
  return new UpstreamError("Currency service is temporarily unavailable. Please try again.", 503);
}

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    console.error("Unexpected CurrencyBeacon payload:\n" + z.prettifyError(result.error));
    throw new UpstreamError("Currency service returned an unexpected response.", 502);
  }
  return result.data;
}

export async function getCurrencies(): Promise<Currency[]> {
  // The list barely changes, a day of caching saves free-plan quota.
  const body = await request("currencies", {}, { next: { revalidate: 86_400 } });
  const { response } = parse(currenciesEnvelopeSchema, body);

  const byCode = new Map<string, Currency>();
  for (const item of response) {
    const code = item.short_code.toUpperCase();
    if (byCode.has(code)) continue;
    byCode.set(code, {
      code,
      name: item.name,
      symbol: item.symbol ?? "",
      precision: item.precision ?? DEFAULT_PRECISION,
    });
  }
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export async function convert({ from, to, amount }: ConvertParams): Promise<Conversion> {
  const body = await request(
    "convert",
    { from, to, amount: String(amount) },
    { next: { revalidate: 60 } },
  );
  const { response } = parse(convertEnvelopeSchema, body);
  // Unsupported pairs come back as HTTP 200 with `value: 0` instead of an error.
  if (response.value === 0 && amount > 0) {
    throw new UpstreamError(`No exchange rate available for ${from} to ${to}.`, 422);
  }
  return {
    from: response.from,
    to: response.to,
    amount: response.amount,
    value: response.value,
    timestamp: response.timestamp,
  };
}
