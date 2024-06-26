import { ENV } from "wehere-backend/src/env";
import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { getAvailability } from "wehere-bot/src/bot/operations/availability";
import { PusherClientConfig } from "wehere-bot/src/typing/common";

import type { Result$GetStatus$WehereBackend as Result } from "./typing";

export const dynamic = "force-dynamic";

export const GET = withDefaultRouteHandler(async (_request, ctx) => {
  const availability = await getAvailability(ctx);
  const pusherUrl = new URL(ENV.PUSHER_URI);
  const pusherClientConfig = PusherClientConfig.parse({
    appKey: pusherUrl.searchParams.get("key"),
    cluster: pusherUrl.searchParams.get("cluster"),
  });
  return createJsonResponse(200, {
    availability,
    pusherClientConfig,
  } satisfies Result);
});
