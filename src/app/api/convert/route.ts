import type { NextRequest } from "next/server";
import { z } from "zod";
import { convertParamsSchema } from "@/features/currency-converter/api/contracts";
import { convert } from "@/server/currencybeacon";
import { errorResponse, handleRouteError } from "@/server/http";

export async function GET(request: NextRequest) {
  const params = convertParamsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!params.success) {
    return errorResponse(z.prettifyError(params.error), 400);
  }

  try {
    return Response.json(await convert(params.data));
  } catch (error) {
    return handleRouteError(error);
  }
}
