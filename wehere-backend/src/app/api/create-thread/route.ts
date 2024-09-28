import { createJsonResponse } from "wehere-backend/src/lib/backend/utils";
import { withDefaultRouteHandler } from "wehere-backend/src/utils/handler";
import { createPusherSubscription } from "wehere-bot/src/bot/operations/pusher_";
import { createThread } from "wehere-bot/src/bot/operations/thread";

import type { Result$CreateThread$WehereBackend as Result } from "./typing";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 24;

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
