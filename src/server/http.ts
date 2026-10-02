import "server-only";
import type { ApiErrorBody } from "@/features/currency-converter/api/contracts";
import { UpstreamError } from "./currencybeacon";

export function errorResponse(message: string, status: number) {
  return Response.json({ error: { message } } satisfies ApiErrorBody, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof UpstreamError) {
    return errorResponse(error.message, error.status);
  }
  console.error(error);
  return errorResponse("Something went wrong. Please try again.", 500);
}
