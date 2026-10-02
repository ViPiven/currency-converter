# Currency Converter

Currency converter similar to the one in Google search. Next.js, TypeScript, TanStack Query, Zod, Mantine, data from the [CurrencyBeacon](https://currencybeacon.com) API. The original task is in [ASSIGNMENT.md](./ASSIGNMENT.md).

## Running locally

Requires Node.js 20.9+ and a free CurrencyBeacon API key (https://currencybeacon.com/register, the key is on the dashboard under "API Token Information").

```bash
npm install
cp .env.example .env.local   # add your key
npm run dev
```

The app runs on http://localhost:3000.

Tests: `npm test` for unit/component tests, `npm run test:e2e` for Playwright (needs `npx playwright install chromium` the first time).

## Notes

- The browser doesn't call CurrencyBeacon directly. Two route handlers (`/api/currencies`, `/api/convert`) proxy the requests, so the API key stays on the server.
- The API returns the data under `response` and also duplicates it at the top level in the old format. I only use `response`. The currency id is `short_code` (USD), not `code`, which is the numeric ISO code.
- `/convert` returns `value: 0` with status 200 for pairs it can't convert, so I show an error in that case instead of 0.00.
- Conversion runs while typing (debounced) instead of on a Convert button. The free plan has a request limit, so responses are cached: the currency list for a day, conversions for a minute.
- The amount input respects the number of decimals of the selected currency (e.g. none for JPY).
