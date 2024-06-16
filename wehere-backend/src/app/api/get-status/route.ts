import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { getAvailability } from "wehere-bot/src/bot/operations/availability_";

import type { Result$GetStatus$WehereBackend as Result } from "./typing";

export const GET = withDefaultRouteHandler(async (_request, ctx) => {
  const availability = await getAvailability(ctx);
  return createJsonResponse(200, { availability } satisfies Result);
});
