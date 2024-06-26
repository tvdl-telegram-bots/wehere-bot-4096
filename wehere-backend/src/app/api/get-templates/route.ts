import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { getTemplates } from "wehere-bot/src/bot/operations/template";

import type { Result$GetTemplates$WehereBackend as Result } from "./typing";

export const dynamic = "force-dynamic";

export const GET = withDefaultRouteHandler(async (_request, ctx) => {
  const templates = await getTemplates(ctx);
  return createJsonResponse(200, { templates } satisfies Result);
});
