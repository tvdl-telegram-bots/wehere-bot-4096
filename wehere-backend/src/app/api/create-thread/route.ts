import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { createPusherSubscription } from "wehere-bot/src/bot/operations/pusher_";
import { createThread } from "wehere-bot/src/bot/operations/thread_";

import type { Result$CreateThread$WehereBackend as Result } from "./typing";

export const POST = withDefaultRouteHandler(async (_request, ctx) => {
  const thread = await createThread(ctx, { platform: "web" });
  const pusherSubscription = await createPusherSubscription(ctx, {
    threadId: thread._id,
  });
  return createJsonResponse(200, {
    thread,
    pusherSubscription,
  } satisfies Result);
});
