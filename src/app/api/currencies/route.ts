import { getCurrencies } from "@/server/currencybeacon";
import { handleRouteError } from "@/server/http";

export async function GET() {
  try {
    const currencies = await getCurrencies();
    return Response.json(currencies, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
